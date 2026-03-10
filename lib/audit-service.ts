import { prisma } from "./prisma";
import { createHash } from "crypto";

export async function logAudit(params: {
  eventType: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  changes?: any;
  metadata?: any;
  success?: boolean;
  errorMessage?: string;
}) {
  try {
    // 1. Transaction to guarantee chain integrity
    return await prisma.$transaction(
      async (tx) => {
        // Find the immediately preceding log to extract its hash
        const lastLog = await tx.auditLog.findFirst({
          orderBy: { timestamp: "desc" },
          select: { hash: true },
        });

        const previousHash =
          lastLog?.hash ||
          "0000000000000000000000000000000000000000000000000000000000000000";

        // Build data payload without hash first
        const dataPayload = {
          eventType: params.eventType,
          severity: params.severity || "INFO",
          userId: params.userId,
          userName: params.userName,
          userEmail: params.userEmail,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          resource: params.resource,
          resourceId: params.resourceId,
          action: params.action,
          changes: params.changes || {},
          metadata: params.metadata || {},
          success: params.success ?? true,
          errorMessage: params.errorMessage,
          previousHash,
        };

        // Create deterministic hash of this record
        const hashContent = JSON.stringify({
          ...dataPayload,
          // Since we don't have the exact PG timestamp yet, we rely on data + previousHash to form an unbreakable chain
          salt: process.env.AUDIT_PEPPER || "logivox-secure-audit-chain-v1",
        });

        const currentHash = createHash("sha256")
          .update(hashContent)
          .digest("hex");

        return await tx.auditLog.create({
          data: {
            ...dataPayload,
            hash: currentHash,
          },
        });
      },
      {
        // Ensure serialized access so chains don't diverge during concurrent inserts
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    // Audit log failures should not break the main transaction, but must be reported
    console.error("Critical Failure: Could not write audit log", error);
  }
}

/**
 * Validates the entire audit log chain in the database for tampering
 */
export async function verifyAuditChain(): Promise<{
  valid: boolean;
  brokenAtRecordId?: string;
}> {
  const allLogs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "asc" },
  });

  let expectedPreviousHash =
    "0000000000000000000000000000000000000000000000000000000000000000";

  for (const log of allLogs) {
    if (log.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAtRecordId: log.id };
    }

    const dataPayload = {
      eventType: log.eventType,
      severity: log.severity,
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      resource: log.resource,
      resourceId: log.resourceId,
      action: log.action,
      changes: log.changes ?? {},
      metadata: log.metadata ?? {},
      success: log.success,
      errorMessage: log.errorMessage,
      previousHash: log.previousHash,
    };

    const hashContent = JSON.stringify({
      ...dataPayload,
      salt: process.env.AUDIT_PEPPER || "logivox-secure-audit-chain-v1",
    });

    const calculatedHash = createHash("sha256")
      .update(hashContent)
      .digest("hex");

    if (calculatedHash !== log.hash) {
      return { valid: false, brokenAtRecordId: log.id };
    }

    expectedPreviousHash = log.hash!;
  }

  return { valid: true };
}
