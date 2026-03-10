import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface IdempotencyConfig {
  key: string;
  eventType: string;
  ttlHours?: number; // How long to persist the idempotency record
}

/**
 * Executes a callback exactly once based on the provided idempotent key.
 * Prevents concurrent dual-execution of the same logic (like webhooks or multi-clicks).
 */
export async function withIdempotency<T>(
  config: IdempotencyConfig,
  callback: () => Promise<T>,
): Promise<{
  status: "COMPLETED" | "ALREADY_COMPLETED" | "IN_PROGRESS" | "FAILED";
  result?: T;
  error?: string;
}> {
  const ttl = new Date();
  ttl.setHours(ttl.getHours() + (config.ttlHours || 24));

  // 1. Attempt to insert the idempotency key atomically
  let reservation;
  try {
    reservation = await prisma.idempotencyKey.create({
      data: {
        key: config.key,
        eventType: config.eventType,
        status: "IN_PROGRESS",
        ttl,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      // Unique constraint violation (Key exists)
      reservation = await prisma.idempotencyKey.findUnique({
        where: { key: config.key },
      });
    } else {
      throw error;
    }
  }

  if (!reservation) {
    throw new Error(
      "Failed to acquire idempotency lock via atomic insert or subsequent read.",
    );
  }

  if (reservation.status === "COMPLETED") {
    return {
      status: "ALREADY_COMPLETED",
      result: reservation.responseContext as unknown as T,
    };
  }

  const isStaleLock =
    reservation.status === "IN_PROGRESS" &&
    Date.now() - reservation.lockedAt.getTime() > 5 * 60 * 1000;

  if (
    reservation.status === "IN_PROGRESS" &&
    !isStaleLock &&
    reservation.lockedAt.getTime() < Date.now() - 1000
  ) {
    // It's actively locked by another node right now, bail and maybe DLQ retry later.
    return {
      status: "IN_PROGRESS",
      error:
        "Mismatched lock. Another worker is processing this event right now.",
    };
  }

  if (isStaleLock) {
    // Take over the stale lock
    await prisma.idempotencyKey.update({
      where: { key: config.key, status: "IN_PROGRESS" },
      data: { lockedAt: new Date() },
    });
  }

  try {
    // Execute business logic transaction
    const result = await callback();

    // Mark completed
    await prisma.idempotencyKey.update({
      where: { key: config.key },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        responseContext: result ?? {},
      },
    });

    return { status: "COMPLETED", result };
  } catch (error: any) {
    // Mark failed
    await prisma.idempotencyKey.update({
      where: { key: config.key },
      data: {
        status: "FAILED",
        errorMessage:
          error.message || "Unknown error during idempotent execution",
      },
    });

    throw error;
  }
}
