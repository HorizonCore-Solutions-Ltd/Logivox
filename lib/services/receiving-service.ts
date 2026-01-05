/**
 * Receiving Service
 * Comprehensive inbound operations management
 * Handles PO receiving, GRN processing, quality control integration,
 * discrepancy management, and inventory updates
 */

import { PrismaClient, GRNStatus, POStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateGRNRequest {
  purchaseOrderId: string;
  warehouseId?: string;
  receivingDock?: string;
  notes?: string;
  internalNotes?: string;
  items: CreateGRNItemRequest[];
}

export interface CreateGRNItemRequest {
  purchaseOrderItemId?: string;
  inventoryItemId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity?: number;
  unitCost: number;
  binLocation?: string;
  batchNumber?: string;
  expiryDate?: Date;
  serialNumbers?: string[];
  notes?: string;
}

export interface ReceivingMetrics {
  totalGRNs: number;
  totalValue: number;
  averageProcessingTime: number; // minutes
  accuracyRate: number; // percentage
  discrepancyRate: number; // percentage
  onTimeDeliveryRate: number; // percentage
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalOrders: number;
    totalValue: number;
    accuracyRate: number;
  }>;
  recentGRNs: Array<{
    id: string;
    grnNumber: string;
    status: GRNStatus;
    receivedDate: Date;
    totalValue: number;
  }>;
}

