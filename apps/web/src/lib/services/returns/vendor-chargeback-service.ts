/**
 * Vendor Chargeback Service
 *
 * Automatically calculates and creates vendor chargebacks based on
 * defect rates detected during receiving inspection (GRN items).
 */

import { prisma } from "@/lib/prisma";

interface ChargebackInput {
  organizationId: string;
  supplierId: string;
  sku?: string;
  periodStart: Date;
  periodEnd: Date;
  defectRateThreshold: number; // percentage, e.g. 5 = 5%
}

export const vendorChargebackService = {
  async autoCalculateChargeback(input: ChargebackInput) {
    const { organizationId, supplierId, sku, periodStart, periodEnd, defectRateThreshold } = input;

    // Find all GRN items from this supplier in the given period
    const grnItems = await prisma.gRNItem.findMany({
      where: {
        grn: {
          organizationId,
          purchaseOrder: { supplierId },
          receivedDate: { gte: periodStart, lte: periodEnd },
        },
        ...(sku
          ? { inventoryItem: { sku: { equals: sku, mode: "insensitive" } } }
          : {}),
      },
      select: {
        orderedQuantity: true,
        receivedQuantity: true,
        acceptedQuantity: true,
        rejectedQuantity: true,
        unitCost: true,
        inventoryItem: { select: { sku: true, name: true } },
        grn: { select: { purchaseOrderId: true } },
      },
    });

    if (grnItems.length === 0) {
      return null;
    }

    const totalReceived = grnItems.reduce(
      (acc, i) => acc + i.receivedQuantity,
      0,
    );
    const totalRejected = grnItems.reduce(
      (acc, i) => acc + i.rejectedQuantity,
      0,
    );

    if (totalReceived === 0) return null;

    const defectRate = (totalRejected / totalReceived) * 100;

    if (defectRate < defectRateThreshold) {
      return null; // below threshold, no chargeback
    }

    // Calculate costs
    const defectiveMerchandiseCost = grnItems.reduce((acc, i) => {
      return acc + Number(i.unitCost) * i.rejectedQuantity;
    }, 0);

    const inspectionCost = defectiveMerchandiseCost * 0.05; // 5% inspection fee
    const handlingCost = defectiveMerchandiseCost * 0.03; // 3% handling
    const shippingCost = defectiveMerchandiseCost * 0.02; // 2% return shipping estimate
    const qualityPenalty = defectiveMerchandiseCost * 0.1; // 10% quality penalty
    const administrativeFee = 50; // flat admin fee
    const customerRefunds = 0; // set separately when RMAs are linked
    const totalAmount =
      defectiveMerchandiseCost +
      inspectionCost +
      handlingCost +
      shippingCost +
      qualityPenalty +
      administrativeFee;

    const chargebackNumber = `CB-${Date.now()}-${supplierId.slice(-4).toUpperCase()}`;
    const invoiceNumber = `INV-${chargebackNumber}`;
    const now = new Date();
    const paymentDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Net 30
    const disputeDeadline = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days to dispute

    const creator = await prisma.organizationMember.findFirst({
      where: { organizationId, role: "OWNER" },
      select: { userId: true },
    });

    const chargeback = await prisma.vendorChargeback.create({
      data: {
        organizationId,
        vendorId: supplierId,
        chargebackNumber,
        invoiceNumber,
        invoiceDate: now,
        defectiveMerchandiseCost,
        inspectionCost,
        handlingCost,
        shippingCost,
        qualityPenalty,
        administrativeFee,
        customerRefunds,
        totalAmount,
        status: "PENDING",
        disputed: false,
        disputeDeadline,
        disputeWindow: 15,
        paymentDue,
        paymentTerms: "Net 30",
        autoDeductFromPayment: false,
        deductionScheduled: false,
        rtvIds: [],
        createdBy: creator?.userId ?? "system",
        notes: `Auto-generated chargeback for ${defectRate.toFixed(1)}% defect rate (threshold: ${defectRateThreshold}%). Period: ${periodStart.toISOString().split("T")[0]} to ${periodEnd.toISOString().split("T")[0]}.`,
      },
    });

    return {
      ...chargeback,
      defectRate: Number(defectRate.toFixed(2)),
      totalReceived,
      totalRejected,
    };
  },

  async list(organizationId: string, status?: string) {
    return prisma.vendorChargeback.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: {
        vendor: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },
};
