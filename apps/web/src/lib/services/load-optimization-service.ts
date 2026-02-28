/**
 * Load Optimization Service
 *
 * Analyzes orders and recommends optimal vehicle configurations for shipment.
 * Integrates with vehicle-types library for capacity planning.
 */

import { PrismaClient } from "@prisma/client";
import { recommendVehicle, type VehicleType, calculateUtilization } from "../vehicle-types";

const prisma = new PrismaClient();

export interface LoadAnalysisParams {
  orderIds?: string[];
  warehouseId?: string;
  destinationZip?: string;
  scheduledDate?: Date;
}

export interface LoadAnalysisResult {
  totalOrders: number;
  totalVolumeCubicFeet: number;
  totalWeightLbs: number;
  totalPallets: number;
  recommendedVehicle: VehicleType | null;
  alternativeVehicles: VehicleType[];
  utilization: {
    volumePercent: number;
    weightPercent: number;
    isOptimal: boolean;
  } | null;
  estimatedCost?: number;
  consolidationOpportunities?: {
    canCombine: boolean;
    savingsPercent?: number;
  };
}

export class LoadOptimizationService {
  /**
   * Analyze a set of orders and recommend optimal vehicle
   */
  static async analyzeOrders(
    params: LoadAnalysisParams,
  ): Promise<LoadAnalysisResult> {
    const { orderIds = [] } = params;

    // Fetch orders with items
    const orders = await prisma.salesOrder.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    // Calculate totals
    let totalVolumeCubicFeet = 0;
    let totalWeightLbs = 0;
    let totalPallets = 0;

    for (const order of orders) {
      for (const item of order.items) {
        const inventoryItem = item.inventoryItem;
        const quantity = item.quantity;

        // Calculate volume (convert inches to cubic feet)
        if (
          inventoryItem.lengthInches &&
          inventoryItem.widthInches &&
          inventoryItem.heightInches
        ) {
          const volumeCubicInches =
            inventoryItem.lengthInches *
            inventoryItem.widthInches *
            inventoryItem.heightInches;
          totalVolumeCubicFeet += (volumeCubicInches / 1728) * quantity; // 1728 = 12^3
        }

        // Calculate weight
        if (inventoryItem.weightLbs) {
          totalWeightLbs += inventoryItem.weightLbs * quantity;
        }

        // Estimate pallets (rough: 4 cubic feet per pallet)
        totalPallets += Math.ceil(totalVolumeCubicFeet / 4);
      }
    }

    // Round to reasonable precision
    totalVolumeCubicFeet = Math.ceil(totalVolumeCubicFeet * 10) / 10;
    totalWeightLbs = Math.ceil(totalWeightLbs * 10) / 10;

    // Get vehicle recommendation
    const recommendedVehicle = recommendVehicle({
      totalVolumeCubicFeet,
      totalWeightLbs,
      palletCount: totalPallets,
      prioritize: "utilization",
    });

    // Calculate utilization
    const utilization = recommendedVehicle
      ? calculateUtilization(recommendedVehicle, totalVolumeCubicFeet, totalWeightLbs)
      : null;

    // Calculate estimated cost
    const estimatedCost = recommendedVehicle?.costPerMile
      ? recommendedVehicle.costPerMile * 100 // Assume 100 mile average
      : undefined;

    return {
      totalOrders: orders.length,
      totalVolumeCubicFeet,
      totalWeightLbs,
      totalPallets,
      recommendedVehicle,
      alternativeVehicles: [], // Can be enhanced to show alternatives
      utilization,
      estimatedCost,
    };
  }

  /**
   * Find consolidation opportunities for multiple orders
   */
  static async findConsolidationOpportunities(
    orderIds: string[],
  ): Promise<{
    canConsolidate: boolean;
    groups: string[][];
    savings: number;
  }> {
    // Fetch orders
    const orders = await prisma.salesOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    // Group orders by destination zip (simple logic)
    const groups: Map<string, string[]> = new Map();

    for (const order of orders) {
      const zip = order.shippingAddress?.substring(0, 5) || "unknown";
      if (!groups.has(zip)) {
        groups.set(zip, []);
      }
      groups.get(zip)!.push(order.id);
    }

    // Orders that can be consolidated (same destination)
    const consolidatable = Array.from(groups.values()).filter(
      (group) => group.length > 1,
    );

    return {
      canConsolidate: consolidatable.length > 0,
      groups: consolidatable,
      savings: consolidatable.length * 15, // Rough estimate: 15% savings per consolidation
    };
  }

  /**
   * Optimize warehouse picking routes based on vehicle capacity
   */
  static async optimizePickingRoute(params: {
    warehouseId: string;
    vehicleType: VehicleType;
    orderIds: string[];
  }): Promise<{
    optimizedSequence: string[];
    estimatedPickTime: number;
    fillRate: number;
  }> {
    const { orderIds, vehicleType } = params;

    const orders = await prisma.salesOrder.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    // Simple optimization: sort by location zone
    const sortedOrders = orders.sort((a, b) => {
      const aZone =
        a.items[0]?.inventoryItem?.location?.zone || "Z";
      const bZone =
        b.items[0]?.inventoryItem?.location?.zone || "Z";
      return aZone.localeCompare(bZone);
    });

    // Calculate estimated pick time (5 min per order)
    const estimatedPickTime = orders.length * 5;

    // Calculate fill rate
    const analysis = await this.analyzeOrders({ orderIds });
    const fillRate = analysis.utilization?.volumePercent || 0;

    return {
      optimizedSequence: sortedOrders.map((o) => o.id),
      estimatedPickTime,
      fillRate,
    };
  }

  /**
   * Get vehicle recommendations for a warehouse's daily orders
   */
  static async getDailyVehicleNeeds(params: {
    warehouseId: string;
    date: Date;
  }): Promise<{
    totalOrders: number;
    recommendedVehicles: Array<{
      vehicle: VehicleType;
      orderCount: number;
      utilization: number;
    }>;
    totalCost: number;
  }> {
    const { warehouseId, date } = params;

    // Get orders for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.salesOrder.findMany({
      where: {
        warehouseId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["pending", "processing"],
        },
      },
    });

    // Analyze all orders together
    const analysis = await this.analyzeOrders({
      orderIds: orders.map((o) => o.id),
    });

    const recommendedVehicles = [];
    if (analysis.recommendedVehicle) {
      recommendedVehicles.push({
        vehicle: analysis.recommendedVehicle,
        orderCount: orders.length,
        utilization: analysis.utilization?.volumePercent || 0,
      });
    }

    return {
      totalOrders: orders.length,
      recommendedVehicles,
      totalCost: analysis.estimatedCost || 0,
    };
  }
}
