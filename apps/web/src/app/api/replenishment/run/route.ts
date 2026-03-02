/**
 * GET  /api/replenishment/run  – list open replenishment tasks (PENDING + IN_PROGRESS)
 * POST /api/replenishment/run  – scan all active rules, create tasks, optionally auto-PO
 *
 * Supports all ReplenishStrategy values including next-gen:
 *   PREDICTIVE · WAVE_AWARE · IOT_TRIGGERED · COST_OPTIMISED · CONTINUOUS_MICRO
 *
 * Returns (POST): { success, dryRun, summary: { scanned, tasksCreated, poCreated,
 *                   stockoutsFound, microTasksCreated, waveBindsCreated }, details }
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET ──────────────────────────────────────────────────────────────────────
// Called by the replenishment page to populate the Tasks tab

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const tasks = await prisma.replenishmentTask.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "IN_PROGRESS", "PO_CREATED"] },
    },
    include: {
      inventoryItem: {
        select: { id: true, name: true, sku: true, quantity: true },
      },
      warehouse: { select: { id: true, name: true, code: true } },
      purchaseOrder: { select: { id: true, poNumber: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 200,
  });

  // Shape to match the UI's ReplenTask interface
  const shaped = tasks.map((t) => ({
    id: t.id,
    status: t.status,
    priority: t.priority,
    requiredQty: t.requiredQty,
    orderedQty: t.orderedQty,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    inventoryItem: t.inventoryItem
      ? {
          name: t.inventoryItem.name,
          sku: t.inventoryItem.sku,
          currentStock: t.inventoryItem.quantity,
        }
      : undefined,
    warehouse: t.warehouse
      ? { name: t.warehouse.name, code: t.warehouse.code }
      : undefined,
    purchaseOrder: t.purchaseOrder
      ? { poNumber: t.purchaseOrder.poNumber }
      : undefined,
  }));

  return NextResponse.json({ tasks: shaped });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json().catch(() => ({}));
  const { warehouseId, dryRun = false } = body;

  // Load feature flags for advanced strategy gating
  const flags = await prisma.replenishmentFeatureFlag.findUnique({
    where: { organizationId },
  });

  // Load all active rules
  const rules = await prisma.replenishmentRule.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(warehouseId && { warehouseId }),
    },
  });

  const details: Array<{
    ruleId: string;
    ruleName: string;
    strategy: string;
    itemId: string | null;
    currentStock: number;
    threshold: number;
    requiredQty: number;
    action: string;
  }> = [];

  let tasksCreated = 0;
  let poCreated = 0;
  let microTasksCreated = 0;
  let waveBindsCreated = 0;
  const now = new Date();

  for (const rule of rules) {
    try {
      // ── Skip IOT_TRIGGERED rules from scan-based run ─────────────────────
      // These fire only from the /api/replenishment/iot-triggers endpoint.
      if (rule.strategy === "IOT_TRIGGERED") continue;

      // ── Gate next-gen strategies behind feature flags ────────────────────
      if (rule.strategy === "PREDICTIVE" && !flags?.predictiveAI) continue;
      if (rule.strategy === "WAVE_AWARE" && !flags?.waveAware) continue;
      if (rule.strategy === "COST_OPTIMISED" && !flags?.costOptimisation)
        continue;
      if (rule.strategy === "CONTINUOUS_MICRO" && !flags?.microTasks) continue;

      // ── Determine items this rule applies to ────────────────────────────
      const whereClause: any = { organizationId };
      if (rule.inventoryItemId) whereClause.id = rule.inventoryItemId;
      if (rule.warehouseId) whereClause.warehouseId = rule.warehouseId;

      const items = await prisma.inventoryItem.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          minStockLevel: true,
          maxStockLevel: true,
          reorderPoint: true,
          leadTimeDays: true,
          warehouseId: true,
        },
      });

      for (const item of items) {
        const current = item.quantity || 0;
        let needsReplenishment = false;
        let requiredQty = 0;
        let threshold = 0;
        let triggerSource: string = "RULE_SCAN";
        let forecastConfidence: number | undefined;

        // ── Classic strategies ────────────────────────────────────────────
        if (rule.strategy === "MIN_MAX") {
          threshold = rule.minQty || item.minStockLevel || 0;
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty =
              (rule.maxQty || item.maxStockLevel || threshold * 3) - current;
          }
        } else if (rule.strategy === "REORDER_POINT") {
          threshold = rule.reorderPoint || item.reorderPoint || 0;
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty = rule.reorderQty;
          }
        } else if (rule.strategy === "DEMAND_BASED") {
          const since = new Date();
          since.setDate(since.getDate() - rule.demandDays);
          const agg = await prisma.salesOrderItem.aggregate({
            where: {
              inventoryItemId: item.id,
              salesOrder: { organizationId, orderDate: { gte: since } },
            },
            _sum: { quantity: true },
          });
          const totalDemand = agg._sum.quantity || 0;
          const dailyDemand = totalDemand / rule.demandDays;
          const coverDays = rule.leadTimeDays + 7;
          threshold = Math.ceil(dailyDemand * coverDays);
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty = Math.max(
              rule.reorderQty,
              Math.ceil(dailyDemand * (rule.demandDays / 2)),
            );
          }
        } else if (rule.strategy === "PERIODIC_REVIEW") {
          if (!rule.nextReviewDate || rule.nextReviewDate <= now) {
            threshold = rule.minQty || item.minStockLevel || 0;
            needsReplenishment = true;
            requiredQty = Math.max(
              0,
              (rule.maxQty || item.maxStockLevel || threshold * 2) - current,
            );
            if (!dryRun) {
              const nextDate = new Date(now);
              nextDate.setDate(nextDate.getDate() + rule.reviewFrequencyDays);
              await prisma.replenishmentRule.update({
                where: { id: rule.id },
                data: { nextReviewDate: nextDate },
              });
            }
          }
        }
        // ── PREDICTIVE: use AI forecast cache ─────────────────────────────
        else if (rule.strategy === "PREDICTIVE") {
          triggerSource = "AI_PREDICTION";
          const forecast = await prisma.replenishmentForecastCache.findFirst({
            where: {
              organizationId,
              inventoryItemId: item.id,
              expiresAt: { gt: now },
            },
            orderBy: { generatedAt: "desc" },
          });

          if (forecast) {
            threshold = forecast.safetyStockQty;
            if (current <= threshold) {
              needsReplenishment = true;
              requiredQty = forecast.recommendedQty;
              forecastConfidence = forecast.confidence;
            }
          } else {
            // No valid forecast – fall back to min stock level check
            threshold = item.minStockLevel || 0;
            if (current <= threshold) {
              needsReplenishment = true;
              requiredQty = Math.max(
                1,
                (item.maxStockLevel || threshold * 2) - current,
              );
            }
          }
        }
        // ── WAVE_AWARE: pre-fill before upcoming waves ────────────────────
        else if (rule.strategy === "WAVE_AWARE") {
          triggerSource = "WAVE_PRE_FILL";
          const waveHorizon = new Date(now);
          waveHorizon.setHours(waveHorizon.getHours() + rule.wavePreFillHours);

          // Find wave lines for this item in upcoming waves
          const pendingWaveLines = await prisma.wavePickLine.findMany({
            where: {
              organizationId,
              inventoryItemId: item.id,
              status: "PENDING",
              wavePick: {
                warehouseId: item.warehouseId || rule.warehouseId || undefined,
                status: { in: ["PLANNED", "RELEASED"] },
                scheduledFor: { lte: waveHorizon },
              },
            },
            select: { orderedQuantity: true, wavePickId: true },
            take: 10,
          });

          if (pendingWaveLines.length > 0) {
            const waveRequirement = pendingWaveLines.reduce(
              (s, l) => s + l.orderedQuantity,
              0,
            );
            if (current < waveRequirement) {
              needsReplenishment = true;
              requiredQty = waveRequirement - current;
              threshold = waveRequirement;
            }
          }
        }
        // ── COST_OPTIMISED: only replenish if cost is acceptable ──────────
        else if (rule.strategy === "COST_OPTIMISED") {
          triggerSource = "COST_OPTIMISED";
          // Use MIN_MAX logic as the base trigger
          threshold = rule.minQty || item.minStockLevel || 0;
          if (current <= threshold) {
            const candidate =
              (rule.maxQty || item.maxStockLevel || threshold * 3) - current;
            // Estimate cost: $2 base + $0.5/unit; compare against maxCostPerUnit
            const costPerUnit =
              candidate > 0 ? (2 + candidate * 0.5) / candidate : 99;
            const maxAllowed = rule.maxCostPerUnit
              ? Number(rule.maxCostPerUnit)
              : 999;
            if (costPerUnit <= maxAllowed) {
              needsReplenishment = true;
              requiredQty = candidate;
            }
          }
        }
        // ── CONTINUOUS_MICRO: trigger same as MIN_MAX, then split ─────────
        else if (rule.strategy === "CONTINUOUS_MICRO") {
          triggerSource = "RULE_SCAN";
          threshold = rule.minQty || item.minStockLevel || 0;
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty =
              (rule.maxQty || item.maxStockLevel || threshold * 3) - current;
          }
        }

        if (needsReplenishment && requiredQty > 0) {
          details.push({
            ruleId: rule.id,
            ruleName: rule.name,
            strategy: rule.strategy,
            itemId: item.id,
            currentStock: current,
            threshold,
            requiredQty,
            action: dryRun ? "DRY_RUN" : "TASK_CREATED",
          });

          if (!dryRun) {
            const existingTask = await prisma.replenishmentTask.findFirst({
              where: {
                organizationId,
                inventoryItemId: item.id,
                warehouseId: item.warehouseId || rule.warehouseId || "",
                status: { in: ["PENDING", "IN_PROGRESS", "PO_CREATED"] },
                parentTaskId: null, // only check root tasks
              },
            });

            if (!existingTask) {
              const isMicro =
                rule.strategy === "CONTINUOUS_MICRO" &&
                rule.microTaskSplitQty > 0 &&
                requiredQty > rule.microTaskSplitQty;

              if (isMicro) {
                // Create a parent task (root), then N micro child tasks
                const parentTask = await prisma.replenishmentTask.create({
                  data: {
                    organizationId,
                    ruleId: rule.id,
                    warehouseId: item.warehouseId || rule.warehouseId || "",
                    inventoryItemId: item.id,
                    requiredQty,
                    status: "IN_PROGRESS",
                    priority: current === 0 ? "HIGH" : "MEDIUM",
                    triggerSource: "RULE_SCAN",
                    replenUnit: rule.replenUnit,
                    forecastConfidence,
                  },
                });
                tasksCreated++;

                const chunks = Math.ceil(requiredQty / rule.microTaskSplitQty);
                let remaining = requiredQty;
                for (let c = 0; c < chunks; c++) {
                  const chunkQty = Math.min(rule.microTaskSplitQty, remaining);
                  remaining -= chunkQty;
                  await prisma.replenishmentTask.create({
                    data: {
                      organizationId,
                      ruleId: rule.id,
                      warehouseId: item.warehouseId || rule.warehouseId || "",
                      inventoryItemId: item.id,
                      requiredQty: chunkQty,
                      status: "PENDING",
                      priority: current === 0 ? "HIGH" : "MEDIUM",
                      triggerSource: "RULE_SCAN",
                      replenUnit: rule.replenUnit,
                      parentTaskId: parentTask.id,
                    },
                  });
                  microTasksCreated++;
                }
              } else {
                // Standard single task
                const task = await prisma.replenishmentTask.create({
                  data: {
                    organizationId,
                    ruleId: rule.id,
                    warehouseId: item.warehouseId || rule.warehouseId || "",
                    inventoryItemId: item.id,
                    requiredQty,
                    status: "PENDING",
                    priority: current === 0 ? "HIGH" : "MEDIUM",
                    triggerSource: triggerSource as any,
                    replenUnit: rule.replenUnit,
                    forecastConfidence,
                  },
                });
                tasksCreated++;

                // ── Auto-create PO ─────────────────────────────────────────
                if (rule.autoCreatePO && rule.supplierId) {
                  const poNumber = `RPO-${Date.now().toString().slice(-8)}`;
                  const po = await prisma.purchaseOrder.create({
                    data: {
                      organizationId,
                      supplierId: rule.supplierId,
                      poNumber,
                      status: "DRAFT",
                      notes: `Auto-generated by replenishment rule: ${rule.name}`,
                      createdById: session.user.id,
                      items: {
                        create: [
                          {
                            inventoryItemId: item.id,
                            sku: item.sku,
                            description: item.name,
                            quantityOrdered: requiredQty,
                            unitPrice: 0,
                            totalPrice: 0,
                          },
                        ],
                      },
                    },
                  });
                  poCreated++;

                  await prisma.replenishmentTask.update({
                    where: { id: task.id },
                    data: {
                      purchaseOrderId: po.id,
                      orderedQty: requiredQty,
                      status: "PO_CREATED",
                    },
                  });
                }

                // ── Bind to upcoming waves for WAVE_AWARE ──────────────────
                if (rule.strategy === "WAVE_AWARE") {
                  const waveHorizon = new Date(now);
                  waveHorizon.setHours(
                    waveHorizon.getHours() + rule.wavePreFillHours,
                  );

                  const upcomingWaves = await prisma.wavePick.findMany({
                    where: {
                      organizationId,
                      status: { in: ["PLANNED", "RELEASED"] },
                      scheduledFor: { lte: waveHorizon },
                      ...(item.warehouseId && {
                        warehouseId: item.warehouseId,
                      }),
                    },
                    select: { id: true, scheduledFor: true },
                    take: 5,
                  });

                  for (const wave of upcomingWaves) {
                    await prisma.replenishmentWaveBind.upsert({
                      where: {
                        waveId_taskId: { waveId: wave.id, taskId: task.id },
                      },
                      update: {},
                      create: {
                        organizationId,
                        waveId: wave.id,
                        taskId: task.id,
                        bindReason: "pre-fill",
                        requiredByTime: wave.scheduledFor ?? undefined,
                      },
                    });
                    waveBindsCreated++;
                  }
                }
              }
            }
          }
        }
      }

      // Update rule's lastTriggeredAt
      if (!dryRun) {
        await prisma.replenishmentRule.update({
          where: { id: rule.id },
          data: { lastTriggeredAt: now },
        });
      }
    } catch (err) {
      console.error(`[replenishment/run] Rule ${rule.id}:`, err);
    }
  }

  // Create exception records for stockouts
  if (!dryRun) {
    for (const d of details.filter((r) => r.currentStock === 0)) {
      await prisma.exceptionRecord.upsert({
        where: { id: `stockout-${d.itemId}-${organizationId}` },
        update: { updatedAt: new Date() },
        create: {
          id: `stockout-${d.itemId}-${organizationId}`,
          organizationId,
          type: "STOCKOUT",
          severity: "HIGH",
          status: "OPEN",
          title: "Stockout detected",
          description: `Item ${d.itemId} has zero stock. Replenishment task created.`,
          resourceType: "InventoryItem",
          resourceId: d.itemId!,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    dryRun,
    summary: {
      scanned: rules.length,
      tasksCreated,
      poCreated,
      microTasksCreated,
      waveBindsCreated,
      stockoutsFound: details.filter((d) => d.currentStock === 0).length,
    },
    details,
  });
}
