/**
 * Wave Picking Service
 * Comprehensive wave picking management
 * Handles wave creation, picker assignment, route optimization,
 * batch picking, and performance tracking
 */

import { PrismaClient, WaveStatus, PickingStrategy, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateWaveRequest {
  name?: string;
  strategy: PickingStrategy;
  maxOrdersPerWave?: number;
  maxLinesPerPicker?: number;
  priorityThreshold?: number;
  zoneIds?: string[];
  includeBackorders?: boolean;
  scheduledStartTime?: Date;
  notes?: string;
}

export interface WaveOptimizationCriteria {
  strategy: PickingStrategy;
  maxTravelDistance?: number;
  balanceWorkload?: boolean;
  groupByZone?: boolean;
  groupByProductType?: boolean;
  prioritizeUrgent?: boolean;
}

export interface PickerAssignment {
  pickerId: string;
  pickerName: string;
  totalLines: number;
  totalUnits: number;
  estimatedTime: number; // minutes
  efficiency: number; // 0-100
  assignedOrders: string[];
  pickingTasks: Array<{
    taskId: string;
    orderId: string;
    productId: string;
    location: string;
    quantity: number;
    sequenceNumber: number;
  }>;
}

export interface WavePickingMetrics {
  totalWaves: number;
  activeWaves: number;
  completedWaves: number;
  totalOrders: number;
  totalLines: number;
  totalUnits: number;
  averagePicksPerHour: number;
  averageAccuracy: number;
  averageWaveTime: number; // minutes
  topPickers: Array<{
    pickerId: string;
    pickerName: string;
    totalPicks: number;
    accuracy: number;
    avgPicksPerHour: number;
  }>;
  recentWaves: Array<{
    id: string;
    waveNumber: string;
    status: WaveStatus;
    orderCount: number;
    startedAt?: Date;
    completedAt?: Date;
  }>;
}

export interface OptimizedRoute {
  pickerId: string;
  totalDistance: number; // meters
  totalTime: number; // minutes
  pickSequence: Array<{
    sequenceNumber: number;
    location: string;
    productId: string;
    productName: string;
    quantity: number;
    orderId: string;
    coordinates?: { x: number; y: number; z: number };
  }>;
}

/**
 * Wave Picking Service Class
 */
export class WavePickingService {
  /**
   * Generate unique wave number
   */
  private async generateWaveNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastWave = await prisma.wave.findFirst({
      where: {
        organizationId,
        waveNumber: {
          startsWith: `WAVE-${dateStr}`,
        },
      },
      orderBy: {
        waveNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastWave) {
      const lastSequence = parseInt(lastWave.waveNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `WAVE-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Create wave from eligible orders
   */
  async createWave(
    organizationId: string,
    userId: string,
    request: CreateWaveRequest
  ): Promise<any> {
    // Get eligible sales orders
    const eligibleOrders = await this.getEligibleOrders(organizationId, request);

    if (eligibleOrders.length === 0) {
      throw new Error('No eligible orders found for wave creation');
    }

    // Generate wave number
    const waveNumber = await this.generateWaveNumber(organizationId);

    // Calculate wave statistics
    const totalOrders = eligibleOrders.length;
    const totalLines = eligibleOrders.reduce(
      (sum, order) => sum + order.items.length,
      0
    );
    const totalUnits = eligibleOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s: number, item: any) => s + item.quantity, 0),
      0
    );

    // Create wave
    const wave = await prisma.wave.create({
      data: {
        organizationId,
        waveNumber,
        name: request.name || `Wave ${waveNumber}`,
        status: 'PENDING',
        strategy: request.strategy,
        totalOrders,
        totalLines,
        totalUnits,
        maxOrdersPerWave: request.maxOrdersPerWave,
        maxLinesPerPicker: request.maxLinesPerPicker,
        priorityThreshold: request.priorityThreshold,
        includeBackorders: request.includeBackorders || false,
        scheduledStartTime: request.scheduledStartTime,
        notes: request.notes,
        createdById: userId,
      },
    });

    // Associate orders with wave
    await prisma.salesOrder.updateMany({
      where: {
        id: { in: eligibleOrders.map((o) => o.id) },
      },
      data: {
        waveId: wave.id,
        status: 'IN_WAVE',
      },
    });

    // Generate picking tasks
    await this.generatePickingTasks(wave.id, eligibleOrders, request.strategy);

    return await prisma.wave.findUnique({
      where: { id: wave.id },
      include: {
        orders: {
          include: {
            items: true,
            customer: true,
          },
        },
        pickingTasks: true,
      },
    });
  }

  /**
   * Get eligible orders for wave
   */
  private async getEligibleOrders(
    organizationId: string,
    request: CreateWaveRequest
  ): Promise<any[]> {
    const where: any = {
      organizationId,
      status: 'RELEASED',
      waveId: null,
    };

    // Apply filters
    if (!request.includeBackorders) {
      // Only include orders with sufficient inventory
      where.items = {
        every: {
          quantity: {
            lte: prisma.product.fields.availableQuantity,
          },
        },
      };
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                locations: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: [
        { priority: 'desc' },
        { promisedDate: 'asc' },
        { createdAt: 'asc' },
      ],
      take: request.maxOrdersPerWave || 100,
    });

    return orders;
  }

  /**
   * Generate picking tasks for wave
   */
  private async generatePickingTasks(
    waveId: string,
    orders: any[],
    strategy: PickingStrategy
  ): Promise<void> {
    const tasks: any[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        // Find best location for picking
        const location = await this.findBestPickLocation(
          item.productId,
          item.quantity,
          strategy
        );

        if (location) {
          tasks.push({
            waveId,
            salesOrderId: order.id,
            salesOrderItemId: item.id,
            productId: item.productId,
            locationId: location.id,
            quantityToPick: item.quantity,
            status: 'PENDING',
            priority: order.priority || 5,
          });
        }
      }
    }

    // Batch create tasks
    await prisma.pickingTask.createMany({
      data: tasks,
    });
  }

  /**
   * Find best location for picking
   */
  private async findBestPickLocation(
    productId: string,
    quantity: number,
    strategy: PickingStrategy
  ): Promise<any | null> {
    const locations = await prisma.inventoryLocation.findMany({
      where: {
        productId,
        quantity: { gte: quantity },
        location: {
          isActive: true,
          isPickable: true,
        },
      },
      include: {
        location: true,
      },
      orderBy:
        strategy === 'FIFO'
          ? { receivedDate: 'asc' }
          : strategy === 'LIFO'
          ? { receivedDate: 'desc' }
          : { location: { sequenceNumber: 'asc' } }, // Zone-based
    });

    return locations[0]?.location || null;
  }

  /**
   * Optimize wave picking routes
   */
  async optimizeWave(
    waveId: string,
    organizationId: string,
    criteria: WaveOptimizationCriteria
  ): Promise<any> {
    const wave = await prisma.wave.findFirst({
      where: {
        id: waveId,
        organizationId,
      },
      include: {
        pickingTasks: {
          include: {
            product: true,
            location: true,
            salesOrder: true,
          },
        },
      },
    });

    if (!wave) {
      throw new Error('Wave not found');
    }

    // Group tasks by picker assignment strategy
    const assignments = await this.assignTasks(wave.pickingTasks, criteria);

    // Update tasks with assignments
    for (const assignment of assignments) {
      const taskIds = assignment.pickingTasks.map((t) => t.taskId);

      await prisma.pickingTask.updateMany({
        where: { id: { in: taskIds } },
        data: {
          assignedToId: assignment.pickerId,
          sequenceNumber: 0, // Would set actual sequence
        },
      });
    }

    // Update wave status
    await prisma.wave.update({
      where: { id: waveId },
      data: {
        status: 'OPTIMIZED',
      },
    });

    return {
      waveId,
      assignments,
    };
  }

  /**
   * Assign tasks to pickers
   */
  private async assignTasks(
    tasks: any[],
    criteria: WaveOptimizationCriteria
  ): Promise<PickerAssignment[]> {
    // Get available pickers
    const pickers = await prisma.user.findMany({
      where: {
        role: 'PICKER',
        isActive: true,
      },
    });

    if (pickers.length === 0) {
      throw new Error('No pickers available');
    }

    // Sort tasks by priority and location
    const sortedTasks = [...tasks].sort((a, b) => {
      if (criteria.prioritizeUrgent && a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      if (criteria.groupByZone && a.location?.zoneId !== b.location?.zoneId) {
        return (a.location?.zoneId || '').localeCompare(b.location?.zoneId || '');
      }
      return (a.location?.name || '').localeCompare(b.location?.name || '');
    });

    // Distribute tasks across pickers
    const assignments: PickerAssignment[] = [];
    const tasksPerPicker = Math.ceil(sortedTasks.length / pickers.length);

    for (let i = 0; i < pickers.length; i++) {
      const picker = pickers[i];
      const pickerTasks = sortedTasks.slice(
        i * tasksPerPicker,
        (i + 1) * tasksPerPicker
      );

      if (pickerTasks.length === 0) continue;

      const totalLines = pickerTasks.length;
      const totalUnits = pickerTasks.reduce((sum, t) => sum + t.quantityToPick, 0);
      const estimatedTime = Math.ceil(totalUnits * 0.5); // 30 seconds per unit

      assignments.push({
        pickerId: picker.id,
        pickerName: picker.name,
        totalLines,
        totalUnits,
        estimatedTime,
        efficiency: 85, // Placeholder
        assignedOrders: [...new Set(pickerTasks.map((t) => t.salesOrderId))],
        pickingTasks: pickerTasks.map((t, idx) => ({
          taskId: t.id,
          orderId: t.salesOrderId,
          productId: t.productId,
          location: t.location?.name || '',
          quantity: t.quantityToPick,
          sequenceNumber: idx + 1,
        })),
      });
    }

    return assignments;
  }

  /**
   * Start wave
   */
  async startWave(
    waveId: string,
    organizationId: string,
    userId: string
  ): Promise<any> {
    const wave = await prisma.wave.findFirst({
      where: {
        id: waveId,
        organizationId,
      },
    });

    if (!wave) {
      throw new Error('Wave not found');
    }

    if (wave.status !== 'PENDING' && wave.status !== 'OPTIMIZED') {
      throw new Error('Wave must be pending or optimized to start');
    }

    return await prisma.wave.update({
      where: { id: waveId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        startedById: userId,
      },
      include: {
        orders: true,
        pickingTasks: true,
      },
    });
  }

  /**
   * Complete picking task
   */
  async completePickingTask(
    taskId: string,
    organizationId: string,
    userId: string,
    data: {
      quantityPicked: number;
      locationId: string;
      batchNumber?: string;
      serialNumber?: string;
      notes?: string;
    }
  ): Promise<any> {
    const task = await prisma.pickingTask.findFirst({
      where: {
        id: taskId,
        wave: {
          organizationId,
        },
      },
      include: {
        wave: true,
        salesOrder: true,
      },
    });

    if (!task) {
      throw new Error('Picking task not found');
    }

    // Update task
    const updatedTask = await prisma.pickingTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        quantityPicked: data.quantityPicked,
        pickedAt: new Date(),
        pickedById: userId,
        notes: data.notes,
      },
    });

    // Update inventory
    await prisma.inventoryLocation.updateMany({
      where: {
        locationId: data.locationId,
        productId: task.productId,
      },
      data: {
        quantity: {
          decrement: data.quantityPicked,
        },
      },
    });

    // Check if wave is complete
    await this.checkWaveCompletion(task.waveId);

    return updatedTask;
  }

  /**
   * Check if wave is complete
   */
  private async checkWaveCompletion(waveId: string): Promise<void> {
    const incompleteTasks = await prisma.pickingTask.count({
      where: {
        waveId,
        status: { not: 'COMPLETED' },
      },
    });

    if (incompleteTasks === 0) {
      await prisma.wave.update({
        where: { id: waveId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update orders to PICKED
      await prisma.salesOrder.updateMany({
        where: { waveId },
        data: { status: 'PICKED' },
      });
    }
  }

  /**
   * Calculate optimal route for picker
   */
  async calculatePickingRoute(
    waveId: string,
    pickerId: string,
    organizationId: string
  ): Promise<OptimizedRoute> {
    const tasks = await prisma.pickingTask.findMany({
      where: {
        waveId,
        assignedToId: pickerId,
        status: 'PENDING',
        wave: {
          organizationId,
        },
      },
      include: {
        product: true,
        location: true,
        salesOrder: true,
      },
      orderBy: [{ priority: 'desc' }, { sequenceNumber: 'asc' }],
    });

    // Simple route optimization (would use more sophisticated algorithm)
    const sortedTasks = [...tasks].sort((a, b) => {
      const locA = a.location?.name || '';
      const locB = b.location?.name || '';
      return locA.localeCompare(locB);
    });

    const totalDistance = sortedTasks.length * 15; // Assume 15m between locations
    const totalTime = sortedTasks.length * 2; // 2 minutes per pick

    return {
      pickerId,
      totalDistance,
      totalTime,
      pickSequence: sortedTasks.map((task, idx) => ({
        sequenceNumber: idx + 1,
        location: task.location?.name || '',
        productId: task.productId,
        productName: task.product?.name || '',
        quantity: task.quantityToPick,
        orderId: task.salesOrderId,
      })),
    };
  }

  /**
   * Get wave picking metrics
   */
  async getWavePickingMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WavePickingMetrics> {
    const dateFilter: any = { organizationId };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Total waves
    const totalWaves = await prisma.wave.count({ where: dateFilter });

    const activeWaves = await prisma.wave.count({
      where: { ...dateFilter, status: 'IN_PROGRESS' },
    });

    const completedWaves = await prisma.wave.count({
      where: { ...dateFilter, status: 'COMPLETED' },
    });

    // Aggregate statistics
    const waves = await prisma.wave.findMany({
      where: dateFilter,
      include: {
        orders: true,
        pickingTasks: true,
      },
    });

    const totalOrders = waves.reduce((sum, w) => sum + (w.totalOrders || 0), 0);
    const totalLines = waves.reduce((sum, w) => sum + (w.totalLines || 0), 0);
    const totalUnits = waves.reduce((sum, w) => sum + (w.totalUnits || 0), 0);

    // Calculate average picks per hour
    const completedWithTime = waves.filter(
      (w) => w.startedAt && w.completedAt
    );
    const totalHours = completedWithTime.reduce((sum, w) => {
      const start = w.startedAt!.getTime();
      const end = w.completedAt!.getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);

    const averagePicksPerHour =
      totalHours > 0 ? Math.round(totalUnits / totalHours) : 0;

    // Average wave time
    const averageWaveTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, w) => {
            const start = w.startedAt!.getTime();
            const end = w.completedAt!.getTime();
            return sum + (end - start) / (1000 * 60);
          }, 0) / completedWithTime.length
        : 0;

    // Top pickers
    const pickerStats = await prisma.pickingTask.groupBy({
      by: ['pickedById'],
      where: {
        status: 'COMPLETED',
        wave: dateFilter,
      },
      _count: { id: true },
      _sum: { quantityPicked: true },
    });

    const topPickers = await Promise.all(
      pickerStats.slice(0, 5).map(async (stat) => {
        if (!stat.pickedById) return null;

        const picker = await prisma.user.findUnique({
          where: { id: stat.pickedById },
        });

        return {
          pickerId: stat.pickedById,
          pickerName: picker?.name || 'Unknown',
          totalPicks: stat._count.id,
          accuracy: 98, // Placeholder
          avgPicksPerHour: 45, // Placeholder
        };
      })
    );

    // Recent waves
    const recentWaves = await prisma.wave.findMany({
      where: dateFilter,
      select: {
        id: true,
        waveNumber: true,
        status: true,
        totalOrders: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalWaves,
      activeWaves,
      completedWaves,
      totalOrders,
      totalLines,
      totalUnits,
      averagePicksPerHour,
      averageAccuracy: 98, // Placeholder
      averageWaveTime,
      topPickers: topPickers.filter((p) => p !== null) as any,
      recentWaves: recentWaves.map((w) => ({
        ...w,
        orderCount: w.totalOrders || 0,
      })),
    };
  }

  /**
   * Get wave by ID
   */
  async getWaveById(waveId: string, organizationId: string): Promise<any> {
    return await prisma.wave.findFirst({
      where: {
        id: waveId,
        organizationId,
      },
      include: {
        orders: {
          include: {
            customer: true,
            items: true,
          },
        },
        pickingTasks: {
          include: {
            product: true,
            location: true,
            assignedTo: true,
            pickedBy: true,
          },
        },
        createdBy: true,
        startedBy: true,
      },
    });
  }

  /**
   * List waves with filters
   */
  async listWaves(
    organizationId: string,
    filters: {
      status?: WaveStatus;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ waves: any[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { waveNumber: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, waves] = await Promise.all([
      prisma.wave.count({ where }),
      prisma.wave.findMany({
        where,
        include: {
          orders: true,
          pickingTasks: {
            where: { status: { not: 'COMPLETED' } },
          },
          createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      waves,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel wave
   */
  async cancelWave(
    waveId: string,
    organizationId: string,
    reason: string
  ): Promise<any> {
    const wave = await prisma.wave.findFirst({
      where: {
        id: waveId,
        organizationId,
      },
    });

    if (!wave) {
      throw new Error('Wave not found');
    }

    if (wave.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed wave');
    }

    // Update wave
    await prisma.wave.update({
      where: { id: waveId },
      data: {
        status: 'CANCELLED',
        notes: `Cancelled: ${reason}`,
      },
    });

    // Release orders
    await prisma.salesOrder.updateMany({
      where: { waveId },
      data: {
        waveId: null,
        status: 'RELEASED',
      },
    });

    // Delete pending picking tasks
    await prisma.pickingTask.deleteMany({
      where: {
        waveId,
        status: 'PENDING',
      },
    });

    return wave;
  }
}

export default WavePickingService;
