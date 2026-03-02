/**
 * GET  /api/replenishment/simulate        – list simulation runs
 * POST /api/replenishment/simulate        – create and execute a simulation run
 * GET  /api/replenishment/simulate/:id    – get a specific run with all scenarios
 *
 * The digital-twin simulation evaluates multiple "what-if" scenarios
 * (e.g. demand+20%, supplier lead-time+2 days) against active replenishment
 * rules without touching live inventory data.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const simScenarioSchema = z.object({
  label: z.string(),
  demandMultiplier: z.number().min(0.1).max(10).default(1),
  leadTimeAddDays: z.number().int().min(-30).max(60).default(0),
  safetyStockMultiplier: z.number().min(0).max(5).default(1),
});

const createSimSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  warehouseId: z.string().optional(),
  horizonDays: z.number().int().min(1).max(365).default(30),
  scenarios: z.array(simScenarioSchema).min(1).max(10),
  parameters: z.record(z.unknown()).default({}),
});

// ── Simulation engine ─────────────────────────────────────────────────────────

async function runScenario(
  organizationId: string,
  warehouseId: string | undefined,
  horizonDays: number,
  scenario: z.infer<typeof simScenarioSchema>,
): Promise<{
  tasksCreated: number;
  totalCostEstimate: number;
  fillRate: number;
  stockoutsDetected: number;
  details: Array<{
    ruleId: string;
    ruleName: string;
    itemSku: string;
    currentStock: number;
    projectedDemand: number;
    replenQty: number;
    action: string;
  }>;
}> {
  const rules = await prisma.replenishmentRule.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(warehouseId && { warehouseId }),
    },
    include: {
      inventoryItem: {
        select: {
          id: true,
          sku: true,
          quantity: true,
          minStockLevel: true,
          maxStockLevel: true,
          leadTimeDays: true,
        },
      },
    },
  });

  const details: Array<{
    ruleId: string;
    ruleName: string;
    itemSku: string;
    currentStock: number;
    projectedDemand: number;
    replenQty: number;
    action: string;
  }> = [];

  let tasksCreated = 0;
  let stockoutsDetected = 0;
  let totalCostEstimate = 0;

  for (const rule of rules) {
    const items = rule.inventoryItem
      ? [rule.inventoryItem]
      : await prisma.inventoryItem.findMany({
          where: {
            organizationId,
            ...(warehouseId && { warehouseId }),
          },
          select: {
            id: true,
            sku: true,
            quantity: true,
            minStockLevel: true,
            maxStockLevel: true,
            leadTimeDays: true,
          },
          take: 100,
        });

    for (const item of items) {
      if (!item) continue;
      const current = item.quantity ?? 0;

      // Daily demand from historical data, scaled by multiplier
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const agg = await prisma.salesOrderItem.aggregate({
        where: { inventoryItemId: item.id },
        _sum: { quantity: true },
      });
      const historicDaily = (agg._sum.quantity ?? 0) / 30;
      const projectedDemand =
        historicDaily * scenario.demandMultiplier * horizonDays;

      // Adjust threshold for lead time change
      const effectiveLeadTime =
        (rule.leadTimeDays ?? 3) + scenario.leadTimeAddDays;
      const threshold =
        Math.ceil(
          historicDaily * scenario.demandMultiplier * effectiveLeadTime,
        ) * scenario.safetyStockMultiplier;

      let action = "NO_ACTION";
      let replenQty = 0;

      if (current <= threshold) {
        replenQty = Math.max(
          0,
          (rule.maxQty || item.maxStockLevel || threshold * 2) - current,
        );
        action = replenQty > 0 ? "REPLENISH" : "NO_ACTION";
        if (replenQty > 0) tasksCreated++;
        if (current === 0) stockoutsDetected++;
        // Rough cost estimate: $2 labour + $0.5/unit
        totalCostEstimate += 2 + replenQty * 0.5;
      }

      details.push({
        ruleId: rule.id,
        ruleName: rule.name,
        itemSku: item.sku,
        currentStock: current,
        projectedDemand: Math.round(projectedDemand * 10) / 10,
        replenQty,
        action,
      });
    }
  }

  const totalItems = details.length;
  const fillRate =
    totalItems > 0
      ? Math.round(((totalItems - stockoutsDetected) / totalItems) * 100 * 10) /
        10
      : 100;

  return {
    tasksCreated,
    totalCostEstimate,
    fillRate,
    stockoutsDetected,
    details,
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const runs = await prisma.replenishmentSimRun.findMany({
    where: {
      organizationId,
      ...(status && { status }),
    },
    include: {
      scenarios: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ runs });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  // Check feature flag
  const flags = await prisma.replenishmentFeatureFlag.findUnique({
    where: { organizationId },
  });
  if (flags && !flags.digitalTwin)
    return NextResponse.json(
      { error: "Digital twin simulation feature is not enabled." },
      { status: 403 },
    );

  const body = await request.json();
  const parsed = createSimSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const { name, description, warehouseId, horizonDays, scenarios, parameters } =
    parsed.data;

  // Create the run record
  const run = await prisma.replenishmentSimRun.create({
    data: {
      organizationId,
      name,
      description,
      warehouseId,
      horizonDays,
      parameters,
      status: "RUNNING",
      startedAt: new Date(),
      createdById: session.user.id,
    },
  });

  try {
    const scenarioResults = [];

    for (const scenario of scenarios) {
      const result = await runScenario(
        organizationId,
        warehouseId,
        horizonDays,
        scenario,
      );

      const saved = await prisma.replenishmentSimScenario.create({
        data: {
          simRunId: run.id,
          label: scenario.label,
          parameters: scenario as any,
          results: result as any,
        },
      });

      scenarioResults.push({ ...saved, result });
    }

    // Summarise across all scenarios
    const summary = {
      scenariosRan: scenarios.length,
      worstCaseTasks: Math.max(
        ...scenarioResults.map((s) => (s.result as any).tasksCreated),
      ),
      bestCaseFillRate: Math.max(
        ...scenarioResults.map((s) => (s.result as any).fillRate),
      ),
      worstCaseStockouts: Math.max(
        ...scenarioResults.map((s) => (s.result as any).stockoutsDetected),
      ),
    };

    await prisma.replenishmentSimRun.update({
      where: { id: run.id },
      data: { status: "DONE", completedAt: new Date(), resultSummary: summary },
    });

    return NextResponse.json(
      { run: { ...run, resultSummary: summary }, scenarios: scenarioResults },
      { status: 201 },
    );
  } catch (err: any) {
    await prisma.replenishmentSimRun.update({
      where: { id: run.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
