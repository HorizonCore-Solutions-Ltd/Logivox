import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const alertSchema = z.object({
  alertType: z.enum([
    "UNAUTHORIZED_ACCESS",
    "TAILGATING",
    "LOITERING",
    "BLACKLIST_DETECTED",
    "VISITOR_OVERDUE",
    "ZONE_BREACH",
    "AFTER_HOURS_ACCESS",
    "FORCED_ENTRY",
    "CAMERA_OFFLINE",
    "MULTIPLE_FAILED_ACCESS",
    "SUSPICIOUS_BEHAVIOR",
    "EMERGENCY",
    "SYSTEM_MALFUNCTION",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  title: z.string().min(1),
  description: z.string(),
  warehouseId: z.string().optional(),
  location: z.string().optional(),
  zoneId: z.string().optional(),
  relatedEntity: z.string().optional(),
  relatedEntityId: z.string().optional(),
  triggerSource: z.string().optional(),
  metadata: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const alertType = searchParams.get("alertType");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (alertType) where.alertType = alertType;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.triggerTime = {};
      if (startDate) where.triggerTime.gte = new Date(startDate);
      if (endDate) where.triggerTime.lte = new Date(endDate);
    }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { triggerTime: "desc" },
      }),
      prisma.securityAlert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching security alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch security alerts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = alertSchema.parse(body);

    const alert = await prisma.securityAlert.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        status: "ACTIVE",
        triggeredBy: session.user.id,
      },
    });

    // Send notifications based on severity
    if (alert.severity === "CRITICAL" || alert.severity === "HIGH") {
      await this.notifySecurityTeam(alert);
    }

    // Auto-create incident for critical alerts
    if (alert.severity === "CRITICAL") {
      const incident = await prisma.securityIncident.create({
        data: {
          organizationId: session.user.organizationId,
          incidentNumber: `INC${Date.now()}`, // Temporary
          incidentType: alert.alertType as any,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          location: alert.location || "Unknown",
          incidentTime: alert.triggerTime,
          reportedById: session.user.id,
          status: "REPORTED",
        },
      });

      await prisma.securityAlert.update({
        where: { id: alert.id },
        data: {
          incidentCreated: true,
          incidentId: incident.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "SECURITY_ALERT",
        entityId: alert.id,
        description: `Security alert triggered: ${alert.title}`,
        metadata: {
          alertType: alert.alertType,
          severity: alert.severity,
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating security alert:", error);
    return NextResponse.json(
      { error: "Failed to create security alert" },
      { status: 500 },
    );
  }

  async function notifySecurityTeam(alert: any) {
    // Get all active security personnel
    const securityTeam = await prisma.securityPersonnel.findMany({
      where: {
        organizationId: alert.organizationId,
        status: "ACTIVE",
        isActive: true,
      },
      select: { email: true, firstName: true, lastName: true },
    });

    for (const person of securityTeam.filter((p) => p.email)) {
      await prisma.securityNotification.create({
        data: {
          organizationId: alert.organizationId,
          type: "SECURITY_ALERT",
          priority: alert.severity === "CRITICAL" ? "URGENT" : "HIGH",
          title: `Security Alert: ${alert.title}`,
          message: alert.description,
          recipientType: "SECURITY_PERSONNEL",
          recipientEmail: person.email,
          recipientName: `${person.firstName} ${person.lastName}`,
          deliveryMethod: "EMAIL",
          status: "PENDING",
          relatedEntity: "SECURITY_ALERT",
          relatedEntityId: alert.id,
          actionUrl: `/security/alerts/${alert.id}`,
        },
      });
    }
  }
}
