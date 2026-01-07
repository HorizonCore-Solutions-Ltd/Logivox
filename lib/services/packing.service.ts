/**
 * Packing Service
 *
 * Handles packing operations including:
 * - Pack creation & management (packing tasks)
 * - Cartonization optimization (auto-assign items to boxes)
 * - Multi-parcel shipments
 * - Pack completion tracking
 * - Packer performance metrics
 */

import { prisma } from "@/lib/prisma";
import { PackingStatus } from "@prisma/client";

interface CartonizationParams {
  salesOrderId: string;
  pickListId?: string;
  items: Array<{
    salesOrderItemId: string;
    inventoryItemId: string;
    quantity: number;
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
  }>;
  availableBoxes?: Array<{
    boxType: string;
    maxWeight: number;
    dimensions: { length: number; width: number; height: number };
  }>;
}

interface PackCreateParams {
  organizationId: string;
  warehouseId: string;
  salesOrderId: string;
  pickListId?: string;
  createdById: string;
  packages: Array<{
    packageNumber: string;
    boxType: string;
    dimensions: { length: number; width: number; height: number };
    weight: number;
    items: Array<{
      salesOrderItemId: string;
      inventoryItemId: string;
      quantity: number;
      binLocation?: string;
    }>;
  }>;
}

export class PackingService {
  /**
   * Create a pack (packing task) with packages
   */
  static async createPack(params: PackCreateParams) {
    const packNumber = await this.generatePackNumber(params.organizationId);

    // Calculate total weight
    const totalWeight = params.packages.reduce(
      (sum, pkg) => sum + pkg.weight,
      0,
    );

    const pack = await prisma.pack.create({
      data: {
        organizationId: params.organizationId,
        packNumber,
        salesOrderId: params.salesOrderId,
        pickListId: params.pickListId,
        warehouseId: params.warehouseId,
        status: PackingStatus.PENDING,
        totalPackages: params.packages.length,
        totalWeight,
        createdById: params.createdById,
        packages: {
          create: params.packages.map((pkg, index) => ({
            packageNumber: String(index + 1),
            packageType: pkg.boxType,
            weight: pkg.weight,
            dimensions: pkg.dimensions,
            items: {
              create: pkg.items.map((item) => ({
                salesOrderItemId: item.salesOrderItemId,
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                binLocation: item.binLocation,
              })),
            },
          })),
        },
      },
      include: {
        packages: {
          include: {
            items: {
              include: {
                inventoryItem: true,
                salesOrderItem: true,
              },
            },
          },
        },
        salesOrder: true,
      },
    });

    return pack;
  }

  /**
   * Auto-cartonize order items into optimal boxes
   * Uses First Fit Decreasing bin packing algorithm
   */
  static async cartonizeOrder(params: CartonizationParams) {
    const { salesOrderId, items, availableBoxes } = params;

    // Get default box types if not provided
    const boxes = availableBoxes || this.getDefaultBoxTypes();

    // Calculate item volumes
    const itemsWithVolume = items.map((item) => {
      const dims = item.dimensions || { length: 10, width: 10, height: 10 };
      return {
        ...item,
        volume: dims.length * dims.width * dims.height,
        weight: item.weight || 1,
      };
    });

    // Sort items by volume (largest first)
    const sortedItems = [...itemsWithVolume].sort(
      (a, b) => b.volume - a.volume,
    );

    // Sort boxes by volume
    const sortedBoxes = [...boxes].sort((a, b) => {
      const aVol =
        a.dimensions.length * a.dimensions.width * a.dimensions.height;
      const bVol =
        b.dimensions.length * b.dimensions.width * b.dimensions.height;
      return aVol - bVol;
    });

    const packages: Array<{
      boxType: string;
      dimensions: { length: number; width: number; height: number };
      items: typeof items;
      usedVolume: number;
      totalVolume: number;
      usedWeight: number;
      maxWeight: number;
    }> = [];

    // Bin packing algorithm
    for (const item of sortedItems) {
      let packed = false;

      // Try to fit in existing packages
      for (const pkg of packages) {
        const availableVolume = pkg.totalVolume - pkg.usedVolume;
        const availableWeight = pkg.maxWeight - pkg.usedWeight;

        if (
          availableVolume >= item.volume * item.quantity &&
          availableWeight >= item.weight * item.quantity
        ) {
          pkg.items.push(item);
          pkg.usedVolume += item.volume * item.quantity;
          pkg.usedWeight += item.weight * item.quantity;
          packed = true;
          break;
        }
      }

      // Create new package if needed
      if (!packed) {
        const suitableBox = sortedBoxes.find((box) => {
          const boxVolume =
            box.dimensions.length *
            box.dimensions.width *
            box.dimensions.height;
          return (
            boxVolume >= item.volume * item.quantity &&
            box.maxWeight >= item.weight * item.quantity
          );
        });

        if (!suitableBox) {
          throw new Error(
            `No suitable box found for item ${item.inventoryItemId}`,
          );
        }

        const boxVolume =
          suitableBox.dimensions.length *
          suitableBox.dimensions.width *
          suitableBox.dimensions.height;

        packages.push({
          boxType: suitableBox.boxType,
          dimensions: suitableBox.dimensions,
          items: [item],
          usedVolume: item.volume * item.quantity,
          totalVolume: boxVolume,
          usedWeight: item.weight * item.quantity,
          maxWeight: suitableBox.maxWeight,
        });
      }
    }

    // Calculate utilization metrics
    const utilization = packages.map((pkg) => ({
      boxType: pkg.boxType,
      volumeUtilization: (pkg.usedVolume / pkg.totalVolume) * 100,
      weightUtilization: (pkg.usedWeight / pkg.maxWeight) * 100,
      items: pkg.items,
      dimensions: pkg.dimensions,
      weight: pkg.usedWeight,
    }));

    return {
      totalPackages: packages.length,
      packages: utilization,
      averageVolumeUtilization:
        utilization.reduce((sum, u) => sum + u.volumeUtilization, 0) /
        utilization.length,
      averageWeightUtilization:
        utilization.reduce((sum, u) => sum + u.weightUtilization, 0) /
        utilization.length,
    };
  }

