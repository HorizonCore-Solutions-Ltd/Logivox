/**
 * Packing Service
 * Comprehensive packing operations management
 * Handles cartonization, packing workflows, verification,
 * shipping preparation, and packing analytics
 */

import { PrismaClient, PackStatus, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreatePackRequest {
  salesOrderId: string;
  packerId?: string;
  packingStationId?: string;
  items: Array<{
    salesOrderItemId: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface CartonizationRequest {
  items: Array<{
    productId: string;
    quantity: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    weight?: number;
  }>;
  availableBoxes?: Array<{
    boxTypeId: string;
    maxWeight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }>;
  optimizationGoal?: "MINIMIZE_BOXES" | "MINIMIZE_COST" | "MINIMIZE_WEIGHT";
}

export interface CartonizationSuggestion {
  totalBoxes: number;
  totalWeight: number;
  totalVolume: number;
  estimatedCost: number;
  boxes: Array<{
    boxType: string;
    dimensions: { length: number; width: number; height: number };
    weight: number;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }>;
}

export interface PackingMetrics {
  totalPacks: number;
  completedPacks: number;
  averagePackTime: number; // minutes
  averageItemsPerPack: number;
  averageBoxesPerOrder: number;
  packerPerformance: Array<{
    packerId: string;
    packerName: string;
    totalPacks: number;
    avgPackTime: number;
    accuracy: number;
    efficiency: number;
  }>;
  popularBoxTypes: Array<{
    boxTypeId: string;
    boxTypeName: string;
    count: number;
  }>;
  recentPacks: Array<{
    id: string;
    packNumber: string;
    status: PackStatus;
    orderNumber: string;
    itemCount: number;
    packedAt?: Date;
  }>;
}

export interface PackingVerification {
  packId: string;
  verified: boolean;
  discrepancies: Array<{
    itemId: string;
    productName: string;
    expectedQuantity: number;
    actualQuantity: number;
    variance: number;
  }>;
  totalItems: number;
  totalDiscrepancies: number;
  accuracyRate: number;
}

/**
 * Packing Service Class
 */
export class PackingService {
  /**
   * Generate unique pack number
   */
  private async generatePackNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

    const lastPack = await prisma.pack.findFirst({
      where: {
        organizationId,
        packNumber: {
          startsWith: `PACK-${dateStr}`,
        },
      },
      orderBy: {
        packNumber: "desc",
      },
    });

    let sequence = 1;
    if (lastPack) {
      const lastSequence = parseInt(lastPack.packNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    return `PACK-${dateStr}-${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * Calculate cartonization (box selection)
   */
  async calculateCartonization(
    organizationId: string,
    request: CartonizationRequest,
  ): Promise<CartonizationSuggestion> {
    // Get available box types
    const boxTypes = await prisma.boxType.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        volume: "asc", // Start with smallest boxes
      },
    });

    if (boxTypes.length === 0) {
      throw new Error("No box types available");
    }

    // Calculate total volume and weight of items
    const totalVolume = request.items.reduce((sum, item) => {
      const dims = item.dimensions || { length: 10, width: 10, height: 10 };
      return sum + dims.length * dims.width * dims.height * item.quantity;
    }, 0);

    const totalWeight = request.items.reduce(
      (sum, item) => sum + (item.weight || 1) * item.quantity,
      0,
    );

    // Simple bin packing algorithm
    const boxes: CartonizationSuggestion["boxes"] = [];
    let remainingItems = [...request.items];

    while (remainingItems.length > 0) {
      // Find smallest box that fits
      let selectedBox = null;
      let boxItems: typeof remainingItems = [];

      for (const boxType of boxTypes) {
        const boxVolume = boxType.length * boxType.width * boxType.height;
        const boxMaxWeight = boxType.maxWeight || 50;

        // Try to fit items into this box
        const tempItems: typeof remainingItems = [];
        let currentVolume = 0;
        let currentWeight = 0;

        for (const item of remainingItems) {
          const itemDims = item.dimensions || {
            length: 10,
            width: 10,
            height: 10,
          };
          const itemVolume =
            itemDims.length * itemDims.width * itemDims.height * item.quantity;
          const itemWeight = (item.weight || 1) * item.quantity;

          if (
            currentVolume + itemVolume <= boxVolume &&
            currentWeight + itemWeight <= boxMaxWeight
          ) {
            tempItems.push(item);
            currentVolume += itemVolume;
            currentWeight += itemWeight;
          }
        }

        if (tempItems.length > 0) {
          selectedBox = boxType;
          boxItems = tempItems;
          break;
        }
      }

      if (!selectedBox || boxItems.length === 0) {
        // Use largest box for remaining items
        selectedBox = boxTypes[boxTypes.length - 1];
        boxItems = [remainingItems[0]];
      }

      boxes.push({
        boxType: selectedBox.name,
        dimensions: {
          length: selectedBox.length,
          width: selectedBox.width,
          height: selectedBox.height,
        },
        weight: boxItems.reduce(
          (sum, item) => sum + (item.weight || 1) * item.quantity,
          0,
        ),
        items: boxItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // Remove packed items from remaining
      remainingItems = remainingItems.filter(
        (item) => !boxItems.includes(item),
      );
    }

    const estimatedCost = boxes.reduce((sum, box) => {
      const boxType = boxTypes.find((bt) => bt.name === box.boxType);
      return sum + (boxType?.cost?.toNumber() || 0);
    }, 0);

    return {
      totalBoxes: boxes.length,
      totalWeight,
      totalVolume,
      estimatedCost,
      boxes,
    };
  }

  /**
   * Create pack
   */
  async createPack(
    organizationId: string,
    userId: string,
    request: CreatePackRequest,
  ): Promise<any> {
    // Validate sales order
    const salesOrder = await prisma.salesOrder.findFirst({
      where: {
        id: request.salesOrderId,
        organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!salesOrder) {
      throw new Error("Sales order not found");
    }

    if (salesOrder.status !== "PICKED") {
      throw new Error("Sales order must be picked before packing");
    }

    // Generate pack number
    const packNumber = await this.generatePackNumber(organizationId);

    // Create pack
    const pack = await prisma.pack.create({
      data: {
        organizationId,
        packNumber,
        salesOrderId: request.salesOrderId,
        status: "IN_PROGRESS",
        packerId: request.packerId || userId,
        packingStationId: request.packingStationId,
        notes: request.notes,
        createdById: userId,
      },
    });

    // Create pack items
    const packItems = request.items.map((item) => ({
      packId: pack.id,
      salesOrderItemId: item.salesOrderItemId,
      quantity: item.quantity,
    }));

    await prisma.packItem.createMany({
      data: packItems,
    });

    return await prisma.pack.findUnique({
      where: { id: pack.id },
      include: {
        items: {
          include: {
            salesOrderItem: {
              include: {
                product: true,
              },
            },
          },
        },
        salesOrder: {
          include: {
            customer: true,
          },
        },
        packer: true,
      },
    });
  }

  /**
   * Add box to pack
   */
  async addBoxToPack(
    packId: string,
    organizationId: string,
    boxData: {
      boxTypeId: string;
      weight?: number;
      length?: number;
      width?: number;
      height?: number;
      trackingNumber?: string;
    },
  ): Promise<any> {
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    // Get box type
    const boxType = await prisma.boxType.findUnique({
      where: { id: boxData.boxTypeId },
    });

    if (!boxType) {
      throw new Error("Box type not found");
    }

    // Create box
    const box = await prisma.packBox.create({
      data: {
        packId,
        boxTypeId: boxData.boxTypeId,
        weight: boxData.weight || 0,
        length: boxData.length || boxType.length,
        width: boxData.width || boxType.width,
        height: boxData.height || boxType.height,
        trackingNumber: boxData.trackingNumber,
      },
    });

    return box;
  }

  /**
   * Verify pack contents
   */
  async verifyPack(
    packId: string,
    organizationId: string,
    userId: string,
    verificationData: {
      items: Array<{
        salesOrderItemId: string;
        actualQuantity: number;
      }>;
    },
  ): Promise<PackingVerification> {
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
      include: {
        items: {
          include: {
            salesOrderItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    const discrepancies: PackingVerification["discrepancies"] = [];

    for (const item of pack.items) {
      const verification = verificationData.items.find(
        (v) => v.salesOrderItemId === item.salesOrderItemId,
      );

      const actualQuantity = verification?.actualQuantity || 0;
      const expectedQuantity = item.quantity;
      const variance = actualQuantity - expectedQuantity;

      if (variance !== 0) {
        discrepancies.push({
          itemId: item.id,
          productName: item.salesOrderItem.product.name,
          expectedQuantity,
          actualQuantity,
          variance,
        });
      }
    }

    const totalItems = pack.items.length;
    const totalDiscrepancies = discrepancies.length;
    const accuracyRate =
      totalItems > 0
        ? ((totalItems - totalDiscrepancies) / totalItems) * 100
        : 100;

    // Update pack verification status
    await prisma.pack.update({
      where: { id: packId },
      data: {
        verifiedAt: new Date(),
        verifiedById: userId,
        hasDiscrepancies: totalDiscrepancies > 0,
      },
    });

    return {
      packId: pack.id,
      verified: true,
      discrepancies,
      totalItems,
      totalDiscrepancies,
      accuracyRate,
    };
  }

  /**
   * Complete pack
   */
  async completePack(
    packId: string,
    organizationId: string,
    userId: string,
  ): Promise<any> {
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
      include: {
        salesOrder: true,
      },
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    if (pack.status === "COMPLETED") {
      throw new Error("Pack already completed");
    }

    // Update pack
    const updatedPack = await prisma.pack.update({
      where: { id: packId },
      data: {
        status: "COMPLETED",
        packedAt: new Date(),
      },
      include: {
        items: {
          include: {
            salesOrderItem: {
              include: {
                product: true,
              },
            },
          },
        },
        boxes: true,
        salesOrder: true,
      },
    });

    // Update sales order status
    await prisma.salesOrder.update({
      where: { id: pack.salesOrderId },
      data: {
        status: "PACKED",
      },
    });

    return updatedPack;
  }

  /**
   * Print packing slip
   */
  async generatePackingSlip(
    packId: string,
    organizationId: string,
  ): Promise<string> {
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
      include: {
        items: {
          include: {
            salesOrderItem: {
              include: {
                product: true,
              },
            },
          },
        },
        boxes: {
          include: {
            boxType: true,
          },
        },
        salesOrder: {
          include: {
            customer: true,
          },
        },
        packer: true,
      },
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    // Would generate actual PDF
    // For now, return URL
    const slipUrl = `https://documents.logivox.com/packing-slips/${pack.id}`;

    return slipUrl;
  }

  /**
   * Get packing metrics
   */
  async getPackingMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PackingMetrics> {
    const dateFilter: any = { organizationId };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Total packs
    const totalPacks = await prisma.pack.count({ where: dateFilter });

    const completedPacks = await prisma.pack.count({
      where: { ...dateFilter, status: "COMPLETED" },
    });

    // Get packs with details
    const packs = await prisma.pack.findMany({
      where: { ...dateFilter, status: "COMPLETED" },
      include: {
        items: true,
        boxes: true,
        packer: true,
      },
    });

    // Calculate averages
    const packsWithTime = packs.filter((p) => p.createdAt && p.packedAt);
    const totalPackTime = packsWithTime.reduce((sum, p) => {
      const start = p.createdAt.getTime();
      const end = p.packedAt!.getTime();
      return sum + (end - start) / (1000 * 60);
    }, 0);

    const averagePackTime =
      packsWithTime.length > 0 ? totalPackTime / packsWithTime.length : 0;

    const totalItems = packs.reduce((sum, p) => sum + p.items.length, 0);
    const averageItemsPerPack =
      packs.length > 0 ? totalItems / packs.length : 0;

    const totalBoxes = packs.reduce((sum, p) => sum + p.boxes.length, 0);
    const averageBoxesPerOrder =
      packs.length > 0 ? totalBoxes / packs.length : 0;

    // Packer performance
    const packerGroups = packs.reduce((acc: any, p) => {
      const packerId = p.packerId || "UNKNOWN";
      if (!acc[packerId]) {
        acc[packerId] = [];
      }
      acc[packerId].push(p);
      return acc;
    }, {});

    const packerPerformance = await Promise.all(
      Object.entries(packerGroups).map(
        async ([packerId, packerPacks]: [string, any]) => {
          const packer = await prisma.user.findUnique({
            where: { id: packerId },
          });

          const packerTime = packerPacks.reduce((sum: number, p: any) => {
            if (!p.packedAt) return sum;
            const start = p.createdAt.getTime();
            const end = p.packedAt.getTime();
            return sum + (end - start) / (1000 * 60);
          }, 0);

          const avgTime =
            packerPacks.length > 0 ? packerTime / packerPacks.length : 0;

          return {
            packerId,
            packerName: packer?.name || "Unknown",
            totalPacks: packerPacks.length,
            avgPackTime: avgTime,
            accuracy: 98, // Placeholder
            efficiency: 85, // Placeholder
          };
        },
      ),
    );

    // Popular box types
    const boxTypeGroups = packs.reduce((acc: any, p) => {
      p.boxes.forEach((box) => {
        const typeId = box.boxTypeId;
        if (!acc[typeId]) {
          acc[typeId] = 0;
        }
        acc[typeId]++;
      });
      return acc;
    }, {});

    const popularBoxTypes = await Promise.all(
      Object.entries(boxTypeGroups).map(
        async ([typeId, count]: [string, any]) => {
          const boxType = await prisma.boxType.findUnique({
            where: { id: typeId },
          });

          return {
            boxTypeId: typeId,
            boxTypeName: boxType?.name || "Unknown",
            count,
          };
        },
      ),
    );

    // Recent packs
    const recentPacks = await prisma.pack.findMany({
      where: dateFilter,
      include: {
        items: true,
        salesOrder: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      totalPacks,
      completedPacks,
      averagePackTime,
      averageItemsPerPack,
      averageBoxesPerOrder,
      packerPerformance,
      popularBoxTypes: popularBoxTypes
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentPacks: recentPacks.map((p) => ({
        id: p.id,
        packNumber: p.packNumber,
        status: p.status,
        orderNumber: p.salesOrder.soNumber,
        itemCount: p.items.length,
        packedAt: p.packedAt || undefined,
      })),
    };
  }

  /**
   * Get pack by ID
   */
  async getPackById(packId: string, organizationId: string): Promise<any> {
    return await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
      include: {
        items: {
          include: {
            salesOrderItem: {
              include: {
                product: true,
              },
            },
          },
        },
        boxes: {
          include: {
            boxType: true,
          },
        },
        salesOrder: {
          include: {
            customer: true,
          },
        },
        packer: true,
        verifiedBy: true,
        createdBy: true,
      },
    });
  }

  /**
   * List packs with filters
   */
  async listPacks(
    organizationId: string,
    filters: {
      status?: PackStatus;
      packerId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ packs: any[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.packerId) where.packerId = filters.packerId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { packNumber: { contains: filters.search, mode: "insensitive" } },
        {
          salesOrder: {
            soNumber: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [total, packs] = await Promise.all([
      prisma.pack.count({ where }),
      prisma.pack.findMany({
        where,
        include: {
          salesOrder: {
            include: {
              customer: true,
            },
          },
          items: true,
          boxes: true,
          packer: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      packs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel pack
   */
  async cancelPack(
    packId: string,
    organizationId: string,
    reason: string,
  ): Promise<any> {
    const pack = await prisma.pack.findFirst({
      where: {
        id: packId,
        organizationId,
      },
    });

    if (!pack) {
      throw new Error("Pack not found");
    }

    if (pack.status === "COMPLETED") {
      throw new Error("Cannot cancel completed pack");
    }

    return await prisma.pack.update({
      where: { id: packId },
      data: {
        status: "CANCELLED",
        notes: `Cancelled: ${reason}`,
      },
    });
  }
}

export default PackingService;
