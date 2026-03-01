/**
 * POST /api/replenishment/run
 *
 * Scans all active replenishment rules for the org,
 * checks current stock vs thresholds, and auto-creates
 * ReplenishmentTask records (and optionally POs).
 *
 * Returns: { scanned, tasksCreated, details }
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const body = await request.json().catch(() => ({}));
  const { warehouseId, dryRun = false } = body;

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
    itemId: string | null;
    currentStock: number;
    threshold: number;
    requiredQty: number;
    action: string;
  }> = [];

  let tasksCreated = 0;

  for (const rule of rules) {
    try {
      // Get items this rule applies to
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
          warehouseId: true,
        },
      });

      for (const item of items) {
        const current = item.quantity || 0;
        let needsReplenishment = false;
        let requiredQty = 0;
        let threshold = 0;

        if (rule.strategy === "MIN_MAX") {
          threshold = rule.minQty || item.minStockLevel || 0;
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty = (rule.maxQty || item.maxStockLevel || threshold * 3) - current;
          }
        } else if (rule.strategy === "REORDER_POINT") {
          threshold = rule.reorderPoint || item.reorderPoint || 0;
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty = rule.reorderQty;
          }
        } else if (rule.strategy === "DEMAND_BASED") {
          // Calculate average demand over rule.demandDays
          const since = new Date();
          since.setDate(since.getDate() - rule.demandDays);
          const orderItems = await prisma.salesOrderItem.aggregate({
            where: {
              inventoryItemId: item.id,
              salesOrder: { organizationId, orderDate: { gte: since } },
            },
            _sum: { quantity: true },
          });
          const totalDemand = orderItems._sum.quantity || 0;
          const dailyDemand = totalDemand / rule.demandDays;
          const coverDays = rule.leadTimeDays + 7; // lead time + 1 week buffer
          threshold = Math.ceil(dailyDemand * coverDays);
          if (current <= threshold) {
            needsReplenishment = true;
            requiredQty = Math.max(rule.reorderQty, Math.ceil(dailyDemand * (rule.demandDays / 2)));
          }
        }

        if (needsReplenishment && requiredQty > 0) {
          details.push({
            ruleId: rule.id,
            ruleName: rule.name,
            itemId: item.id,
            currentStock: current,
            threshold,
            requiredQty,
            action: dryRun ? "DRY_RUN" : "TASK_CREATED",
          });

          if (!dryRun) {
            // Check for existing PENDING task to avoid duplicates
            const existing = await prisma.replenishmentTask.findFirst({
              where: {
                organizationId,
                inventoryItemId: item.id,
                warehouseId: item.warehouseId || rule.warehouseId || "",
                status: "PENDING",
              },
            });

            if (!existing) {
              await prisma.replenishmentTask.create({
                data: {
                  organizationId,
                  ruleId: rule.id,
                  warehouseId: item.warehouseId || rule.warehouseId || "",
                  inventoryItemId: item.id,
                  requiredQty,
                  status: "PENDING",
                  priority: current === 0 ? "HIGH" : "MEDIUM",
                },
              });
              tasksCreated++;

              // Auto-create PO if configured
              if (rule.autoCreatePO && rule.supplierId) {
                const poNumber = `RPO-${Date.now().toString().slice(-8)}`;
                await prisma.purchaseOrder.create({
                  data: {
                    organizationId,
                    supplierId: rule.supplierId,
                    poNumber,
                    status: "DRAFT",
                    notes: `Auto-generated by replenishment rule: ${rule.name}`,
                    createdById: session.user.id,
                    items: {
                      create: [{
                        inventoryItemId: item.id,
                        quantity: requiredQty,
                        unitCost: 0,
                        totalCost: 0,
                      }],
                    },
                  },
                });
              }
            }
          }
        }
      }

      // Update lastTriggeredAt
      if (!dryRun) {
        await prisma.replenishmentRule.update({
          where: { id: rule.id },
          data: { lastTriggeredAt: new Date() },
        });
      }
    } catch (err) {
      console.error(`[replenishment/run] Rule ${rule.id}:`, err);
    }
  }

  // Auto-create exception records for stockouts
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
    summary: { scanned: rules.length, tasksCreated, stockoutsFound: details.filter((d) => d.currentStock === 0).length },
    details,
  });
}