  /**
   * Start packing (assign packer)
   */
  static async startPacking(params: { packId: string; packedById: string }) {
    return prisma.pack.update({
      where: { id: params.packId },
      data: {
        status: PackingStatus.IN_PROGRESS,
        packedById: params.packedById,
        startedDate: new Date(),
      },
      include: {
        packages: {
          include: {
            items: {
              include: {
                inventoryItem: true,
                salesOrderItem: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Complete pack (all packages ready)
   */
  static async completePack(packId: string) {
    const pack = await prisma.pack.update({
      where: { id: packId },
      data: {
        status: PackingStatus.PACKED,
        completedDate: new Date(),
      },
      include: {
        salesOrder: true,
      },
    });

    // Update sales order status
    await prisma.salesOrder.update({
      where: { id: pack.salesOrderId },
      data: {
        status: "PACKED",
        packedDate: new Date(),
      },
    });

    return pack;
  }

  /**
   * Cancel pack
   */
  static async cancelPack(params: { packId: string; reason: string }) {
    return prisma.pack.update({
      where: { id: params.packId },
      data: {
        status: PackingStatus.CANCELLED,
        notes: params.reason,
      },
    });
  }

  /**
   * Get pack details
   */
  static async getPackById(packId: string) {
    return prisma.pack.findUnique({
      where: { id: packId },
      include: {
        packages: {
          include: {
            items: {
              include: {
                inventoryItem: true,
                salesOrderItem: true,
              },
            },
          },
        },
        salesOrder: {
          include: {
            customer: true,
          },
        },
        pickList: true,
        warehouse: true,
        packedBy: true,
        createdBy: true,
      },
    });
  }

  /**
   * Get packs for order
   */
  static async getOrderPacks(salesOrderId: string) {
    return prisma.pack.findMany({
      where: { salesOrderId },
      include: {
        packages: {
          include: {
            items: true,
          },
        },
        packedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get packer performance metrics
   */
  static async getPackerMetrics(params: {
    warehouseId: string;
    packedById?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { warehouseId, packedById, startDate, endDate } = params;

    const where: any = {
      warehouseId,
      status: PackingStatus.PACKED,
    };

    if (packedById) {
      where.packedById = packedById;
    }

    if (startDate || endDate) {
      where.completedDate = {};
      if (startDate) where.completedDate.gte = startDate;
      if (endDate) where.completedDate.lte = endDate;
    }

    const packs = await prisma.pack.findMany({
      where,
      include: {
        packages: {
          include: {
            items: true,
          },
        },
        packedBy: true,
      },
    });

    // Calculate metrics by packer
    const packerStats: Record<string, any> = {};

    for (const pack of packs) {
      if (!pack.packedById) continue;

      const packerId = pack.packedById;

      if (!packerStats[packerId]) {
        packerStats[packerId] = {
          packerId,
          packerName: pack.packedBy?.name || "Unknown",
          totalPacks: 0,
          totalPackages: 0,
          totalItems: 0,
          totalWeight: 0,
          averagePackTime: 0,
          packsPerHour: 0,
          packTimes: [],
        };
      }

      const stat = packerStats[packerId];
      stat.totalPacks++;
      stat.totalPackages += pack.totalPackages;
      stat.totalWeight += Number(pack.totalWeight || 0);

      // Count items
      const itemCount = pack.packages.reduce(
        (sum, pkg) => sum + pkg.items.length,
        0,
      );
      stat.totalItems += itemCount;

      // Calculate pack time
      if (pack.startedDate && pack.completedDate) {
        const packTime =
          (pack.completedDate.getTime() - pack.startedDate.getTime()) /
          1000 /
          60; // minutes
        stat.packTimes.push(packTime);
      }
    }

    // Calculate averages
    for (const packerId in packerStats) {
      const stat = packerStats[packerId];

      if (stat.packTimes.length > 0) {
        stat.averagePackTime =
          stat.packTimes.reduce((sum: number, t: number) => sum + t, 0) /
          stat.packTimes.length;
        stat.packsPerHour =
          stat.averagePackTime > 0 ? 60 / stat.averagePackTime : 0;
      }

      delete stat.packTimes; // Remove temporary array
    }

    return {
      totalPacks: packs.length,
      totalPackages: packs.reduce((sum, p) => sum + p.totalPackages, 0),
      totalItems: packs.reduce(
        (sum, p) =>
          sum + p.packages.reduce((s, pkg) => s + pkg.items.length, 0),
        0,
      ),
      packerStats: Object.values(packerStats),
    };
  }

  /**
   * Get packs by status
   */
  static async getPacksByStatus(params: {
    warehouseId: string;
    status: PackingStatus;
    limit?: number;
  }) {
    return prisma.pack.findMany({
      where: {
        warehouseId: params.warehouseId,
        status: params.status,
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
          },
        },
        packages: true,
        packedBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
    });
  }

  /**
   * Bulk create packs from pick lists
   */
  static async bulkCreateFromPickLists(params: {
    pickListIds: string[];
    warehouseId: string;
    createdById: string;
  }) {
    const results = await Promise.all(
      params.pickListIds.map(async (pickListId) => {
        try {
          const pickList = await prisma.pickList.findUnique({
            where: { id: pickListId },
            include: {
              items: {
                include: {
                  inventoryItem: true,
                  salesOrderItem: true,
                },
              },
              salesOrder: true,
            },
          });

          if (!pickList) {
            return { pickListId, success: false, error: "Pick list not found" };
          }

          // Auto-cartonize
          const cartonization = await this.cartonizeOrder({
            salesOrderId: pickList.salesOrderId,
            pickListId,
            items: pickList.items.map((item) => ({
              salesOrderItemId: item.salesOrderItemId,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantityPicked || 0,
              weight: (item.inventoryItem.metadata as any)?.weight,
              dimensions: (item.inventoryItem.metadata as any)?.dimensions,
            })),
          });

          // Create pack with packages
          const pack = await this.createPack({
            organizationId: pickList.organizationId,
            warehouseId: params.warehouseId,
            salesOrderId: pickList.salesOrderId,
            pickListId,
            createdById: params.createdById,
            packages: cartonization.packages.map((pkg) => ({
              packageNumber: `${pickListId}-${pkg.boxType}`,
              boxType: pkg.boxType,
              dimensions: pkg.dimensions,
              weight: pkg.weight,
              items: pkg.items.map((item) => ({
                salesOrderItemId: item.salesOrderItemId,
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
              })),
            })),
          });

          return {
            pickListId,
            success: true,
            packId: pack.id,
            packages: pack.packages.length,
          };
        } catch (error) {
          return {
            pickListId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    return {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Generate pack slip / packing list
   */
  static async generatePackSlip(packId: string) {
    const pack = await this.getPackById(packId);

    if (!pack) {
      throw new Error("Pack not found");
    }

    return {
      packNumber: pack.packNumber,
      orderNumber: pack.salesOrder.soNumber,
      customer: {
        name: pack.salesOrder.customer.name,
        address: pack.salesOrder.shippingAddress,
      },
      packages: pack.packages.map((pkg, index) => ({
        packageNumber: `${index + 1} of ${pack.packages.length}`,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        items: pkg.items.map((item) => ({
          sku: item.inventoryItem.sku,
          name: item.inventoryItem.name,
          quantity: item.quantity,
          binLocation: item.binLocation,
        })),
      })),
      packedBy: pack.packedBy?.name,
      packedDate: pack.completedDate,
      notes: pack.notes,
    };
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private static getDefaultBoxTypes() {
    // Return standard USPS/UPS box sizes
    return [
      {
        boxType: "SMALL",
        maxWeight: 20,
        dimensions: { length: 12, width: 9, height: 6 },
      },
      {
        boxType: "MEDIUM",
        maxWeight: 40,
        dimensions: { length: 16, width: 12, height: 8 },
      },
      {
        boxType: "LARGE",
        maxWeight: 70,
        dimensions: { length: 20, width: 16, height: 12 },
      },
      {
        boxType: "EXTRA_LARGE",
        maxWeight: 150,
        dimensions: { length: 24, width: 20, height: 18 },
      },
    ];
  }

  private static async generatePackNumber(
    organizationId: string,
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const count = await prisma.pack.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    return `PACK-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
}
