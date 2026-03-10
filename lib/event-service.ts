import { prisma } from "./prisma";

export async function publishEvent(params: {
  eventType: string;
  payload: any;
  aggregateId?: string;
  aggregateType?: string;
}) {
  // Writes to the OutboxEvent table.
  // The outbox pattern guarantees that standard database transaction commits
  // and event publishing are atomically linked.
  return await prisma.outboxEvent.create({
    data: {
      eventType: params.eventType,
      payload: params.payload,
      aggregateId: params.aggregateId,
      aggregateType: params.aggregateType,
      status: "PENDING",
    },
  });
}

/**
 * Worker function to be called by a cron job or background processor
 */
export async function processOutboxEvents() {
  const BATCH_SIZE = 50;

  const events = await prisma.outboxEvent.findMany({
    where: { status: "PENDING" },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    try {
      // Simulate event dispatching to Webhook/SQS/Redis/Dead-Letter Queue
      await dispatchToMessageBroker(event);

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          attempts: { increment: 1 },
        },
      });
    }
  }
}

async function dispatchToMessageBroker(event: any) {
  // Mock external broker dispatch
  // e.g., await redis.publish(event.eventType, JSON.stringify(event.payload));
  return Promise.resolve();
}
