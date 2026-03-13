export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAlertRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  category: z.enum([
    "INVENTORY",
    "SALES",
    "PURCHASING",
    "WAREHOUSE",
    "QUALITY",
    "FINANCIAL",
    "SYSTEM",
    "SECURITY",
    "PERFORMANCE",
    "CUSTOM",
  ]),
  alertType: z.enum([
    "THRESHOLD",
    "ANOMALY",
    "STATUS_CHANGE",
    "SCHEDULE",
    "EVENT",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  triggerEntity: z.string().min(1, "Trigger entity is required"),
  triggerConditions: z.record(z.any()),
  triggerFrequency: z
    .enum([
      "REALTIME",
      "EVERY_MINUTE",
      "EVERY_5_MINUTES",
      "EVERY_15_MINUTES",
      "HOURLY",
      "DAILY",
    ])
    .default("REALTIME"),
  metricCode: z.string().optional(),
  threshold: z.number().optional(),
  thresholdOperator: z.enum(["GT", "LT", "GTE", "LTE", "EQ", "NE"]).optional(),
  templateId: z.string().optional(),
  notificationChannels: z
    .array(z.string())
    .min(1, "At least one channel required"),
  recipientType: z.enum(["USER", "ROLE", "CUSTOM", "DYNAMIC"]),
  recipients: z.record(z.any()),
  activeHoursStart: z.string().optional(),
  activeHoursEnd: z.string().optional(),
  activeDays: z.array(z.string()).optional(),
  throttlePeriod: z.number().optional(),
  maxAlertsPerDay: z.number().optional(),
  isActive: z.boolean().default(true),
  requireAcknowledgment: z.boolean().default(false),
  autoResolve: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// GET /api/alerts/rules - List alert rules
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const alertType = searchParams.get("alertType");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: any = {
      organizationId,
    };

    if (category) where.category = category;
    if (alertType) where.alertType = alertType;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const rules = await prisma.alertRule.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert rules" },
      { status: 500 },
    );
  }
}

// POST /api/alerts/rules - Create alert rule
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validated = createAlertRuleSchema.parse(body);

    // Check for duplicate code
    const existing = await prisma.alertRule.findFirst({
      where: {
        organizationId,
        code: validated.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Alert rule code already exists" },
        { status: 400 },
      );
    }

    // Create alert rule
    const rule = await prisma.alertRule.create({
      data: {
        organizationId,
        createdById: user.id,
        ...validated,
      },
      include: {
        template: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating alert rule:", error);
    return NextResponse.json(
      { error: "Failed to create alert rule" },
      { status: 500 },
    );
  }
}
