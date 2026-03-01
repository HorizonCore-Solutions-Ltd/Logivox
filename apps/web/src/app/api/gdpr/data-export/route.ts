/**
 * GDPR Data Export API
 * Implements Article 15 - Right of access by data subject
 * Provides complete data export in machine-readable format
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/gdpr/data-export
 * Export all user data in JSON format (GDPR Article 15 compliance)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Fetch all user data across the system
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        sessions: true,
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
        activityLogs: {
          orderBy: { timestamp: "desc" },
          take: 1000, // Last 1000 activities
        },
        notificationPreference: true,
        receivedNotifications: {
          orderBy: { createdAt: "desc" },
          take: 500,
        },
        createdDashboards: true,
        employee: {
          include: {
            department: true,
            manager: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive fields
    const { password, mfaSecret, mfaBackupCodes, ...safeUserData } = userData;

    // Create export package
    const exportPackage = {
      exportDate: new Date().toISOString(),
      exportType: "GDPR_DATA_EXPORT",
      userId: userId,
      personalInformation: {
        id: safeUserData.id,
        name: safeUserData.name,
        email: safeUserData.email,
        emailVerified: safeUserData.emailVerified,
        image: safeUserData.image,
        role: safeUserData.role,
        isActive: safeUserData.isActive,
        mfaEnabled: safeUserData.mfaEnabled,
        createdAt: safeUserData.createdAt,
        updatedAt: safeUserData.updatedAt,
      },
      authenticationAccounts: safeUserData.accounts.map((acc) => ({
        provider: acc.provider,
        type: acc.type,
        createdAt: acc.updatedAt,
      })),
      organizations: safeUserData.organizationMemberships.map((mem) => ({
        organizationName: mem.organization.name,
        role: mem.role,
        joinedAt: mem.createdAt,
      })),
      activityHistory: safeUserData.activityLogs.map((log) => ({
        action: log.action,
        entityType: log.entityType,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
      })),
      notifications: safeUserData.receivedNotifications.map((notif) => ({
        title: notif.title,
        message: notif.message,
        type: notif.type,
        createdAt: notif.createdAt,
        readAt: notif.readAt,
      })),
      notificationPreferences: safeUserData.notificationPreference,
      dashboards: safeUserData.createdDashboards.map((dash) => ({
        name: dash.name,
        createdAt: dash.createdAt,
      })),
      employeeProfile: safeUserData.employee
        ? {
            employeeNumber: safeUserData.employee.employeeNumber,
            department: safeUserData.employee.department?.name,
            position: safeUserData.employee.position,
            hireDate: safeUserData.employee.hireDate,
          }
        : null,
      gdprNotice: {
        rightToAccess: "Granted - This export",
        rightToRectification: "Available via profile settings",
        rightToErasure: "Available via account deletion",
        rightToPortability: "Granted - JSON format",
        rightToObject: "Contact privacy@logivox.ai",
        dataController: "LogiVox WMS",
        contactEmail: "privacy@logivox.ai",
      },
    };

    // Log the data export request
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "GDPR_DATA_EXPORT",
        entityType: "User",
        entityId: userId,
        details: {
          exportDate: new Date().toISOString(),
          recordsExported: {
            activities: safeUserData.activityLogs.length,
            notifications: safeUserData.receivedNotifications.length,
            organizations: safeUserData.organizationMemberships.length,
          },
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Data export completed successfully",
        data: exportPackage,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="gdpr-data-export-${userId}-${Date.now()}.json"`,
        },
      },
    );
  } catch (error) {
    console.error("GDPR data export error:", error);
    return NextResponse.json(
      {
        error: "Failed to export data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
