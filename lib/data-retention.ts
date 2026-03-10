import { prisma } from "./prisma";
import { logAudit } from "./audit-service";

export async function executeDataRetentionPolicy() {
  const cutoffDate = new Date();
  // SOC2 / GDPR 90-day retention for non-essential logs
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  try {
    const deletedLogs = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    await logAudit({
      eventType: "DATA_RETENTION_POLICY_EXECUTED",
      action: `Deleted ${deletedLogs.count} old activity logs meeting GDPR criteria.`,
      severity: "INFO",
      success: true,
    });

    return deletedLogs.count;
  } catch (error) {
    console.error("Failed to execute data retention policy:", error);
    throw error;
  }
}
