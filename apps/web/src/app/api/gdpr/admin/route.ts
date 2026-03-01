/**
 * GDPR Admin API
 * Administrative endpoints for handling GDPR requests
 * Requires admin privileges
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { randomBytes } from "crypto";

/**
 * POST /api/gdpr/admin/process-deletion
 * Admin endpoint to process user deletion requests
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    if (!hasPermission(session.user.role, "users:delete")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Prevent deleting super admin accounts
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete super admin accounts" },
        { status: 403 },
      );
    }

    const anonymousId = `deleted_${randomBytes(16).toString("hex")}`;
    const deletionDate = new Date();

    // Log admin action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "GDPR_ADMIN_DELETION_INITIATED",
        entityType: "User",
        entityId: userId,
        details: {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
          initiatedBy: session.user.email,
          reason: reason || "Admin-initiated GDPR deletion",
          timestamp: deletionDate.toISOString(),
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Perform anonymization
    await prisma.$transaction(async (tx) => {
      // Anonymize user
      await tx.user.update({
        where: { id: userId },
        data: {
          name: `Deleted User ${anonymousId}`,
          email: `${anonymousId}@deleted.logivox.local`,
          emailVerified: null,
          image: null,
          password: null,
          mfaSecret: null,
          mfaBackupCodes: [],
          mfaEnabled: false,
          isActive: false,
        },
      });

      // Delete related data
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.organizationMember.deleteMany({ where: { userId } });

      // Anonymize activity logs
      await tx.activityLog.updateMany({
        where: { userId },
        data: {
          details: {
            anonymized: true,
            deletionDate: deletionDate.toISOString(),
          },
        },
      });

      // Create completion log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "GDPR_ADMIN_DELETION_COMPLETED",
          entityType: "User",
          entityId: userId,
          details: {
            completedBy: session.user.email,
            completionDate: deletionDate.toISOString(),
            anonymizedId: anonymousId,
            originalEmail: targetUser.email,
            reason: reason || "Admin-initiated GDPR deletion",
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "User data deletion completed successfully",
      details: {
        userId: userId,
        anonymizedId: anonymousId,
        deletionDate: deletionDate.toISOString(),
        processedBy: session.user.email,
      },
    });
  } catch (error) {
    console.error("Admin GDPR deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process deletion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/gdpr/admin/requests
 * List all GDPR requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, "users:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all GDPR-related activity logs
    const gdprLogs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: [
            "GDPR_DATA_EXPORT",
            "GDPR_DATA_DELETION_REQUESTED",
            "GDPR_DATA_DELETION_COMPLETED",
            "GDPR_ADMIN_DELETION_INITIATED",
            "GDPR_ADMIN_DELETION_COMPLETED",
          ],
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      requests: gdprLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityId: log.entityId,
        timestamp: log.timestamp,
        details: log.details,
        ipAddress: log.ipAddress,
      })),
      total: gdprLogs.length,
    });
  } catch (error) {
    console.error("Error fetching GDPR requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
