
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;
    const userId = session.user.id;

    // 1. Fetch All Active Rules
    const rules = await prisma.replenishmentRule.findMany({
        where: { organizationId, isActive: true },
        include: { 
            inventoryItem: true,
            warehouse: true 
        }
    });

    const createdTasks = [];

    // 2. Evaluate Each Rule
    for (const rule of rules) {
        // Skip if no item associated (Category rules are complex, skipping for MVP)
        if (!rule.inventoryItem) continue;

        const item = rule.inventoryItem;
        const currentStock = item.availableQty || 0;
        let needsReplen = false;
        let reason = "";
        let qtyNeeded = 0;

        // Strategy: MIN_MAX
        if (rule.strategy === "MIN_MAX" || rule.strategy === "REORDER_POINT") {
             const lowerBound = rule.reorderPoint > 0 ? rule.reorderPoint : rule.minQty;
             if (currentStock <= lowerBound) {
                 needsReplen = true;
                 const target = rule.maxQty > 0 ? rule.maxQty : (rule.reorderQty + currentStock);
                 qtyNeeded = Math.max(0, target - currentStock);
                 reason = `Stock (${currentStock}) below threshold (${lowerBound})`;
             }
        }
        
        // Strategy: PERIODIC_REVIEW (Simple check if review date passed)
        if (rule.strategy === "PERIODIC_REVIEW" && rule.nextReviewDate && new Date() >= rule.nextReviewDate) {
             needsReplen = true;
             // Naive assumption: Reorder entire lead time usage? No forecast model here.
             // Fallback to reorderQty
             qtyNeeded = rule.reorderQty || 10;
             reason = `Periodic Review Due`;
        }

        if (needsReplen && qtyNeeded > 0) {
            // Check for existing active REPLENISH task for this item to avoid duplicates
            const activeTask = await prisma.pickingTask.findFirst({
                where: {
                    inventoryItemId: item.id,
                    taskType: "REPLENISH",
                    status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
                    organizationId
                }
            });

            if (!activeTask) {
                // Determine Source (Bulk Storage)
                // Ideal: Find location with largest quantity of this item.
                // Fallback: Just mark as "From Bulk" (no specific location ID if unknown)
                
                // Determine Target (Pick Face)
                // Ideal: Item's primary bin location.
                let targetLocId = null;
                if (rule.warehouseId) {
                     // Try to find a location named after bin
                     // This is vague without dedicated Location-Item map.
                }

                const count = await prisma.pickingTask.count({ where: { organizationId }});
                const taskNumber = `RPL-${rule.strategy.substring(0,3)}-${String(count+1).padStart(4,'0')}`;

                const newTask = await prisma.pickingTask.create({
                    data: {
                        organizationId,
                        warehouseId: rule.warehouseId || item.warehouseId,
                        taskNumber,
                        taskType: "REPLENISH",
                        priority: "NORMAL",
                        title: `Replenish: ${item.name}`,
                        description: `${reason}. Move ${qtyNeeded} units to Pick Face.`,
                        inventoryItemId: item.id,
                        quantity: qtyNeeded,
                        status: "PENDING",
                        createdById: userId,
                        // If we knew specific locations, we'd add fromLocationId / toLocationId
                    }
                });
                createdTasks.push(newTask);

                // Update Rule's last triggered
                await prisma.replenishmentRule.update({
                    where: { id: rule.id },
                    data: { 
                        lastTriggeredAt: new Date(),
                        nextReviewDate: new Date(Date.now() + (rule.reviewFrequencyDays * 86400000))
                    }
                });
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        processed: rules.length, 
        createdCount: createdTasks.length,
        tasks: createdTasks 
    });

  } catch (error: any) {
    console.error("Replenishment Run Error:", error);
    return NextResponse.json({ error: error.message || "Failed execution" }, { status: 500 });
  }
}
