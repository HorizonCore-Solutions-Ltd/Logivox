/**
 * GET  /api/replenishment        – list replenishment tasks (org-scoped, filterable)
 * POST /api/replenishment        – manually create a replenishment task
 * POST /api/replenishment?action=run-rules – evaluate all active rules and auto-generate tasks
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  warehouseId: z.string(),
  inventoryItemId: z.string(),
  requiredQty: z.number().int().positive(),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  ruleId: z.string().optional(),
  notes: z.string().optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const warehouseId = searchParams.get("warehouseId");
  const priority = searchParams.get("priority");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 25));

  const where: any = { organizationId };
  if (status) where.status = status;
  if (warehouseId) where.warehouseId = warehouseId;
  if (priority) where.priority = priority;

  const [tasks, total] = await Promise.all([
    prisma.replenishmentTask.findMany({
      where,
      include: {
        rule: { select: { id: true, name: true, strategy: true } },
        inventoryItem: {
          select: { id: true, name: true, sku: true, quantity: true },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        fromLocation: { select: { id: true, locationCode: true } },
        toLocation: { select: { id: true, locationCode: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.replenishmentTask.count({ where }),
  ]);

  // summary counts
  const summary = await prisma.replenishmentTask.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: { _all: true },
  });

  return NextResponse.json({
    tasks,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: Object.fromEntries(summary.map((s) => [s.status, s._count._all])),
  });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  const { searchParams } = new URL(request.url);

  // ── Auto-run all active rules ─────────────────────────────────────────────
  // Delegates to the same logic as POST /api/replenishment/run
  if (searchParams.get("action") === "run-rules") {
    const rules = await prisma.replenishmentRule.findMany({
      where: { organizationId, isActive: true },
    });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const rule of rules) {
      if (!rule.warehouseId || !rule.inventoryItemId) {
        skipped.push(rule.id);
        continue;
      }

      const item = await prisma.inventoryItem.findFirst({
        where: { id: rule.inventoryItemId, organizationId },
        select: {
          id: true,
          quantity: true,
          minStockLevel: true,
          reorderPoint: true,
        },
      });
      if (!item) {
        skipped.push(rule.id);
        continue;
      }

      const current = item.quantity || 0;
      let needsReplenishment = false;
      let qty = 0;

      if (rule.strategy === "MIN_MAX") {
        if (current <= (rule.minQty || item.minStockLevel || 0)) {
          needsReplenishment = true;
          qty = (rule.maxQty || rule.minQty * 2) - current;
        }
      } else if (rule.strategy === "REORDER_POINT") {
        if (current <= (rule.reorderPoint || item.reorderPoint || 0)) {
          needsReplenishment = true;
          qty = rule.reorderQty;
        }
      }

      if (!needsReplenishment || qty <= 0) {
        skipped.push(rule.id);
        continue;
      }

      const existing = await prisma.replenishmentTask.findFirst({
        where: {
          organizationId,
          ruleId: rule.id,
          status: { in: ["PENDING", "IN_PROGRESS", "PO_CREATED"] },
        },
      });
      if (existing) {
        skipped.push(rule.id);
        continue;
      }

      await prisma.replenishmentTask.create({
        data: {
          organizationId,
          ruleId: rule.id,
          warehouseId: rule.warehouseId,
          inventoryItemId: rule.inventoryItemId,
          requiredQty: Math.ceil(qty),
          priority: "MEDIUM",
        },
      });
      created.push(rule.id);
    }

    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "REPLENISHMENT_RULES_RUN",
        resourceType: "ReplenishmentTask",
        resourceId: organizationId,
        details: {
          rulesEvaluated: rules.length,
          tasksCreated: created.length,
          skipped: skipped.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      rulesEvaluated: rules.length,
      tasksCreated: created.length,
      skipped: skipped.length,
    });
  }

  // ── Manual create ─────────────────────────────────────────────────────────
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const task = await prisma.replenishmentTask.create({
    data: { organizationId, ...parsed.data },
    include: {
      inventoryItem: { select: { id: true, name: true, sku: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: "REPLENISHMENT_TASK_CREATED",
      resourceType: "ReplenishmentTask",
      resourceId: task.id,
      details: { itemId: task.inventoryItemId, qty: task.requiredQty },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