export interface DiscrepancyReport {
  grnId: string;
  grnNumber: string;
  purchaseOrderNumber: string;
  supplierName: string;
  discrepancies: Array<{
    type: 'QUANTITY_SHORT' | 'QUANTITY_OVER' | 'QUALITY_ISSUE' | 'WRONG_ITEM' | 'DAMAGED';
    itemSku: string;
    itemName: string;
    expected: number;
    received: number;
    variance: number;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  totalImpact: number;
  recommendations: string[];
}

export interface PutAwayTask {
  id: string;
  grnItemId: string;
  inventoryItemId: string;
  sku: string;
  quantity: number;
  fromLocation: string; // Receiving dock
  toLocation: string; // Target bin
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedTime: number; // minutes
  assignedTo?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * Receiving Service Class
 */
export class ReceivingService {
  /**
   * Generate unique GRN number
   */
  private async generateGRNNumber(organizationId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const lastGRN = await prisma.goodsReceiptNote.findFirst({
      where: {
        organizationId,
        grnNumber: {
          startsWith: `GRN-${dateStr}`,
        },
      },
      orderBy: {
        grnNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastGRN) {
      const lastSequence = parseInt(lastGRN.grnNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `GRN-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Create Goods Receipt Note
   */
  async createGRN(
    organizationId: string,
    userId: string,
    request: CreateGRNRequest
  ): Promise<any> {
    // Validate purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id: request.purchaseOrderId,
        organizationId,
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    if (purchaseOrder.status === 'CANCELLED' || purchaseOrder.status === 'CLOSED') {
      throw new Error(`Cannot receive against ${purchaseOrder.status} purchase order`);
    }

    // Generate GRN number
    const grnNumber = await this.generateGRNNumber(organizationId);

    // Calculate totals and check for discrepancies
    let totalReceived = 0;
    let hasDiscrepancy = false;
    let discrepancyNotes: string[] = [];

    for (const item of request.items) {
      totalReceived += item.receivedQuantity * item.unitCost;

      // Check quantity discrepancy
      if (item.receivedQuantity !== item.orderedQuantity) {
        hasDiscrepancy = true;
        discrepancyNotes.push(
          `${item.inventoryItemId}: Expected ${item.orderedQuantity}, received ${item.receivedQuantity}`
        );
      }

      // Check quality discrepancy
      if (item.rejectedQuantity && item.rejectedQuantity > 0) {
        hasDiscrepancy = true;
        discrepancyNotes.push(
          `${item.inventoryItemId}: ${item.rejectedQuantity} units rejected`
        );
      }
    }

    // Create GRN with items
    const grn = await prisma.goodsReceiptNote.create({
      data: {
        organizationId,
        purchaseOrderId: request.purchaseOrderId,
        warehouseId: request.warehouseId,
        grnNumber,
        status: 'PENDING',
        receivedById: userId,
        receivingDock: request.receivingDock,
        hasDiscrepancy,
        discrepancyNotes: hasDiscrepancy ? discrepancyNotes.join('; ') : null,
        totalReceived,
        notes: request.notes,
        internalNotes: request.internalNotes,
        items: {
          create: request.items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            inventoryItemId: item.inventoryItemId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            rejectedQuantity: item.rejectedQuantity || 0,
            unitCost: item.unitCost,
            binLocation: item.binLocation,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            serialNumbers: item.serialNumbers ? JSON.stringify(item.serialNumbers) : null,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        receivedBy: true,
      },
    });

    // Update purchase order status
    await this.updatePurchaseOrderStatus(request.purchaseOrderId);

    // Trigger QC if required
    if (hasDiscrepancy || purchaseOrder.supplier?.requiresQC) {
      await this.triggerQualityControl(grn.id, organizationId);
    }

    return grn;
  }

  /**
   * Update purchase order status based on received quantities
   */
  private async updatePurchaseOrderStatus(purchaseOrderId: string): Promise<void> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: true,
      },
    });

    if (!po) return;

    let allFullyReceived = true;
    let anyPartiallyReceived = false;

    for (const item of po.items) {
      if (item.quantityReceived < item.quantityOrdered) {
        allFullyReceived = false;
      }
      if (item.quantityReceived > 0) {
        anyPartiallyReceived = true;
      }
    }

    let newStatus: POStatus = po.status;

    if (allFullyReceived) {
      newStatus = 'RECEIVED';
    } else if (anyPartiallyReceived) {
      newStatus = 'PARTIALLY_RECEIVED';
    }

    if (newStatus !== po.status) {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: newStatus },
      });
    }
  }

  /**
   * Trigger quality control inspection
   */
  private async triggerQualityControl(grnId: string, organizationId: string): Promise<void> {
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: true,
      },
    });

    if (!grn) return;

    // Update GRN status
    await prisma.goodsReceiptNote.update({
      where: { id: grnId },
      data: { status: 'QUALITY_CHECK' },
    });

    // Create QC inspection record
    // This would integrate with QC module
    // For now, we set the status and let QC module handle it
  }

  /**
   * Complete GRN and update inventory
   */
  async completeGRN(
    grnId: string,
    organizationId: string,
    userId: string
  ): Promise<any> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: grnId,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
            purchaseOrderItem: true,
          },
        },
        purchaseOrder: true,
      },
    });

    if (!grn) {
      throw new Error('GRN not found');
    }

    if (grn.status === 'COMPLETED') {
      throw new Error('GRN already completed');
    }

    // Update inventory for each item
    for (const item of grn.items) {
      // Update inventory quantity
      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          quantityOnHand: {
            increment: item.acceptedQuantity,
          },
          quantityAvailable: {
            increment: item.acceptedQuantity,
          },
        },
      });

      // Update PO item received quantity
      if (item.purchaseOrderItemId) {
        await prisma.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: {
            quantityReceived: {
              increment: item.acceptedQuantity,
            },
          },
        });
      }

      // Create lot if batch number provided
      if (item.batchNumber) {
        await prisma.lot.create({
          data: {
            organizationId,
            lotNumber: item.batchNumber,
            inventoryItemId: item.inventoryItemId,
            quantity: item.acceptedQuantity,
            expiryDate: item.expiryDate,
            receivedDate: grn.receivedDate,
            goodsReceiptNoteId: grn.id,
            purchaseOrderId: grn.purchaseOrderId,
          },
        });
      }

      // Create serial number records if provided
      if (item.serialNumbers) {
        const serialNumbers = JSON.parse(item.serialNumbers as string);
        for (const serial of serialNumbers) {
          await prisma.serialNumber.create({
            data: {
              organizationId,
              serialNumber: serial,
              inventoryItemId: item.inventoryItemId,
              status: 'AVAILABLE',
              receivedDate: grn.receivedDate,
              goodsReceiptNoteId: grn.id,
              purchaseOrderId: grn.purchaseOrderId,
            },
          });
        }
      }

      // Mark item as put away if location assigned
      if (item.binLocation) {
        await prisma.gRNItem.update({
          where: { id: item.id },
          data: { putAwayCompleted: true },
        });
      }
    }

    // Update GRN status
    const updatedGRN = await prisma.goodsReceiptNote.update({
      where: { id: grnId },
      data: {
        status: 'COMPLETED',
        putAwayCompleted: true,
        putAwayDate: new Date(),
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        purchaseOrder: true,
      },
    });

    // Update purchase order status
    await this.updatePurchaseOrderStatus(grn.purchaseOrderId);

    return updatedGRN;
  }

  /**
   * Record quality control results
   */
  async recordQCResults(
    grnId: string,
    organizationId: string,
    userId: string,
    results: {
      qcStatus: 'PASS' | 'FAIL';
      qcNotes?: string;
      items: Array<{
        grnItemId: string;
        qcStatus: 'PASS' | 'FAIL';
        acceptedQuantity: number;
        rejectedQuantity: number;
        hasDefects: boolean;
        defectDescription?: string;
      }>;
    }
  ): Promise<any> {
    // Update GRN
    await prisma.goodsReceiptNote.update({
      where: { id: grnId },
      data: {
        qcStatus: results.qcStatus,
        qcNotes: results.qcNotes,
        qcById: userId,
        qcDate: new Date(),
        status: results.qcStatus === 'PASS' ? 'APPROVED' : 'REJECTED',
      },
    });

    // Update items
    for (const item of results.items) {
      await prisma.gRNItem.update({
        where: { id: item.grnItemId },
        data: {
          qcStatus: item.qcStatus,
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          hasDefects: item.hasDefects,
          defectDescription: item.defectDescription,
        },
      });
    }

    // If approved, complete the GRN
    if (results.qcStatus === 'PASS') {
      return await this.completeGRN(grnId, organizationId, userId);
    }

    return await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: true,
      },
    });
  }

  /**
   * Get receiving metrics and analytics
   */
  async getReceivingMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReceivingMetrics> {
    const dateFilter: any = {
      organizationId,
    };

    if (startDate || endDate) {
      dateFilter.receivedDate = {};
      if (startDate) dateFilter.receivedDate.gte = startDate;
      if (endDate) dateFilter.receivedDate.lte = endDate;
    }

    // Total GRNs
    const totalGRNs = await prisma.goodsReceiptNote.count({
      where: dateFilter,
    });

    // Total value
    const grns = await prisma.goodsReceiptNote.findMany({
      where: dateFilter,
      select: {
        totalReceived: true,
      },
    });

    const totalValue = grns.reduce(
      (sum, grn) => sum + (grn.totalReceived?.toNumber() || 0),
      0
    );

    // Discrepancy rate
    const grnsWithDiscrepancy = await prisma.goodsReceiptNote.count({
      where: {
        ...dateFilter,
        hasDiscrepancy: true,
      },
    });

    const discrepancyRate = totalGRNs > 0 ? (grnsWithDiscrepancy / totalGRNs) * 100 : 0;

    // Accuracy rate
    const accuracyRate = 100 - discrepancyRate;

    // Recent GRNs
    const recentGRNs = await prisma.goodsReceiptNote.findMany({
      where: dateFilter,
      select: {
        id: true,
        grnNumber: true,
        status: true,
        receivedDate: true,
        totalReceived: true,
      },
      orderBy: {
        receivedDate: 'desc',
      },
      take: 10,
    });

    // Top suppliers
    const supplierStats = await prisma.goodsReceiptNote.groupBy({
      by: ['purchaseOrderId'],
      where: dateFilter,
      _count: true,
      _sum: {
        totalReceived: true,
      },
    });

    // Get supplier details
    const topSuppliers = await Promise.all(
      supplierStats.slice(0, 5).map(async (stat) => {
        const po = await prisma.purchaseOrder.findUnique({
          where: { id: stat.purchaseOrderId },
          include: { supplier: true },
        });

        return {
          supplierId: po?.supplier?.id || '',
          supplierName: po?.supplier?.name || '',
          totalOrders: stat._count,
          totalValue: stat._sum.totalReceived?.toNumber() || 0,
          accuracyRate: 95, // Placeholder - would calculate from actual data
        };
      })
    );

    return {
      totalGRNs,
      totalValue,
      averageProcessingTime: 25, // Placeholder - would calculate from timestamps
      accuracyRate,
      discrepancyRate,
      onTimeDeliveryRate: 92, // Placeholder - would compare expected vs actual dates
      topSuppliers,
      recentGRNs: recentGRNs.map((grn) => ({
        ...grn,
        totalValue: grn.totalReceived?.toNumber() || 0,
      })),
    };
  }

  /**
   * Generate discrepancy report
   */
  async generateDiscrepancyReport(
    grnId: string,
    organizationId: string
  ): Promise<DiscrepancyReport> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: grnId,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!grn) {
      throw new Error('GRN not found');
    }

    const discrepancies: DiscrepancyReport['discrepancies'] = [];
    let totalImpact = 0;

    for (const item of grn.items) {
      // Quantity discrepancies
      if (item.receivedQuantity !== item.orderedQuantity) {
        const variance = item.receivedQuantity - item.orderedQuantity;
        const impact = Math.abs(variance) * item.unitCost.toNumber();
        totalImpact += impact;

        discrepancies.push({
          type: variance < 0 ? 'QUANTITY_SHORT' : 'QUANTITY_OVER',
          itemSku: item.inventoryItem.sku,
          itemName: item.inventoryItem.name,
          expected: item.orderedQuantity,
          received: item.receivedQuantity,
          variance,
          description: `${variance < 0 ? 'Short' : 'Over'} shipment of ${Math.abs(
            variance
          )} units`,
          severity: Math.abs(variance) > 10 ? 'HIGH' : 'MEDIUM',
        });
      }

      // Quality issues
      if (item.hasDefects || item.rejectedQuantity > 0) {
        const impact = item.rejectedQuantity * item.unitCost.toNumber();
        totalImpact += impact;

        discrepancies.push({
          type: 'QUALITY_ISSUE',
          itemSku: item.inventoryItem.sku,
          itemName: item.inventoryItem.name,
          expected: item.receivedQuantity,
          received: item.acceptedQuantity,
          variance: item.rejectedQuantity,
          description: item.defectDescription || 'Quality issues detected',
          severity: item.rejectedQuantity > 5 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (totalImpact > 1000) {
      recommendations.push('High value discrepancy - initiate supplier discussion');
    }
    if (discrepancies.some((d) => d.type === 'QUALITY_ISSUE')) {
      recommendations.push('Quality issues detected - review supplier quality standards');
    }
    if (discrepancies.some((d) => d.type === 'QUANTITY_SHORT')) {
      recommendations.push('Short shipment - request credit or additional delivery');
    }

    return {
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      purchaseOrderNumber: grn.purchaseOrder.poNumber,
      supplierName: grn.purchaseOrder.supplier?.name || 'Unknown',
      discrepancies,
      totalImpact,
      recommendations,
    };
  }

  /**
   * Generate put-away tasks
   */
  async generatePutAwayTasks(
    grnId: string,
    organizationId: string
  ): Promise<PutAwayTask[]> {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: grnId,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!grn) {
      throw new Error('GRN not found');
    }

    const tasks: PutAwayTask[] = [];

    for (const item of grn.items) {
      if (!item.binLocation || item.putAwayCompleted) {
        continue;
      }

      tasks.push({
        id: `PUT-${item.id}`,
        grnItemId: item.id,
        inventoryItemId: item.inventoryItemId,
        sku: item.inventoryItem.sku,
        quantity: item.acceptedQuantity,
        fromLocation: grn.receivingDock || 'RECEIVING',
        toLocation: item.binLocation,
        priority: this.calculatePutAwayPriority(item),
        estimatedTime: this.estimatePutAwayTime(item.acceptedQuantity),
        status: 'PENDING',
      });
    }

    return tasks;
  }

  /**
   * Calculate put-away priority
   */
  private calculatePutAwayPriority(
    item: any
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    // Perishable items = URGENT
    if (item.expiryDate) {
      const daysToExpiry = Math.floor(
        (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysToExpiry < 30) return 'URGENT';
    }

    // High value items = HIGH
    if (item.unitCost.toNumber() > 100) {
      return 'HIGH';
    }

    // Large quantities = MEDIUM
    if (item.acceptedQuantity > 100) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Estimate put-away time
   */
  private estimatePutAwayTime(quantity: number): number {
    // Base time: 5 minutes
    // Additional: 1 minute per 10 units
    return 5 + Math.ceil(quantity / 10);
  }

  /**
   * Get GRN by ID
   */
  async getGRNById(grnId: string, organizationId: string): Promise<any> {
    return await prisma.goodsReceiptNote.findFirst({
      where: {
        id: grnId,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
            purchaseOrderItem: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        receivedBy: true,
        qcBy: true,
      },
    });
  }

  /**
   * List GRNs with filters
   */
  async listGRNs(
    organizationId: string,
    filters: {
      status?: GRNStatus;
      purchaseOrderId?: string;
      warehouseId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ grns: any[]; total: number; page: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.purchaseOrderId) where.purchaseOrderId = filters.purchaseOrderId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;

    if (filters.startDate || filters.endDate) {
      where.receivedDate = {};
      if (filters.startDate) where.receivedDate.gte = filters.startDate;
      if (filters.endDate) where.receivedDate.lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { grnNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          purchaseOrder: {
            poNumber: { contains: filters.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, grns] = await Promise.all([
      prisma.goodsReceiptNote.count({ where }),
      prisma.goodsReceiptNote.findMany({
        where,
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
          warehouse: true,
          receivedBy: true,
          items: true,
        },
        orderBy: { receivedDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      grns,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

export default ReceivingService;
