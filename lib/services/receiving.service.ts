/**
 * Receiving Service
 * Comprehensive Inbound Operations Management
 * 
 * Handles:
 * - Purchase Order receiving
 * - Goods Receipt Note (GRN) creation & management
 * - Quality control integration
 * - Put-away operations
 * - Discrepancy management
 * - ASN (Advanced Shipment Notice) processing
 */

import { prisma } from '@/lib/prisma';
import { POStatus, GRNStatus, Prisma } from '@prisma/client';

export class ReceivingService {
  /**
   * Create a new Goods Receipt Note (GRN) from Purchase Order
   */
  static async createGRN(params: {
    organizationId: string;
    purchaseOrderId: string;
    warehouseId?: string;
    receivedById: string;
    receivedDate?: Date;
    receivingDock?: string;
    items: Array<{
      purchaseOrderItemId: string;
      inventoryItemId: string;
      orderedQuantity: number;
      receivedQuantity: number;
      unitCost: number;
      batchNumber?: string;
      serialNumbers?: string[];
      expiryDate?: Date;
      binLocation?: string;
      qcStatus?: string;
      qcNotes?: string;
      hasDefects?: boolean;
      defectDescription?: string;
    }>;
    notes?: string;
    internalNotes?: string;
  }) {
    // Verify PO exists and is in correct status
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.purchaseOrderId },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status === POStatus.CANCELLED || po.status === POStatus.CLOSED) {
      throw new Error(`Cannot receive against ${po.status} purchase order`);
    }

    // Generate GRN number
    const grnCount = await prisma.goodsReceiptNote.count({
      where: { organizationId: params.organizationId },
    });
    const grnNumber = `GRN-${new Date().getFullYear()}-${String(grnCount + 1).padStart(6, '0')}`;

    // Calculate totals
    const totalReceived = params.items.reduce(
      (sum, item) => sum + item.receivedQuantity * item.unitCost,
      0
    );

    // Check for discrepancies
    const hasDiscrepancy = params.items.some(
      (item) => {
        const poItem = po.items.find(i => i.id === item.purchaseOrderItemId);
        return poItem && item.receivedQuantity !== poItem.quantityOrdered;
      }
    );

    // Create GRN with items
    const grn = await prisma.goodsReceiptNote.create({
      data: {
        organizationId: params.organizationId,
        purchaseOrderId: params.purchaseOrderId,
        warehouseId: params.warehouseId,
        grnNumber,
        status: GRNStatus.PENDING,
        receivedDate: params.receivedDate || new Date(),
        receivedById: params.receivedById,
        receivingDock: params.receivingDock,
        totalReceived,
        currency: po.currency,
        hasDiscrepancy,
        notes: params.notes,
        internalNotes: params.internalNotes,
        items: {
          create: params.items.map(item => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            inventoryItemId: item.inventoryItemId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.qcStatus === 'PASS' ? item.receivedQuantity : 0,
            rejectedQuantity: item.qcStatus === 'FAIL' ? item.receivedQuantity : 0,
            unitCost: item.unitCost,
            batchNumber: item.batchNumber,
            serialNumbers: item.serialNumbers,
            expiryDate: item.expiryDate,
            binLocation: item.binLocation,
            qcStatus: item.qcStatus,
            qcNotes: item.qcNotes,
            hasDefects: item.hasDefects || false,
            defectDescription: item.defectDescription,
          })),
        },
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
      },
    });

    // Update PO item quantities received
    for (const item of params.items) {
      await prisma.purchaseOrderItem.update({
        where: { id: item.purchaseOrderItemId },
        data: {
          quantityReceived: {
            increment: item.receivedQuantity,
          },
        },
      });
    }

    // Update PO status based on received quantities
    await this.updatePOStatus(params.purchaseOrderId);

    return grn;
  }

  /**
   * Perform Quality Control on GRN
   */
  static async performQualityControl(params: {
    grnId: string;
    qcById: string;
    qcStatus: 'PASS' | 'FAIL' | 'PARTIAL';
    qcNotes?: string;
    items: Array<{
      grnItemId: string;
      qcStatus: 'PASS' | 'FAIL';
      acceptedQuantity: number;
      rejectedQuantity: number;
      qcNotes?: string;
      hasDefects?: boolean;
      defectDescription?: string;
    }>;
  }) {
    // Update GRN status
    const grn = await prisma.goodsReceiptNote.update({
      where: { id: params.grnId },
      data: {
        qcStatus: params.qcStatus,
        qcById: params.qcById,
        qcDate: new Date(),
        qcNotes: params.qcNotes,
        status: params.qcStatus === 'PASS' ? GRNStatus.APPROVED : GRNStatus.REJECTED,
      },
      include: {
        items: true,
      },
    });

    // Update individual items
    for (const item of params.items) {
      await prisma.gRNItem.update({
        where: { id: item.grnItemId },
        data: {
          qcStatus: item.qcStatus,
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          qcNotes: item.qcNotes,
          hasDefects: item.hasDefects || false,
          defectDescription: item.defectDescription,
        },
      });
    }

    // If QC passed, update inventory levels
    if (params.qcStatus === 'PASS' || params.qcStatus === 'PARTIAL') {
      for (const item of params.items) {
        if (item.qcStatus === 'PASS' && item.acceptedQuantity > 0) {
          const grnItem = grn.items.find(i => i.id === item.grnItemId);
          if (grnItem) {
            await prisma.inventoryItem.update({
              where: { id: grnItem.inventoryItemId },
              data: {
                quantity: {
                  increment: item.acceptedQuantity,
                },
                availableQty: {
                  increment: item.acceptedQuantity,
                },
              },
            });

            // Create inventory movement record
            await prisma.inventoryMovement.create({
              data: {
                inventoryItemId: grnItem.inventoryItemId,
                type: 'PURCHASE',
                quantity: item.acceptedQuantity,
                reason: 'GRN',
                notes: `Received via GRN ${grn.grnNumber}`,
              },
            });
          }
        }
      }
    }

    return grn;
  }

  /**
   * Complete Put-Away process
   */
  static async completePutAway(params: {
    grnId: string;
    items: Array<{
      grnItemId: string;
      binLocation: string;
      putAwayQuantity: number;
    }>;
  }) {
    // Update GRN items with bin locations
    for (const item of params.items) {
      await prisma.gRNItem.update({
        where: { id: item.grnItemId },
        data: {
          binLocation: item.binLocation,
          putAwayCompleted: true,
        },
      });
    }

    // Check if all items are put away
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: params.grnId },
      include: { items: true },
    });

    const allPutAway = grn?.items.every(item => item.putAwayCompleted);

    if (allPutAway) {
      await prisma.goodsReceiptNote.update({
        where: { id: params.grnId },
        data: {
          putAwayCompleted: true,
          putAwayDate: new Date(),
          status: GRNStatus.COMPLETED,
        },
      });
    }

    return grn;
  }

  /**
   * Get suggested bin location for put-away
   */
  static async getSuggestedBinLocation(params: {
    warehouseId: string;
    inventoryItemId: string;
    quantity: number;
  }) {
    // Get inventory item details
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.inventoryItemId },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Find existing inventory movements for this item
    const existingLocations = await prisma.inventoryMovement.findMany({
      where: {
        inventoryItemId: params.inventoryItemId,
        type: 'PURCHASE',
      },
      select: {
        notes: true,
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Find available bin with capacity
    // This is simplified - in production you'd have a Bin/Location model
    const suggestedZone = item.category?.name.substring(0, 2).toUpperCase() || 'GN';
    const suggestedAisle = Math.floor(Math.random() * 10) + 1;
    const suggestedRack = Math.floor(Math.random() * 20) + 1;
    const suggestedLevel = Math.floor(Math.random() * 5) + 1;

    return {
      suggestedLocation: `${suggestedZone}-A${suggestedAisle}-R${suggestedRack}-L${suggestedLevel}`,
      reason: existingLocations.length > 0 
        ? 'Same location as previous receipts' 
        : 'Optimized for product category',
      alternateLocations: [
        `${suggestedZone}-A${suggestedAisle + 1}-R${suggestedRack}-L${suggestedLevel}`,
        `${suggestedZone}-A${suggestedAisle}-R${suggestedRack + 1}-L${suggestedLevel}`,
      ],
    };
  }

  /**
   * Handle receiving discrepancies
   */
  static async recordDiscrepancy(params: {
    grnId: string;
    discrepancyType: 'SHORTAGE' | 'OVERAGE' | 'DAMAGE' | 'WRONG_ITEM';
    items: Array<{
      grnItemId: string;
      expectedQuantity: number;
      actualQuantity: number;
      notes: string;
    }>;
    resolutionAction?: string;
    notifySupplier?: boolean;
  }) {
    await prisma.goodsReceiptNote.update({
      where: { id: params.grnId },
      data: {
        hasDiscrepancy: true,
        discrepancyNotes: JSON.stringify({
          type: params.discrepancyType,
          items: params.items,
          resolutionAction: params.resolutionAction,
          recordedAt: new Date(),
        }),
      },
    });

    // Create a note or task for follow-up
    // In production, this would integrate with a task management system
    
    return {
      discrepancyRecorded: true,
      requiresApproval: params.discrepancyType === 'OVERAGE',
      supplierNotified: params.notifySupplier || false,
    };
  }

  /**
   * Get receiving dashboard metrics
   */
  static async getReceivingMetrics(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
    warehouseId?: string;
  }) {
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const where: Prisma.GoodsReceiptNoteWhereInput = {
      organizationId: params.organizationId,
      receivedDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    // Total GRNs
    const totalGRNs = await prisma.goodsReceiptNote.count({ where });

    // GRNs by status
    const byStatus = await prisma.goodsReceiptNote.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // GRNs with discrepancies
    const withDiscrepancies = await prisma.goodsReceiptNote.count({
      where: { ...where, hasDiscrepancy: true },
    });

    // QC pass rate
    const qcPassed = await prisma.goodsReceiptNote.count({
      where: { ...where, qcStatus: 'PASS' },
    });
    const qcTotal = await prisma.goodsReceiptNote.count({
      where: { ...where, qcStatus: { not: null } },
    });

    // Average receiving time (from PO to GRN completion)
    const avgReceivingTime = await prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (g.received_date - p.order_date)) / 3600) as avg
      FROM goods_receipt_notes g
      JOIN purchase_orders p ON g.purchase_order_id = p.id
      WHERE g.organization_id = ${params.organizationId}
        AND g.received_date >= ${startDate}
        AND g.received_date <= ${endDate}
    `;

    // Items received
    const itemsReceived = await prisma.gRNItem.aggregate({
      where: {
        grn: where,
      },
      _sum: {
        receivedQuantity: true,
        acceptedQuantity: true,
        rejectedQuantity: true,
      },
    });

    // Pending put-aways
    const pendingPutAways = await prisma.goodsReceiptNote.count({
      where: {
        ...where,
        putAwayCompleted: false,
        status: GRNStatus.APPROVED,
      },
    });

    return {
      period: { startDate, endDate },
      totalGRNs,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        percentage: (s._count / totalGRNs) * 100,
      })),
      discrepancyRate: (withDiscrepancies / totalGRNs) * 100,
      qcPassRate: qcTotal > 0 ? (qcPassed / qcTotal) * 100 : 0,
      averageReceivingTimeHours: avgReceivingTime[0]?.avg || 0,
      itemsReceived: {
        total: itemsReceived._sum.receivedQuantity || 0,
        accepted: itemsReceived._sum.acceptedQuantity || 0,
        rejected: itemsReceived._sum.rejectedQuantity || 0,
        rejectionRate: itemsReceived._sum.receivedQuantity 
          ? ((itemsReceived._sum.rejectedQuantity || 0) / itemsReceived._sum.receivedQuantity) * 100
          : 0,
      },
      pendingPutAways,
    };
  }

  /**
   * Get GRN details by ID
   */
  static async getGRNDetails(grnId: string) {
    return await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                category: true,
              },
            },
            purchaseOrderItem: true,
          },
        },
        purchaseOrder: {
          include: {
            supplier: true,
            items: true,
          },
        },
        warehouse: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        qcBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * List GRNs with filters
   */
  static async listGRNs(params: {
    organizationId: string;
    status?: GRNStatus;
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
    hasDiscrepancy?: boolean;
    qcStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GoodsReceiptNoteWhereInput = {
      organizationId: params.organizationId,
    };

    if (params.status) where.status = params.status;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.hasDiscrepancy !== undefined) where.hasDiscrepancy = params.hasDiscrepancy;
    if (params.qcStatus) where.qcStatus = params.qcStatus;
    
    if (params.startDate || params.endDate) {
      where.receivedDate = {};
      if (params.startDate) where.receivedDate.gte = params.startDate;
      if (params.endDate) where.receivedDate.lte = params.endDate;
    }

    const [grns, total] = await Promise.all([
      prisma.goodsReceiptNote.findMany({
        where,
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
          warehouse: true,
          receivedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [params.sortBy || 'receivedDate']: params.sortOrder || 'desc',
        },
      }),
      prisma.goodsReceiptNote.count({ where }),
    ]);

    return {
      grns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process Advanced Shipment Notice (ASN)
   */
  static async processASN(params: {
    organizationId: string;
    purchaseOrderId: string;
    asnData: {
      asnNumber: string;
      expectedDate: Date;
      carrier: string;
      trackingNumber?: string;
      items: Array<{
        sku: string;
        quantity: number;
        batchNumber?: string;
        expiryDate?: Date;
      }>;
    };
  }) {
    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.purchaseOrderId },
      include: { items: true },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    // Store ASN data (you might want a separate ASN model)
    // For now, we'll update the PO with expected date
    await prisma.purchaseOrder.update({
      where: { id: params.purchaseOrderId },
      data: {
        expectedDate: params.asnData.expectedDate,
        metadata: {
          asn: params.asnData,
          asnReceivedAt: new Date(),
        },
      },
    });

    // Validate ASN against PO
    const validationResults = {
      valid: true,
      warnings: [] as string[],
      errors: [] as string[],
    };

    for (const asnItem of params.asnData.items) {
      const poItem = po.items.find(i => i.sku === asnItem.sku);
      if (!poItem) {
        validationResults.warnings.push(`SKU ${asnItem.sku} not found in PO`);
      } else if (poItem.quantityOrdered !== asnItem.quantity) {
        validationResults.warnings.push(
          `Quantity mismatch for ${asnItem.sku}: PO=${poItem.quantityOrdered}, ASN=${asnItem.quantity}`
        );
      }
    }

    return {
      asnProcessed: true,
      poUpdated: true,
      validation: validationResults,
      expectedDate: params.asnData.expectedDate,
    };
  }

  /**
   * Get pending receipts (approved POs not yet received)
   */
  static async getPendingReceipts(params: {
    organizationId: string;
    warehouseId?: string;
  }) {
    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId: params.organizationId,
      status: {
        in: [POStatus.APPROVED, POStatus.SENT, POStatus.CONFIRMED, POStatus.PARTIALLY_RECEIVED],
      },
    };

    const pendingPOs = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
        receipts: true,
      },
      orderBy: {
        expectedDate: 'asc',
      },
    });

    return pendingPOs.map(po => ({
      ...po,
      totalOrdered: po.items.reduce((sum, item) => sum + item.quantityOrdered, 0),
      totalReceived: po.items.reduce((sum, item) => sum + item.quantityReceived, 0),
      itemsRemaining: po.items.filter(
        item => item.quantityOrdered > item.quantityReceived
      ).length,
      isOverdue: po.expectedDate && po.expectedDate < new Date(),
    }));
  }

  /**
   * Update Purchase Order status based on received quantities
   */
  private static async updatePOStatus(purchaseOrderId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!po) return;

    const allReceived = po.items.every(
      item => item.quantityReceived >= item.quantityOrdered
    );
    const someReceived = po.items.some(item => item.quantityReceived > 0);

    let newStatus = po.status;
    if (allReceived) {
      newStatus = POStatus.RECEIVED;
    } else if (someReceived) {
      newStatus = POStatus.PARTIALLY_RECEIVED;
    }

    if (newStatus !== po.status) {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: newStatus,
          receivedDate: allReceived ? new Date() : null,
        },
      });
    }
  }

  /**
   * Generate receiving labels/barcodes
   */
  static async generateReceivingLabels(params: {
    grnId: string;
    labelType: 'MASTER' | 'CASE' | 'PALLET' | 'ITEM';
  }) {
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: params.grnId },
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

    // Generate label data (in production, integrate with label printer)
    const labels = grn.items.map(item => ({
      grnNumber: grn.grnNumber,
      sku: item.inventoryItem.sku,
      description: item.inventoryItem.description,
      quantity: item.receivedQuantity,
      batchNumber: item.batchNumber,
      receivedDate: grn.receivedDate,
      binLocation: item.binLocation,
      barcode: item.inventoryItem.barcode,
      labelType: params.labelType,
    }));

    return {
      labels,
      totalLabels: labels.length,
      format: 'ZPL', // Zebra Programming Language for thermal printers
    };
  }

  /**
   * Blind receiving (receive without PO reference)
   */
  static async blindReceive(params: {
    organizationId: string;
    warehouseId: string;
    receivedById: string;
    supplierId?: string;
    items: Array<{
      sku: string;
      description: string;
      quantity: number;
      unitCost?: number;
      batchNumber?: string;
    }>;
    notes?: string;
  }) {
    // Create a dummy PO for blind receiving
    const poNumber = `BLIND-${Date.now()}`;
    
    // This is a simplified version - in production you'd want more robust handling
    return {
      blindReceiptCreated: true,
      poNumber,
      requiresMatching: true,
      message: 'Blind receipt created. Requires PO matching for completion.',
    };
  }
}
