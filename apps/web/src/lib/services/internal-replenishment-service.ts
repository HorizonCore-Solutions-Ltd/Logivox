// apps/web/src/lib/services/internal-replenishment-service.ts

import { prisma } from "@/lib/prisma";
import { fulfillmentBrain } from "./fulfillment-brain";
import { TaskPriority, TaskType } from "@prisma/client";

export class InternalReplenishmentService {
  /**
   * Scan for items that need replenishment in the Forward Pick area.
   * Logic:
   * 1. Find active Replenishment Rules (Min/Max).
   * 2. For each rule, calculate current Forward Pick Quantity.
   * 3. If below Min, find Reserve Stock.
   * 4. Orchestrate a Replenishment Task.
   */
  async generateReplenishmentTasks(organizationId: string, warehouseId: string) {
    console.log(`[InternalReplenishment] Running for warehouse ${warehouseId}`);

    // 1. Get Rules
    const rules = await prisma.replenishmentRule.findMany({
      where: {
        organizationId,
        warehouseId,
        // In a real app, verify 'isActive' status if available
      },
    });

    const tasksCreated = [];

    for (const rule of rules) {
      if (!rule.inventoryItemId) continue; // Skip rules without specific item for now

      // 2. Calculate Forward Pick Quantity (Sum of lots in Pickable locations)
      const forwardStock = await prisma.lot.aggregate({
        where: {
          inventoryId: rule.inventoryItemId,
          location: {
            isPickable: true,
            warehouseId,
          },
        },
        _sum: {
          availableQuantity: true,
        },
      });

      const currentQty = forwardStock._sum.availableQuantity || 0;

      if (currentQty < rule.minQty) {
        // Needs Replenishment
        const neededQty = rule.maxQty - currentQty;
        console.log(`[Replen] Item ${rule.inventoryItemId}: Current ${currentQty} < Min ${rule.minQty}. Need ${neededQty}.`);

        // 3. Find Reserve Stock (Non-pickable locations with stock)
        const reserveLots = await prisma.lot.findMany({
          where: {
            inventoryId: rule.inventoryItemId,
            availableQuantity: { gt: 0 },
            location: {
              isPickable: false, // Explicitly look in reserve
              warehouseId,
            },
          },
          orderBy: {
            receivedDate: 'asc', // FIFO
          },
          include: {
            location: true,
          },
          take: 5, // Just get enough to fulfill
        });

        if (reserveLots.length === 0) {
          console.warn(`[Replen] No reserve stock found for item ${rule.inventoryItemId}`);
          continue;
        }

        // 4. Create Tasks for each lot until demand is met
        let remainingNeed = neededQty;

        for (const lot of reserveLots) {
          if (remainingNeed <= 0) break;

          const moveQty = Math.min(lot.availableQuantity, remainingNeed);
          
          if (!lot.locationId) continue;

          // Find a destination (Empty pick bin or existing bin with same item)
          const destLocation = await this.findBestDestination(warehouseId, rule.inventoryItemId);

          // Call the Brain
          const result = await fulfillmentBrain.orchestrateTask(
            {
              organizationId,
              workflowType: "REPLENISHMENT",
            },
            {
              type: TaskType.REPLENISH,
              organizationId,
              warehouseId,
              locationId: lot.locationId, // From Reserve
              toLocationId: destLocation?.id, // To Forward
              inventoryItemId: rule.inventoryItemId,
              quantity: moveQty,
              priority: TaskPriority.HIGH,
              title: "Internal Replenishment",
              description: `Move ${moveQty} units from Reserve to Forward Pick to meet Min/Max rule.`,
              // Assignee left blank for standard logic
            }
          );

          tasksCreated.push(result);
          remainingNeed -= moveQty;
        }
      }
    }

    return {
      processedRules: rules.length,
      tasksGenerated: tasksCreated.length,
      tasks: tasksCreated,
    };
  }

  /**
   * Helper to find a suitable put-away location in the picking zone.
   * Checks for:
   * 1. Existing bin with same item (to consolidate).
   * 2. Empty bin in the picking zone.
   */
  private async findBestDestination(warehouseId: string, inventoryItemId: string) {
    // 1. Try to find a pickable location that already has this item
    const existingLoc = await prisma.lot.findFirst({
        where: {
            inventoryId: inventoryItemId,
            location: {
                warehouseId,
                isPickable: true,
            }
        },
        include: { location: true }
    });
    
    if (existingLoc?.location) return existingLoc.location;

    // 2. Find closest empty pickable bin
    // Simplification: Just find any empty pickable bin
    // In real app: Check capacity/volume
    const emptyBin = await prisma.location.findFirst({
        where: {
            warehouseId,
            isPickable: true,
            lots: {
                none: {} // No lots
            }
        }
    });

    return emptyBin || undefined;
  }
}

export const internalReplenishmentService = new InternalReplenishmentService();
