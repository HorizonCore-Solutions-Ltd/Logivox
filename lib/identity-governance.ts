import { prisma } from "./prisma";

export async function detectAndLogRoleEscalation(
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  adminRole: string
) {
  // Enforce zero-trust escalation rules
  if (newRole === "SUPER_ADMIN" && adminRole !== "SUPER_ADMIN") {
    throw new Error("SECURITY_VIOLATION: Only Super Admins can promote other Super Admins.");
  }

  // Log to Audit table
  await prisma.activityLog.create({
    data: {
      action: "ROLE_ESCALATION",
      entityType: "USER",
      entityId: targetUserId,
      description: `Role escalated from ${oldRole} to ${newRole} by user ${adminUserId}`,
      userId: adminUserId,
      ipAddress: "identity-governance-module",
      userAgent: "backend",
    }
  });

  return true;
}
