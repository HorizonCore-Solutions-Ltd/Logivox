/**
 * Wave Picking Service
 * Advanced Wave Management & Order Fulfillment Optimization
 *
 * Handles:
 * - Wave creation & planning
 * - Order batching & grouping
 * - Pick route optimization
 * - Multi-zone picking
 * - Picker performance tracking
 * - Wave analytics
 */

import { prisma } from "@/lib/prisma";
import {
  WaveStatus,
  WaveType,
  WavePriority,
  WaveStrategy,
  PickLineStatus,
  PickListStatus,
  SalesOrderStatus,
  Prisma,
} from "@prisma/client";

export class WavePickingService {
  /**
   * Create a new picking wave
   */
  static async createWave(params: {
    organizationId: string;
    warehouseId: string;
    createdById: string;
    name: string;
    description?: string;
    waveType: WaveType;
    priority?: WavePriority;
    strategy: WaveStrategy;
    scheduledFor?: Date;
    pickDeadline?: Date;
    shipDate?: Date;
    groupingCriteria?: {
      byZone?: boolean;
      byCarrier?: boolean;
      byShipDate?: boolean;
      byPriority?: boolean;
      byCustomer?: boolean;
    };
    maxLines?: number;
    maxOrders?: number;
    maxWeight?: number;
    maxVolume?: number;
    orderIds?: string[];
    autoRelease?: boolean;
  }) {
    // Generate wave number
    const waveCount = await prisma.wavePick.count({
      where: { organizationId: params.organizationId },
    });
    const waveNumber = `WAVE-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(waveCount + 1).padStart(4, "0")}`;

    // If orderIds provided, use them; otherwise find eligible orders
    let orderIds = params.orderIds;
    if (!orderIds || orderIds.length === 0) {
      orderIds = await WavePickingService.findEligibleOrders({
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        groupingCriteria: params.groupingCriteria,
        maxOrders: params.maxOrders,
        shipDate: params.shipDate,
      });
    }

    if (orderIds.length === 0) {
      throw new Error("No eligible orders found for wave");
    }

    // Get order details for statistics
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

    // Calculate wave statistics
    const totalLines = orders.reduce(
      (sum, order) => sum + order.items.length,
      0,
    );
    const totalQuantity = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((qtySum, item) => qtySum + item.quantity, 0),
      0,
    );

    // Create wave
    const wave = await prisma.wavePick.create({
      data: {
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        waveNumber,
        name: params.name,
        description: params.description,
        waveType: params.waveType,
        priority: params.priority || WavePriority.NORMAL,
        strategy: params.strategy,
        groupingCriteria: params.groupingCriteria || {},
        maxLines: params.maxLines,
        maxOrders: params.maxOrders,
        maxWeight: params.maxWeight,
        maxVolume: params.maxVolume,
        scheduledFor: params.scheduledFor,
        pickDeadline: params.pickDeadline,
        shipDate: params.shipDate,
        status: WaveStatus.PLANNED,
        totalOrders: orders.length,
        totalLines,
        totalQuantity,
        createdById: params.createdById,
      },
    });

    // Create wave pick lines
    let lineNumber = 1;
    for (const order of orders) {
      for (const item of order.items) {
        await prisma.wavePickLine.create({
          data: {
            organizationId: params.organizationId,
            wavePickId: wave.id,
            lineNumber: lineNumber++,
            salesOrderId: order.id,
            inventoryItemId: item.inventoryItemId,
            orderedQuantity: item.quantity,
            priority: typeof order.priority === "number" ? order.priority : 5,
          },
        });
      }
    }

    // Auto-release if specified
    if (params.autoRelease) {
      await this.releaseWave({ waveId: wave.id });
    }

