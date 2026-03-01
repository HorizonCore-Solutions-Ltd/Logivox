import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRuleSchema = z.object({
  warehouseId: z.string({ required_error: "warehouseId is required" }),
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  triggerType: z.enum(["THRESHOLD", "SCHEDULE", "DEMAND_SPIKE"]),
  pendingOrderThreshold: z.number().int().positive().optional(),
  pendingLineThreshold: z.number().int().positive().optional(),
  cronExpression: z.string().optional(),
  defaultWaveType: z
    .enum(["SINGLE_ORDER", "BATCH", "ZONE", "CARRIER", "PRIORITY", "CUSTOM"])
    .default("BATCH"),
  defaultPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .default("NORMAL"),
  defaultStrategy: z
    .enum([
      "FIFO",
      "LIFO",
      "ZONE_BASED",
      "CARRIER_BASED",
      "SHIP_DATE",
      "PRIORITY",
      "SHORTEST_PATH",
      "CUSTOM",
    ])
    .default("FIFO"),
  defaultMaxOrders: z.number().int().positive().optional(),
  defaultMaxLines: z.number().int().positive().optional(),
  shipWindowHours: z.number().int().positive().optional(),
  carrierFilter: z.array(z.string()).optional(),
  cooldownMinutes: z.number().int().min(0).default(30),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ── GET /api/waves/automation-rules ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const triggerType = searchParams.get("triggerType");
    const isActive = searchParams.get("isActive");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };
    if (warehouseId) where.warehouseId = warehouseId;
    if (triggerType) where.triggerType = triggerType;
    if (isActive !== null) where.isActive = isActive === "true";

    const [total, rules] = await Promise.all([
      prisma.waveAutomationRule.count({ where }),
      prisma.waveAutomationRule.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[WaveAutomationRules GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 },
    );
  }
}

// ── POST /api/waves/automation-rules ────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ops_manager / admin may create automation rules
    const allowedRoles = ["admin", "ops_manager", "ADMIN", "OPS_MANAGER"];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createRuleSchema.parse(body);

    // Validate warehouse belongs to org
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: data.warehouseId,
        organizationId: session.user.organizationId,
      },
    });
    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    // Business rule: THRESHOLD rules need at least one threshold value
    if (data.triggerType === "THRESHOLD") {
      if (!data.pendingOrderThreshold && !data.pendingLineThreshold) {
        return NextResponse.json(
          {
            error:
              "THRESHOLD rules require pendingOrderThreshold or pendingLineThreshold",
          },
          { status: 422 },
        );
      }
    }

    // SCHEDULE rules need a cron expression
    if (data.triggerType === "SCHEDULE" && !data.cronExpression) {
      return NextResponse.json(
        { error: "SCHEDULE rules require cronExpression" },
        { status: 422 },
      );
    }

    const rule = await prisma.waveAutomationRule.create({
      data: {
        organizationId: session.user.organizationId,
        warehouseId: data.warehouseId,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        triggerType: data.triggerType,
        pendingOrderThreshold: data.pendingOrderThreshold,
        pendingLineThreshold: data.pendingLineThreshold,
        cronExpression: data.cronExpression,
        defaultWaveType: data.defaultWaveType,
        defaultPriority: data.defaultPriority,
        defaultStrategy: data.defaultStrategy,
        defaultMaxOrders: data.defaultMaxOrders,
        defaultMaxLines: data.defaultMaxLines,
        shipWindowHours: data.shipWindowHours,
        carrierFilter: data.carrierFilter ?? [],
        cooldownMinutes: data.cooldownMinutes,
        tags: data.tags ?? [],
        metadata: data.metadata,
        createdById: session.user.id,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[WaveAutomationRules POST]", error);
    return NextResponse.json(
      { error: "Failed to create automation rule" },
      { status: 500 },
    );
  }
}
