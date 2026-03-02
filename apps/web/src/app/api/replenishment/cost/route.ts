/**
 * GET  /api/replenishment/cost   – aggregated cost analytics
 * POST /api/replenishment/cost   – manually log a cost record for a task
 *
 * The cost engine is fed automatically when tasks complete (via the run callback),
 * but this endpoint also allows back-office entry and analytics reporting.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const logSchema = z.object({
  taskId: z.string(),
  labourCostUsd: z.number().min(0).default(0),
  equipmentCostUsd: z.number().min(0).default(0),
  congestionCostUsd: z.number().min(0).default(0),
  robotCostUsd: z.number().min(0).default(0),
  storageCostUsd: z.number().min(0).default(0),
  labourMinutes: z.number().int().min(0).default(0),
  distanceMetres: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get("warehouseId");
  const from = searchParams.get("from"); // ISO date string
  const to = searchParams.get("to"); // ISO date string
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 50));

  const dateFilter = {} as any;
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const where: any = {
    organizationId,
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    ...(warehouseId && {
      task: { warehouseId },
    }),
  };

  const [logs, total] = await Promise.all([
    prisma.replenishmentCostLog.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            status: true,
            triggerSource: true,
            requiredQty: true,
            replenUnit: true,
            inventoryItem: { select: { name: true, sku: true } },
            warehouse: { select: { name: true, code: true } },
            rule: { select: { name: true, strategy: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.replenishmentCostLog.count({ where }),
  ]);

  // Aggregate totals
  const agg = await prisma.replenishmentCostLog.aggregate({
    where,
    _sum: {
      labourCostUsd: true,
      equipmentCostUsd: true,
      congestionCostUsd: true,
      robotCostUsd: true,
      storageCostUsd: true,
      totalCostUsd: true,
      labourMinutes: true,
      distanceMetres: true,
    },
    _avg: {
      totalCostUsd: true,
      costPerUnit: true,
      labourMinutes: true,
    },
    _count: { _all: true },
  });

  // Breakdown by trigger source
  const byTrigger = await prisma.replenishmentCostLog.groupBy({
    by: [],
    where,
    // Note: groupBy on nested task.triggerSource not supported directly;
    // we return per-log data and let the client aggregate if needed.
  });

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: {
      totalTasks: agg._count._all,
      totalCostUsd: Number(agg._sum.totalCostUsd ?? 0),
      avgCostUsd: Number(agg._avg.totalCostUsd ?? 0),
      avgCostPerUnit: Number(agg._avg.costPerUnit ?? 0),
      totalLabourMinutes: agg._sum.labourMinutes ?? 0,
      totalDistanceMetres: agg._sum.distanceMetres ?? 0,
      breakdown: {
        labourCostUsd: Number(agg._sum.labourCostUsd ?? 0),
        equipmentCostUsd: Number(agg._sum.equipmentCostUsd ?? 0),
        congestionCostUsd: Number(agg._sum.congestionCostUsd ?? 0),
        robotCostUsd: Number(agg._sum.robotCostUsd ?? 0),
        storageCostUsd: Number(agg._sum.storageCostUsd ?? 0),
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  // Verify task belongs to org
  const task = await prisma.replenishmentTask.findFirst({
    where: { id: parsed.data.taskId, organizationId },
  });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const total =
    parsed.data.labourCostUsd +
    parsed.data.equipmentCostUsd +
    parsed.data.congestionCostUsd +
    parsed.data.robotCostUsd +
    parsed.data.storageCostUsd;

  const costPerUnit =
    task.requiredQty > 0 ? total / task.requiredQty : undefined;

  const log = await prisma.replenishmentCostLog.upsert({
    where: { taskId: parsed.data.taskId },
    update: {
      ...parsed.data,
      totalCostUsd: total,
      costPerUnit: costPerUnit ?? undefined,
    },
    create: {
      organizationId,
      ...parsed.data,
      totalCostUsd: total,
      costPerUnit: costPerUnit ?? undefined,
    },
  });

  // Keep actualCostUsd in sync on the task
  await prisma.replenishmentTask.update({
    where: { id: task.id },
    data: { actualCostUsd: total, labourMinutes: parsed.data.labourMinutes },
  });

  return NextResponse.json({ log }, { status: 201 });
}
