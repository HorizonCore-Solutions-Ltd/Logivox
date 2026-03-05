import { prisma } from "@/lib/prisma";
import { SlottingEngine } from "./slotting-engine";

export interface InboundAction {
  recommendedLocationId: string | null;
  qcStatus: string; // Using string type to match potential enum or string
  isCrossDock: boolean;
  notes: string | undefined;
}

export class InboundBrain {
  /**
   * Determine the next action for an item being received.
   */
  static async determineAction(context: {
    itemId: string;
    organizationId: string;
    warehouseId: string;
    quantity: number;
    supplierId?: string;
  }): Promise<InboundAction> {
    const { itemId, organizationId, warehouseId, supplierId } = context;

    // 1. Check Quality Constraints (e.g. Supplier Rating)
    let requiresQC = false;

    // Check if supplier has low quality score
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: { qualityScore: true },
      });
      // Example logic: if score < 80, flag for QC
      if (supplier?.qualityScore && supplier.qualityScore.score < 80) {
        requiresQC = true;
      }
    }

    if (requiresQC) {
      // Find QC Location
      // We look for a location specifically designated for QC or Quarantine
      const qcLocation = await prisma.location.findFirst({
        where: {
          organizationId,
          warehouseId,
          type: "QUARANTINE",
          isActive: true,
        },
      });
      return {
        recommendedLocationId: qcLocation?.id || null,
        qcStatus: "PENDING_QC",
        isCrossDock: false,
        notes: "Routed to QC due to supplier risk",
      };
    }

    // 2. Check for Cross-Dock Opportunities (Backorders)
    // Find Sales Orders in status 'CONFIRMED' or 'PROCESSING' that contain this item
    // and are unfulfilled (logic simplified: if any open order has this item, we flag it)
    // In a real scenario, we would check quantity - quantityShipped > 0
    const backorders = await prisma.salesOrderItem.findMany({
      where: {
        inventoryItemId: itemId,
        salesOrder: {
          organizationId,
          status: { in: ["CONFIRMED", "PROCESSING"] },
        },
        // We want items where quantity > quantityShipped
        // Prisma doesn't support field comparison in where easily without raw query or iterating.
        // We'll fetch potential candidates and filter in memory since we take 1 only.
      },
      include: {
        salesOrder: true,
      },
      take: 5,
    });

    // Filter in memory for performance on small set
    // A simplified check: if quantity > quantityShipped
    const validBackorder = backorders.find(
      (bo: any) => bo.quantity > (bo.quantityShipped || 0),
    );

    if (validBackorder) {
      const stagingLocation = await prisma.location.findFirst({
        where: {
          organizationId,
          warehouseId,
          type: "STAGING",
          isActive: true,
        },
      });
      return {
        recommendedLocationId: stagingLocation?.id || null,
        qcStatus: "AVAILABLE",
        isCrossDock: true,
        notes: `Cross-dock opportunity detected: Order ${validBackorder.salesOrder.soNumber}`,
      };
    }

    // 3. Regular Put-Away (Slotting)
    const slottingResult = await SlottingEngine.getPutAwayRecommendation({
      itemId,
      warehouseId,
      quantity: context.quantity,
      organizationId,
    });

    return {
      recommendedLocationId: slottingResult.recommendedLocationId,
      qcStatus: "AVAILABLE",
      isCrossDock: false,
      notes: slottingResult.reason,
    };
  }
}
