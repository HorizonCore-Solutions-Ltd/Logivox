import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  triggerType: z.enum(["THRESHOLD", "SCHEDULE", "DEMAND_SPIKE"]).optional(),
  pendingOrderThreshold: z.number().int().positive().nullable().optional(),
  pendingLineThreshold: z.number().int().positive().nullable().optional(),
  cronExpression: z.string().nullable().optional(),
  defaultWaveType: z
    .enum(["SINGLE_ORDER", "BATCH", "ZONE", "CARRIER", "PRIORITY", "CUSTOM"])
    .optional(),
  defaultPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .optional(),
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
    .optional(),
  defaultMaxOrders: z.number().int().positive().nullable().optional(),
  defaultMaxLines: z.number().int().positive().nullable().optional(),
  shipWindowHours: z.number().int().positive().nullable().optional(),
  carrierFilter: z.array(z.string()).optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

// ── GET /api/waves/automation-rules/[id] ────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rule = await prisma.waveAutomationRule.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        executions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            triggeredBy: true,
            waveNumber: true,
            ordersIncluded: true,
            linesIncluded: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Automation rule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[WaveAutomationRule GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch automation rule" },
      { status: 500 },
    );
  }
}

// ── PUT /api/waves/automation-rules/[id] ────────────────────────────────────
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["admin", "ops_manager", "ADMIN", "OPS_MANAGER"];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ownership check
    const existing = await prisma.waveAutomationRule.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Automation rule not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const data = updateRuleSchema.parse(body);

    const updated = await prisma.waveAutomationRule.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.triggerType !== undefined && {
          triggerType: data.triggerType,
        }),
        ...(data.pendingOrderThreshold !== undefined && {
          pendingOrderThreshold: data.pendingOrderThreshold,
        }),
        ...(data.pendingLineThreshold !== undefined && {
          pendingLineThreshold: data.pendingLineThreshold,
        }),
        ...(data.cronExpression !== undefined && {
          cronExpression: data.cronExpression,
        }),
        ...(data.defaultWaveType !== undefined && {
          defaultWaveType: data.defaultWaveType,
        }),
        ...(data.defaultPriority !== undefined && {
          defaultPriority: data.defaultPriority,
        }),
        ...(data.defaultStrategy !== undefined && {
          defaultStrategy: data.defaultStrategy,
        }),
        ...(data.defaultMaxOrders !== undefined && {
          defaultMaxOrders: data.defaultMaxOrders,
        }),
        ...(data.defaultMaxLines !== undefined && {
          defaultMaxLines: data.defaultMaxLines,
        }),
        ...(data.shipWindowHours !== undefined && {
          shipWindowHours: data.shipWindowHours,
        }),
        ...(data.carrierFilter !== undefined && {
          carrierFilter: data.carrierFilter,
        }),
        ...(data.cooldownMinutes !== undefined && {
          cooldownMinutes: data.cooldownMinutes,
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[WaveAutomationRule PUT]", error);
    return NextResponse.json(
      { error: "Failed to update automation rule" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/waves/automation-rules/[id] ──────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["admin", "ops_manager", "ADMIN", "OPS_MANAGER"];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.waveAutomationRule.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Automation rule not found" },
        { status: 404 },
      );
    }

    await prisma.waveAutomationRule.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Automation rule deleted" });
  } catch (error) {
    console.error("[WaveAutomationRule DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete automation rule" },
      { status: 500 },
    );
  }
}
