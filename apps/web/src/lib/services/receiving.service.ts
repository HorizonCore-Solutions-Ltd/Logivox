/**
 * Receiving Operations Service
 * Handles GRN creation, quality control, put-away, and ASN processing.
 */

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GRNItemInput {
  purchaseOrderItemId?: string;
  inventoryItemId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  binLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  unitCost?: number;
  notes?: string;
}

interface QCItemUpdate {
  grnItemId: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  hasDefects: boolean;
  defectDescription?: string;
  qcNotes?: string;
}

interface PutAwayAssignment {
  grnItemId: string;
  binLocation: string;
}

export interface ASNData {
  format?: "JSON" | "XML" | "CSV";
  supplierCode?: string;
  referenceNumber?: string;
  items: Array<{
    sku: string;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
    unitCost?: number;
  }>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ReceivingService {
  /**
   * Fetch a GRN with all its items and related data.
   */
  static async getGRNDetails(grnId: string) {
    const grn = await prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: {
          include: {
            inventoryItem: { select: { sku: true, name: true } },
            purchaseOrderItem: { select: { unitPrice: true, description: true } },
          },
        },
        purchaseOrder: { select: { poNumber: true, supplierId: true } },
        warehouse: { select: { name: true, code: true } },
        receivedBy: { select: { name: true, email: true } },
        qcBy: { select: { name: true } },
      },
    });

    if (!grn) throw new Error(`GRN ${grnId} not found`);
    return grn;
  }

  /**
   * Create a new Goods Receipt Note with optional line items.
   */
  static async createGRN(params: {
    organizationId: string;
    purchaseOrderId: string;
    warehouseId?: string;
    receivedById: string;
    items: GRNItemInput[];
  }) {
    const { organizationId, purchaseOrderId, warehouseId, receivedById, items } = params;

    // Verify PO belongs to org
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, organizationId },
    });
    if (!po) throw new Error("Purchase order not found or access denied");

    const grnNumber = `GRN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const grn = await prisma.goodsReceiptNote.create({
      data: {
        organizationId,
        purchaseOrderId,
        warehouseId: warehouseId || null,
        grnNumber,
        status: "PENDING",
        receivedById,
        receivedDate: new Date(),
        items: items.length
          ? {
              create: items.map((item) => ({
                inventoryItemId: item.inventoryItemId,
                purchaseOrderItemId: item.purchaseOrderItemId || null,
                orderedQuantity: item.orderedQuantity,
                receivedQuantity: item.receivedQuantity,
                acceptedQuantity: item.acceptedQuantity ?? item.receivedQuantity,
                rejectedQuantity: item.rejectedQuantity ?? 0,
                unitCost: item.unitCost ?? 0,
                binLocation: item.binLocation || null,
                batchNumber: item.batchNumber || null,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                notes: item.notes || null,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return grn;
  }

  /**
   * Record QC results on a GRN and its items.
   */
  static async performQualityControl(params: {
    grnId: string;
    qcById: string;
    qcStatus: string;
    qcNotes?: string;
    items: QCItemUpdate[];
  }) {
    const { grnId, qcById, qcStatus, qcNotes, items } = params;

    const approved = qcStatus === "APPROVED";
    const hasDiscrepancy = items.some((i) => i.rejectedQuantity > 0);

    // Update each GRN item
    for (const item of items) {
      await prisma.gRNItem.update({
        where: { id: item.grnItemId },
        data: {
          acceptedQuantity: item.acceptedQuantity,
          rejectedQuantity: item.rejectedQuantity,
          hasDefects: item.hasDefects,
          defectDescription: item.defectDescription || null,
          qcStatus,
          qcNotes: item.qcNotes || null,
        },
      });
    }

    const grn = await prisma.goodsReceiptNote.update({
      where: { id: grnId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        qcStatus,
        qcNotes: qcNotes || null,
        qcById,
        qcDate: new Date(),
        hasDiscrepancy,
      },
      include: { items: true },
    });

    return grn;
  }

  /**
   * Mark GRN items as put-away and update inventory bin locations.
   */
  static async completePutAway(params: {
    grnId: string;
    items: PutAwayAssignment[];
  }) {
    const { grnId, items } = params;

    // Update bin location on each GRN item
    for (const assignment of items) {
      await prisma.gRNItem.update({
        where: { id: assignment.grnItemId },
        data: {
          binLocation: assignment.binLocation,
          putAwayCompleted: true,
        },
      });
    }

    const grn = await prisma.goodsReceiptNote.update({
      where: { id: grnId },
      data: {
        status: "COMPLETED",
        putAwayCompleted: true,
        putAwayDate: new Date(),
      },
      include: { items: true },
    });

    return grn;
  }

  /**
   * Process an Advance Shipping Notice (ASN) by matching items to a PO
   * and auto-creating a GRN draft.
   */
  static async processASN(params: {
    organizationId: string;
    purchaseOrderId: string;
    asnData: ASNData;
  }) {
    const { organizationId, purchaseOrderId, asnData } = params;

    // Validate PO
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, organizationId },
      include: { items: { include: { inventoryItem: true } } },
    });
    if (!po) throw new Error("Purchase order not found or access denied");

    // Match ASN items to PO items by SKU
    const grnItems: GRNItemInput[] = [];
    const unmatchedSkus: string[] = [];

    for (const asnItem of asnData.items) {
      const poItem = po.items.find(
        (p) =>
          p.sku === asnItem.sku ||
          p.inventoryItem?.sku === asnItem.sku,
      );

      if (!poItem || !poItem.inventoryItemId) {
        unmatchedSkus.push(asnItem.sku);
        continue;
      }

      grnItems.push({
        purchaseOrderItemId: poItem.id,
        inventoryItemId: poItem.inventoryItemId,
        orderedQuantity: poItem.quantityOrdered,
        receivedQuantity: asnItem.quantity,
        acceptedQuantity: asnItem.quantity,
        rejectedQuantity: 0,
        batchNumber: asnItem.batchNumber,
        expiryDate: asnItem.expiryDate,
        unitCost: asnItem.unitCost ?? Number(poItem.unitPrice),
      });
    }

    // Get the org's first active user as receivedById placeholder (system)
    const orgMember = await prisma.organizationMember.findFirst({
      where: { organizationId },
      select: { userId: true },
    });
    if (!orgMember) throw new Error("No organization members found");

    const grn = await ReceivingService.createGRN({
      organizationId,
      purchaseOrderId,
      receivedById: orgMember.userId,
      items: grnItems,
    });

    return {
      grn,
      matchedItems: grnItems.length,
      unmatchedSkus,
      referenceNumber: asnData.referenceNumber,
    };
  }

  /**
   * Return real receiving statistics for an org in a date range.
   */
  static async getStatistics(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    warehouseId?: string;
  }) {
    const { organizationId, startDate, endDate, warehouseId } = params;

    const where = {
      organizationId,
      receivedDate: { gte: startDate, lte: endDate },
      ...(warehouseId ? { warehouseId } : {}),
    };

    const [totalGRNs, itemsAgg, pendingQC, completedPutAway] =
      await Promise.all([
        prisma.goodsReceiptNote.count({ where }),
        prisma.gRNItem.aggregate({
          where: {
            grn: {
              organizationId,
              receivedDate: { gte: startDate, lte: endDate },
              ...(warehouseId ? { warehouseId } : {}),
            },
          },
          _sum: { receivedQuantity: true, rejectedQuantity: true },
          _count: true,
        }),
        prisma.goodsReceiptNote.count({
          where: { ...where, status: "QUALITY_CHECK" },
        }),
        prisma.goodsReceiptNote.count({
          where: { ...where, putAwayCompleted: true },
        }),
      ]);

    return {
      totalGRNs,
      totalItems: itemsAgg._count,
      totalReceivedQty: itemsAgg._sum.receivedQuantity ?? 0,
      totalRejectedQty: itemsAgg._sum.rejectedQuantity ?? 0,
      pendingQC,
      completedPutAway,
    };
  }
}
