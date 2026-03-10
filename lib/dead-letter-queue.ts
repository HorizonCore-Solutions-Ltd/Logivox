import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface RequeueConfig {
  maxRetries?: number;
  decayMinutes?: number;
}

/**
 * Handles processing events with an aggressive retry and decay algorithm
 * before ultimately parking them in the Dead Letter Queue.
 */
export async function processWithDLQ<T>(
  eventId: string,
  source: string,
  payload: any,
  config: RequeueConfig,
  processor: () => Promise<T>,
): Promise<boolean> {
  const maxRetries = config.maxRetries || 3;

  try {
    // 1. Execute logic
    await processor();

    // 2. Remove from outbox if it exists and was successfully completed
    await prisma.outboxEvent.updateMany({
      where: { id: eventId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });

    return true;
  } catch (error: any) {
    // Determine number of retries already attempted by querying Outbox or an equivalent event tracking system
    const outboxRecord = await prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });

    const attempts = outboxRecord ? outboxRecord.attempts + 1 : 1;
    const isExhausted = attempts >= maxRetries;

    if (isExhausted) {
      // 3. Move/Park inside Dead Letter Queue
      await prisma.$transaction([
        prisma.deadLetterEvent.upsert({
          where: { originalEventId: eventId },
          update: {
            failedReason:
              error.stack || error.message || "Unknown final failure",
            lastAttemptAt: new Date(),
          },
          create: {
            originalEventId: eventId,
            source,
            payload,
            failedReason:
              error.stack || error.message || "Unknown final failure",
            lastAttemptAt: new Date(),
          },
        }),
        prisma.outboxEvent.updateMany({
          where: { id: eventId },
          data: { status: "DEAD_LETTER", attempts, error: error.message },
        }),
      ]);
    } else {
      // 4. Increment Outbox retries
      if (outboxRecord) {
        await prisma.outboxEvent.update({
          where: { id: eventId },
          data: { attempts, error: error.message },
        });
      }
    }

    // Explicitly do not throw if this is an async job queue (to prevent infinite looping)
    // We let the DLQ and idempotency manage retry boundaries
    return false;
  }
}

/**
 * Sweeps the dead letter queue for a manual administration replay
 */
export async function replayDeadLetterQueueEvent(
  deadLetterEventId: string,
  replayProcessor: (payload: any) => Promise<boolean>,
) {
  const dlqEvent = await prisma.deadLetterEvent.findUnique({
    where: { id: deadLetterEventId },
  });

  if (!dlqEvent || dlqEvent.resolved) {
    return false; // Safely abort
  }

  try {
    const success = await replayProcessor(dlqEvent.payload);

    if (success) {
      await prisma.$transaction([
        prisma.deadLetterEvent.update({
          where: { id: deadLetterEventId },
          data: { resolved: true, resolvedAt: new Date() },
        }),
        prisma.outboxEvent.updateMany({
          where: { id: dlqEvent.originalEventId },
          data: { status: "COMPLETED", processedAt: new Date() },
        }),
      ]);
      return true;
    }
  } catch (error) {
    return false; // Still failing
  }
  return false;
}