    return await prisma.wavePick.findUnique({
      where: { id: wave.id },
      include: {
        lines: {
          include: {
            inventoryItem: true,
            salesOrder: true,
          },
        },
      },
    });
  }

  /**
   * Find eligible orders for wave picking
   */
  private static async findEligibleOrders(params: {
    organizationId: string;
    warehouseId: string;
    groupingCriteria?: any;
    maxOrders?: number;
    shipDate?: Date;
  }): Promise<string[]> {
    const where: Prisma.SalesOrderWhereInput = {
      organizationId: params.organizationId,
      warehouseId: params.warehouseId,
      status: {
        in: [SalesOrderStatus.APPROVED, SalesOrderStatus.PENDING_APPROVAL],
      },
    };

    const orders = await prisma.salesOrder.findMany({
      where,
      orderBy: [{ priority: "desc" }, { orderDate: "asc" }],
      take: params.maxOrders || 50,
      select: { id: true },
    });

    return orders.map((o) => o.id);
  }

  /**
   * Release wave for picking
   */
  static async releaseWave(params: {
    waveId: string;
    assignToId?: string;
    createPickLists?: boolean;
  }) {
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.waveId },
      include: {
        lines: {
          include: {
            inventoryItem: true,
            salesOrder: true,
          },
          orderBy: {
            lineNumber: "asc",
          },
        },
      },
    });

    if (!wave) {
      throw new Error("Wave not found");
    }

    if (wave.status !== WaveStatus.PLANNED) {
      throw new Error(`Cannot release wave with status: ${wave.status}`);
    }

    // Optimize pick sequence
    const optimizedLines = await this.optimizePickSequence(wave.lines);

    // Update wave status
    await prisma.wavePick.update({
      where: { id: params.waveId },
      data: {
        status: WaveStatus.RELEASED,
        releaseTime: new Date(),
        assignedToId: params.assignToId,
        assignedAt: params.assignToId ? new Date() : undefined,
      },
    });

    // Update line pick sequences
    for (let i = 0; i < optimizedLines.length; i++) {
      await prisma.wavePickLine.update({
        where: { id: optimizedLines[i].id },
        data: {
          pickSequence: i + 1,
          status: PickLineStatus.ASSIGNED,
        },
      });
    }

    // Create pick lists if requested
    if (params.createPickLists) {
      await this.createPickListsForWave({
        waveId: params.waveId,
        createdById: wave.createdById,
      });
    }

    return await prisma.wavePick.findUnique({
      where: { id: params.waveId },
      include: { lines: true },
    });
  }

  /**
   * Optimize pick sequence using zone-based routing
   */
  private static async optimizePickSequence(lines: any[]) {
    // Group by location/zone for optimal routing
    // This is a simplified version - production would use actual warehouse layout

    // Sort by zone, aisle, rack, level
    return lines.sort((a, b) => {
      const aLoc = a.location?.path || "Z-99-99-99";
      const bLoc = b.location?.path || "Z-99-99-99";
      return aLoc.localeCompare(bLoc);
    });
  }

  /**
   * Create pick lists for wave (split by picker/zone)
   */
  private static async createPickListsForWave(params: {
    waveId: string;
    createdById: string;
    pickersPerZone?: number;
  }) {
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.waveId },
      include: {
        lines: {
          include: {
            salesOrder: true,
          },
        },
      },
    });

    if (!wave) {
      throw new Error("Wave not found");
    }

    // Group lines by sales order
    const orderGroups = new Map<string, any[]>();
    wave.lines.forEach((line) => {
      if (!orderGroups.has(line.salesOrderId)) {
        orderGroups.set(line.salesOrderId, []);
      }
      orderGroups.get(line.salesOrderId)!.push(line);
    });

    // Create one pick list per order
    let pickListCount = 0;
    for (const [salesOrderId, lines] of orderGroups) {
      const pickListNumber = `PICK-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(pickListCount++ + 1).padStart(4, "0")}`;

      const pickList = await prisma.pickList.create({
        data: {
          organizationId: wave.organizationId,
          warehouseId: wave.warehouseId,
          pickListNumber,
          salesOrderId,
          status: PickListStatus.PENDING,
          createdById: params.createdById,
        },
      });

      // Link lines to pick list
      await prisma.wavePickLine.updateMany({
        where: {
          id: { in: lines.map((l) => l.id) },
        },
        data: {
          pickListId: pickList.id,
        },
      });

      // Create pick list items
      for (const line of lines) {
        await prisma.pickListItem.create({
          data: {
            pickListId: pickList.id,
            salesOrderItemId: line.salesOrder.items[0]?.id, // Simplified
            inventoryItemId: line.inventoryItemId,
            quantityToPick: line.orderedQuantity,
          },
        });
      }
    }

    return pickListCount;
  }

  /**
   * Start wave picking
   */
  static async startWave(params: { waveId: string; startedById: string }) {
    const wave = await prisma.wavePick.update({
      where: { id: params.waveId },
      data: {
        status: WaveStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    // Update sales orders to PICKING status
    const lines = await prisma.wavePickLine.findMany({
      where: { wavePickId: params.waveId },
      select: { salesOrderId: true },
      distinct: ["salesOrderId"],
    });

    await prisma.salesOrder.updateMany({
      where: {
        id: { in: lines.map((l) => l.salesOrderId) },
      },
      data: {
        status: SalesOrderStatus.PICKING,
      },
    });

    return wave;
  }

  /**
   * Record pick for a wave line
   */
  static async recordPick(params: {
    lineId: string;
    pickedQuantity: number;
    pickedById: string;
    binLocation?: string;
    batchNumber?: string;
    serialNumbers?: string[];
  }) {
    const existingLine = await prisma.wavePickLine.findUnique({
      where: { id: params.lineId },
    });

    if (!existingLine) {
      throw new Error("Wave pick line not found");
    }

    const line = await prisma.wavePickLine.update({
      where: { id: params.lineId },
      data: {
        pickedQuantity: params.pickedQuantity,
        shortQuantity:
          params.pickedQuantity < existingLine.orderedQuantity
            ? existingLine.orderedQuantity - params.pickedQuantity
            : 0,
        status:
          params.pickedQuantity > 0
            ? PickLineStatus.PICKED
            : PickLineStatus.SHORT,
        pickedById: params.pickedById,
        pickedAt: new Date(),
        serialNumbers: params.serialNumbers || [],
      },
      include: {
        wavePick: true,
      },
    });

    // Update wave progress
    await this.updateWaveProgress(line.wavePickId);

    // Update inventory
    if (params.pickedQuantity > 0) {
      await prisma.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: {
          quantity: {
            decrement: params.pickedQuantity,
          },
          reservedQty: {
            decrement: params.pickedQuantity,
          },
        },
      });

      // Create inventory movement record
      await prisma.inventoryMovement.create({
        data: {
          inventoryItemId: line.inventoryItemId,
          type: "SALE",
          quantity: -params.pickedQuantity,
          reason: `Wave pick ${line.wavePick.waveNumber}`,
          notes: `Picked by ${params.pickedById}`,
        },
      });
    }

    return line;
  }

  /**
   * Update wave progress
   */
  private static async updateWaveProgress(waveId: string) {
    const wave = await prisma.wavePick.findUnique({
      where: { id: waveId },
      include: {
        lines: true,
      },
    });

    if (!wave) return;

    const pickedLines = wave.lines.filter(
      (l) => l.status === PickLineStatus.PICKED,
    ).length;
    const progress = (pickedLines / wave.totalLines) * 100;

    await prisma.wavePick.update({
      where: { id: waveId },
      data: {
        pickedLines,
        progress,
      },
    });

    // If all lines picked, complete wave
    if (pickedLines === wave.totalLines) {
      await this.completeWave({ waveId });
    }
  }

  /**
   * Complete wave picking
   */
  static async completeWave(params: { waveId: string }) {
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.waveId },
      include: {
        lines: {
          include: {
            salesOrder: true,
          },
        },
      },
    });

    if (!wave) {
      throw new Error("Wave not found");
    }

    const completedAt = new Date();
    const duration = wave.startedAt
      ? Math.round(
          (completedAt.getTime() - wave.startedAt.getTime()) / (1000 * 60),
        )
      : 0;

    // Calculate performance metrics
    const pickRate = duration > 0 ? (wave.pickedLines / duration) * 60 : 0; // lines per hour
    const accuracy =
      wave.totalLines > 0 ? (wave.pickedLines / wave.totalLines) * 100 : 0;

    await prisma.wavePick.update({
      where: { id: params.waveId },
      data: {
        status: WaveStatus.COMPLETED,
        completedAt,
        duration,
        pickRate,
        accuracy,
      },
    });

    // Update sales orders to PICKED
    const uniqueOrderIds = [...new Set(wave.lines.map((l) => l.salesOrderId))];
    await prisma.salesOrder.updateMany({
      where: {
        id: { in: uniqueOrderIds },
      },
      data: {
        status: SalesOrderStatus.PICKED,
        pickedDate: completedAt,
      },
    });

    return wave;
  }

  /**
   * Cancel wave
   */
  static async cancelWave(params: { waveId: string; reason: string }) {
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.waveId },
      include: { lines: true },
    });

    if (!wave) {
      throw new Error("Wave not found");
    }

    if (wave.status === WaveStatus.COMPLETED) {
      throw new Error("Cannot cancel completed wave");
    }

    // Restore inventory for picked items
    for (const line of wave.lines) {
      if (line.pickedQuantity > 0) {
        await prisma.inventoryItem.update({
          where: { id: line.inventoryItemId },
          data: {
            quantity: {
              increment: line.pickedQuantity,
            },
            reservedQty: {
              decrement: line.pickedQuantity,
            },
          },
        });
      }
    }

    await prisma.wavePick.update({
      where: { id: params.waveId },
      data: {
        status: WaveStatus.CANCELLED,
        notes: `Cancelled: ${params.reason}`,
      },
    });

    return wave;
  }

  /**
   * Get wave metrics and analytics
   */
  static async getWaveMetrics(params: {
    organizationId: string;
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const startDate =
      params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const where: Prisma.WavePickWhereInput = {
      organizationId: params.organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    // Total waves
    const totalWaves = await prisma.wavePick.count({ where });

    // Waves by status
    const byStatus = await prisma.wavePick.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Average metrics
    const avgMetrics = await prisma.wavePick.aggregate({
      where: {
        ...where,
        status: WaveStatus.COMPLETED,
      },
      _avg: {
        duration: true,
        pickRate: true,
        accuracy: true,
        totalLines: true,
        totalOrders: true,
      },
    });

    // Completion rate
    const completedWaves = await prisma.wavePick.count({
      where: {
        ...where,
        status: WaveStatus.COMPLETED,
      },
    });

    // Total picks
    const totalPicks = await prisma.wavePickLine.count({
      where: {
        wavePick: where,
        status: PickLineStatus.PICKED,
      },
    });

    // Short picks
    const shortPicks = await prisma.wavePickLine.count({
      where: {
        wavePick: where,
        status: PickLineStatus.SHORT,
      },
    });

    return {
      period: { startDate, endDate },
      totalWaves,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        percentage: (s._count / totalWaves) * 100,
      })),
      completionRate: (completedWaves / totalWaves) * 100,
      averagePickRate: avgMetrics._avg.pickRate || 0,
      averageAccuracy: avgMetrics._avg.accuracy || 0,
      averageDuration: avgMetrics._avg.duration || 0,
      averageLinesPerWave: avgMetrics._avg.totalLines || 0,
      averageOrdersPerWave: avgMetrics._avg.totalOrders || 0,
      totalPicks,
      shortPicks,
      shortPickRate: totalPicks > 0 ? (shortPicks / totalPicks) * 100 : 0,
    };
  }

  /**
   * Get picker performance metrics
   */
  static async getPickerPerformance(params: {
    organizationId: string;
    pickerId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const startDate =
      params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const where: any = {
      organizationId: params.organizationId,
      pickedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: PickLineStatus.PICKED,
    };

    if (params.pickerId) {
      where.pickedById = params.pickerId;
    }

    // Group by picker
    const byPicker = await prisma.wavePickLine.groupBy({
      by: ["pickedById"],
      where,
      _count: true,
      _sum: {
        pickedQuantity: true,
      },
    });

    const pickerStats = await Promise.all(
      byPicker.map(async (picker) => {
        if (!picker.pickedById) return null;

        const user = await prisma.user.findUnique({
          where: { id: picker.pickedById },
          select: { id: true, name: true, email: true },
        });

        // Calculate pick rate
        const lines = await prisma.wavePickLine.findMany({
          where: {
            ...where,
            pickedById: picker.pickedById,
          },
          select: {
            pickedAt: true,
            wavePick: {
              select: { startedAt: true },
            },
          },
        });

        const totalMinutes = lines.reduce((sum, line) => {
          if (line.pickedAt && line.wavePick.startedAt) {
            return (
              sum +
              (line.pickedAt.getTime() - line.wavePick.startedAt.getTime()) /
                (1000 * 60)
            );
          }
          return sum;
        }, 0);

        const pickRate =
          totalMinutes > 0 ? (picker._count / totalMinutes) * 60 : 0;

        return {
          picker: user,
          totalPicks: picker._count,
          totalQuantity: picker._sum.pickedQuantity || 0,
          pickRate: Math.round(pickRate * 100) / 100,
          averageQuantityPerPick: picker._sum.pickedQuantity
            ? picker._sum.pickedQuantity / picker._count
            : 0,
        };
      }),
    );

    return pickerStats.filter(Boolean);
  }

  /**
   * List waves with filters
   */
  static async listWaves(params: {
    organizationId: string;
    warehouseId?: string;
    status?: WaveStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WavePickWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [waves, total] = await Promise.all([
      prisma.wavePick.findMany({
        where,
        include: {
          warehouse: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lines: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.wavePick.count({ where }),
    ]);

    return {
      waves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get wave details by ID
   */
  static async getWaveDetails(waveId: string) {
    return await prisma.wavePick.findUnique({
      where: { id: waveId },
      include: {
        warehouse: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            inventoryItem: {
              include: {
                category: true,
              },
            },
            salesOrder: {
              include: {
                customer: true,
              },
            },
            pickedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            pickSequence: "asc",
          },
        },
      },
    });
  }

  /**
   * Suggest optimal wave configuration
   */
  static async suggestWaveConfiguration(params: {
    organizationId: string;
    warehouseId: string;
    orderCount: number;
  }) {
    // Analyze historical data to suggest optimal wave size
    const historicalWaves = await prisma.wavePick.findMany({
      where: {
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        status: WaveStatus.COMPLETED,
      },
      orderBy: {
        pickRate: "desc",
      },
      take: 20,
    });

    if (historicalWaves.length === 0) {
      return {
        suggestedMaxOrders: 25,
        suggestedMaxLines: 100,
        strategy: WaveStrategy.ZONE_BASED,
        reason: "Default configuration (no historical data)",
      };
    }

    const avgBestPerformingWave = {
      orders:
        historicalWaves.reduce((sum, w) => sum + w.totalOrders, 0) /
        historicalWaves.length,
      lines:
        historicalWaves.reduce((sum, w) => sum + w.totalLines, 0) /
        historicalWaves.length,
    };

    return {
      suggestedMaxOrders: Math.round(avgBestPerformingWave.orders),
      suggestedMaxLines: Math.round(avgBestPerformingWave.lines),
      strategy: WaveStrategy.ZONE_BASED,
      reason: "Based on best performing historical waves",
    };
  }
}
