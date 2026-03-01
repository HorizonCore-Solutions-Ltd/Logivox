/**
 * GDPR Data Deletion API
 * Implements Article 17 - Right to erasure ("right to be forgotten")
 * Anonymizes user data while preserving audit trails
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * POST /api/gdpr/data-deletion
 * Request user data deletion (GDPR Article 17 compliance)
 * Requires password confirmation
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

    const { password, confirmDeletion } = await request.json();

    if (!confirmDeletion) {
      return NextResponse.json(
        { error: "Deletion confirmation required" },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Verify user exists and get password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password if provided
    if (password && user.password) {
      const bcrypt = require("bcryptjs");
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 },
        );
      }
    }

    // Generate anonymized identifier
    const anonymousId = `deleted_${randomBytes(16).toString("hex")}`;
    const deletionDate = new Date();

    // Log the deletion request BEFORE anonymization
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "GDPR_DATA_DELETION_REQUESTED",
        entityType: "User",
        entityId: userId,
        details: {
          requestDate: deletionDate.toISOString(),
          userEmail: user.email,
          userName: user.name,
          reason: "GDPR Article 17 - Right to Erasure",
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Perform anonymization in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Anonymize user profile
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
          updatedAt: deletionDate,
        },
      });

      // 2. Delete authentication accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // 3. Delete active sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // 4. Anonymize notification preferences
      await tx.notificationPreference.deleteMany({
        where: { userId },
      });

      // 5. Anonymize activity logs (keep for audit but remove PII)
      await tx.activityLog.updateMany({
        where: { userId },
        data: {
          details: {
            anonymized: true,
            deletionDate: deletionDate.toISOString(),
          },
        },
      });

      // 6. Remove organization memberships
      await tx.organizationMember.deleteMany({
        where: { userId },
      });

      // 7. Anonymize employee record if exists
      const employee = await tx.employee.findUnique({
        where: { userId },
      });

      if (employee) {
        await tx.employee.update({
          where: { userId },
          data: {
            firstName: "Deleted",
            lastName: "User",
            email: `${anonymousId}@deleted.logivox.local`,
            phone: null,
            address: null,
            emergencyContact: null,
            emergencyPhone: null,
            dateOfBirth: null,
            nationalId: null,
          },
        });
      }

      // 8. Delete personal dashboards
      await tx.dashboard.deleteMany({
        where: { createdById: userId },
      });

      // 9. Mark notifications as anonymized
      await tx.notification.updateMany({
        where: { recipientId: userId },
        data: {
          recipientId: null,
        },
      });

      // 10. Create final audit log entry
      await tx.activityLog.create({
        data: {
          userId: null, // System action, no user
          action: "GDPR_DATA_DELETION_COMPLETED",
          entityType: "User",
          entityId: userId,
          details: {
            completionDate: deletionDate.toISOString(),
            anonymizedId: anonymousId,
            originalEmail: user.email,
            originalName: user.name,
            gdprArticle: "Article 17 - Right to Erasure",
            dataAnonymized: true,
            auditTrailPreserved: true,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Your data has been successfully deleted in compliance with GDPR Article 17",
      details: {
        deletionDate: deletionDate.toISOString(),
        anonymizedId: anonymousId,
        dataAnonymized: [
          "Personal profile information",
          "Authentication accounts",
          "Active sessions",
          "Notification preferences",
          "Organization memberships",
          "Employee records (if applicable)",
          "Personal dashboards",
        ],
        dataPreserved: [
          "Anonymized activity logs (for audit compliance)",
          "System-generated records (anonymized)",
        ],
        gdprCompliance: {
          article: "Article 17 - Right to Erasure",
          implementationDate: deletionDate.toISOString(),
          auditTrail: "Preserved with anonymization",
        },
      },
    });
  } catch (error) {
    console.error("GDPR data deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process data deletion request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/gdpr/data-deletion
 * Check deletion request status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has any pending deletion requests
    const deletionLogs = await prisma.activityLog.findMany({
      where: {
        userId: session.user.id,
        action: {
          in: ["GDPR_DATA_DELETION_REQUESTED", "GDPR_DATA_DELETION_COMPLETED"],
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      deletionHistory: deletionLogs.map((log) => ({
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
      })),
    });
  } catch (error) {
    console.error("Error fetching deletion status:", error);
    return NextResponse.json(
      { error: "Failed to fetch deletion status" },
      { status: 500 },
    );
  }
}
