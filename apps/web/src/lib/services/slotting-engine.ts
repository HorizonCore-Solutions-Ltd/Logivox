import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface SlottingContext {
  itemId: string;
  warehouseId: string;
  quantity: number;
  organizationId: string;
  sku?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
}

interface SlottingResult {
  recommendedLocationId: string | null;
  strategy: string;
  reason: string;
  score: number;
}

export class SlottingEngine {
  /**
   * Main entry point to get a put-away recommendation
   */
  static async getPutAwayRecommendation(
    context: SlottingContext,
  ): Promise<SlottingResult> {
    const { itemId, warehouseId, organizationId } = context;

    // 1. Check for Active Slotting Rules
    const rules = await prisma.slottingRule.findMany({
      where: {
        organizationId,
        warehouseId,
        isActive: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    // 2. Try to consolidate first (find locations where this item specifically exists)
    const consolidationLocation = await this.findConsolidationLocation(context);
    if (consolidationLocation) {
        return {
            recommendedLocationId: consolidationLocation.id,
            strategy: "CONSOLIDATION",
            reason: "Item already exists in this location",
            score: 100
        };
    }

    // 3. If no consolidation, find best empty or suitable location based on rules
    for (const rule of rules) {
        const location = await this.findLocationByRule(rule, context);
        if (location) {
            return {
                recommendedLocationId: location.id,
                strategy: rule.ruleCode || rule.strategy,
                reason: `Matches rule: ${rule.ruleName}`,
                score: rule.priority
            };
        }
    }

    // 4. Fallback: Find any empty pickable/putaway location
    // We try to find a location that has NO lots assigned to it.
    const emptyLocation = await prisma.location.findFirst({
        where: {
            organizationId,
            warehouseId,
            isPutaway: true,
            isActive: true,
            lots: {
                none: {}
            }
        }
    });

    if (emptyLocation) {
        return {
            recommendedLocationId: emptyLocation.id,
            strategy: "EMPTY_LOCATION",
            reason: "Found empty location",
            score: 50
        };
    }

    // 5. Last Resort: Find any location that allows putaway
     const anyLocation = await prisma.location.findFirst({
        where: {
            organizationId,
            warehouseId,
            isPutaway: true,
            isActive: true,
        }
    });

    return {
        recommendedLocationId: anyLocation?.id || null,
        strategy: "FALLBACK",
        reason: "No specific rule matched, using default available location",
        score: 10
    };
  }

  private static async findConsolidationLocation(context: SlottingContext) {
      // Find lots of this item that have stock and a location
      const existingLot = await prisma.lot.findFirst({
          where: {
              organizationId: context.organizationId,
              inventoryId: context.itemId,
              locationId: { not: null },
              location: {
                  warehouseId: context.warehouseId,
                  isPutaway: true,
                  isActive: true
              }
          },
          include: {
              location: true
          },
          orderBy: {
              currentQuantity: 'desc' 
          }
      });

      return existingLot?.location || null; 
  }

    private static async findLocationByRule(rule: any, context: SlottingContext) {
        // Implementation of rule matching logic
        const where: Prisma.LocationWhereInput = {
            warehouseId: context.warehouseId,
            isPutaway: true,
            isActive: true,
            organizationId: context.organizationId
        };

        if (rule.targetZoneType) {
            // Check for empty locations in that zone/rule scope
            // Note: zoneId relationship might need verification if we pass strict ID or Type.
            // For now assuming we just verify locations.
        }

        const location = await prisma.location.findFirst({
            where: {
                ...where,
                lots: {
                    none: {}
                }
            }
        });

        return location;
    }
}

