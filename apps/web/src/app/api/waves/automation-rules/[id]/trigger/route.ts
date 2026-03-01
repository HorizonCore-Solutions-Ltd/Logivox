import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/waves/automation-rules/[id]/trigger
 *
 * Manually (or programmatically) evaluates a WaveAutomationRule and, when
 * conditions are satisfied, creates a WavePick and records a
 * WaveAutomationExecution.
 *
 * For THRESHOLD rules  → fires if current pending-order or pending-line count
 *                         exceeds the configured threshold.
 * For SCHEDULE rules   → fires unconditionally (scheduler calls this endpoint).
 * For DEMAND_SPIKE     → fires if pending orders exceed 2× average of last 7 days.
 *
 * Cooldown is always enforced: if the rule fired within cooldownMinutes, the
 * request is rejected with 429.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const startedAt = new Date();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["admin", "ops_manager", "ADMIN", "OPS_MANAGER"];
    const triggeredBy = allowedRoles.includes(session.user.role ?? "")
      ? (session.user.name ?? session.user.email ?? "manual")
      : "SYSTEM";

    if (
      triggeredBy === "SYSTEM" &&
      !allowedRoles.includes(session.user.role ?? "")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 1. Load rule ────────────────────────────────────────────────────────
    const rule = await prisma.waveAutomationRule.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Automation rule not found" },
        { status: 404 },
      );
    }

    if (!rule.isActive) {
      return NextResponse.json({ error: "Rule is disabled" }, { status: 409 });
    }

    // ── 2. Cooldown check ───────────────────────────────────────────────────
    if (rule.lastFiredAt) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      const elapsed = Date.now() - rule.lastFiredAt.getTime();
      if (elapsed < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 60000);
        return NextResponse.json(
          {
            error: "Cooldown active",
            remainingMinutes,
            lastFiredAt: rule.lastFiredAt,
          },
          { status: 429 },
        );
      }
    }

    // ── 3. Build candidate order filter ────────────────────────────────────
    const orderWhere: Record<string, unknown> = {
      organizationId: session.user.organizationId,
      warehouseId: rule.warehouseId,
      status: { in: ["APPROVED", "PICKING"] },
    };

    // Ship-window filter
    if (rule.shipWindowHours) {
      const cutoff = new Date(
        Date.now() + rule.shipWindowHours * 60 * 60 * 1000,
      );
      orderWhere.shipDate = { lte: cutoff };
    }

    // Carrier filter
    if (rule.carrierFilter && rule.carrierFilter.length > 0) {
      orderWhere.carrierCode = { in: rule.carrierFilter };
    }

    // ── 4. Evaluate trigger conditions ──────────────────────────────────────
    const [pendingOrderCount, pendingLineCount] = await Promise.all([
      prisma.salesOrder.count({ where: orderWhere }),
      prisma.salesOrderItem.count({
        where: {
          salesOrder: orderWhere as Record<string, unknown>,
        },
      }),
    ]);

    let conditionMet = false;
    let triggerReason = "";

    if (rule.triggerType === "THRESHOLD") {
      const orderMet =
        rule.pendingOrderThreshold != null &&
        pendingOrderCount >= rule.pendingOrderThreshold;
      const lineMet =
        rule.pendingLineThreshold != null &&
        pendingLineCount >= rule.pendingLineThreshold;
      conditionMet = orderMet || lineMet;
      triggerReason = orderMet
        ? `${pendingOrderCount} pending orders ≥ threshold ${rule.pendingOrderThreshold}`
        : `${pendingLineCount} pending lines ≥ threshold ${rule.pendingLineThreshold}`;
    } else if (rule.triggerType === "SCHEDULE") {
      // Schedule-based triggers always fire when called
      conditionMet = true;
      triggerReason = `Scheduled trigger (cron: ${rule.cronExpression})`;
    } else if (rule.triggerType === "DEMAND_SPIKE") {
      // Spike = current pending > 2× 7-day rolling hourly average
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const historicCount = await prisma.salesOrder.count({
        where: {
          organizationId: session.user.organizationId,
          warehouseId: rule.warehouseId,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      const avgPerHour = historicCount / (7 * 24);
      const spikeThreshold = avgPerHour * 2;
      conditionMet = pendingOrderCount > spikeThreshold;
      triggerReason = `Demand spike: ${pendingOrderCount} pending > ${spikeThreshold.toFixed(1)} (2× hourly avg)`;
    }

    // ── 5. Create execution record ──────────────────────────────────────────
    const execution = await prisma.waveAutomationExecution.create({
      data: {
        organizationId: session.user.organizationId,
        ruleId: rule.id,
        triggeredBy,
        triggerData: {
          triggerType: rule.triggerType,
          conditionMet,
          triggerReason,
          pendingOrderCount,
          pendingLineCount,
        },
        status: "PENDING",
        startedAt,
      },
    });

    if (!conditionMet) {
      await prisma.waveAutomationExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          result: { skipped: true, reason: "Condition not met" },
        } as Record<string, unknown>,
      });

      return NextResponse.json({
        executed: false,
        reason: triggerReason,
        pendingOrderCount,
        pendingLineCount,
        executionId: execution.id,
      });
    }

    // ── 6. Create the WavePick ──────────────────────────────────────────────
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayWaveCount = await prisma.wavePick.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });
    const waveNumber = `WAVE-${dateStr}-${String(todayWaveCount + 1).padStart(4, "0")}`;

    // Fetch candidate orders (limited by defaultMaxOrders)
    const candidateOrders = await prisma.salesOrder.findMany({
      where: orderWhere,
      include: { items: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: rule.defaultMaxOrders ?? 100,
    });

    let wave;
    try {
      wave = await prisma.wavePick.create({
        data: {
          organizationId: session.user.organizationId,
          warehouseId: rule.warehouseId,
          waveNumber,
          name: `Auto: ${rule.name} — ${new Date().toLocaleString()}`,
          description: `Automatically created by rule "${rule.name}" (${triggerReason})`,
          waveType: rule.defaultWaveType,
          priority: rule.defaultPriority,
          strategy: rule.defaultStrategy,
          groupingCriteria: {},
          maxOrders: rule.defaultMaxOrders,
          maxLines: rule.defaultMaxLines,
          status: "PLANNED",
          totalOrders: candidateOrders.length,
          tags: rule.tags,
          metadata: {
            automationRuleId: rule.id,
            automationRuleName: rule.name,
            triggeredBy,
            triggerReason,
          },
          createdById: session.user.id,
        },
      });

      // Create WavePickLines for all order items
      let lineNumber = 1;
      const lines = candidateOrders.flatMap((order) =>
        order.items.map((item) => ({
          organizationId: session.user.organizationId,
          wavePickId: wave.id,
          lineNumber: lineNumber++,
          pickSequence: lineNumber,
          salesOrderId: order.id,
          inventoryItemId: item.inventoryItemId,
          orderedQuantity: item.quantity,
          priority: order.priority ?? 0,
          pickListId: null as string | null,
          locationId: null as string | null,
          notes: null as string | null,
        })),
      );

      let totalLines = 0;
      // Apply per-line limit
      const linesToCreate = rule.defaultMaxLines
        ? lines.slice(0, rule.defaultMaxLines)
        : lines;
      totalLines = linesToCreate.length;

      if (linesToCreate.length > 0) {
        await prisma.wavePickLine.createMany({ data: linesToCreate });
      }

      // Update wave with line counts
      await prisma.wavePick.update({
        where: { id: wave.id },
        data: {
          totalLines,
          totalQuantity: linesToCreate.reduce(
            (sum, l) => sum + l.orderedQuantity,
            0,
          ),
        },
      });

      // Update execution record as SUCCESS
      const completedAt = new Date();
      await prisma.waveAutomationExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          wavePickId: wave.id,
          waveNumber,
          ordersIncluded: candidateOrders.length,
          linesIncluded: totalLines,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
        },
      });

      // Update rule stats and lastFiredAt
      await prisma.waveAutomationRule.update({
        where: { id: rule.id },
        data: {
          lastFiredAt: startedAt,
          fireCount: { increment: 1 },
          successCount: { increment: 1 },
          status: "IDLE",
          lastError: null,
        },
      });
    } catch (waveError) {
      const errorMsg =
        waveError instanceof Error ? waveError.message : String(waveError);

      await Promise.all([
        prisma.waveAutomationExecution.update({
          where: { id: execution.id },
          data: {
            status: "FAILED",
            error: errorMsg,
            completedAt: new Date(),
            durationMs: Date.now() - startedAt.getTime(),
          },
        }),
        prisma.waveAutomationRule.update({
          where: { id: rule.id },
          data: {
            fireCount: { increment: 1 },
            failureCount: { increment: 1 },
            status: "ERROR",
            lastError: errorMsg,
          },
        }),
      ]);

      console.error("[WaveAutomationTrigger] Wave creation failed:", waveError);
      return NextResponse.json(
        { error: "Wave creation failed", details: errorMsg },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        executed: true,
        waveId: wave.id,
        waveNumber,
        ordersIncluded: candidateOrders.length,
        linesIncluded: wave.totalLines,
        triggerReason,
        executionId: execution.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[WaveAutomationTrigger POST]", error);
    return NextResponse.json({ error: "Trigger failed" }, { status: 500 });
  }
}
