/**
 * Vendor Debit Memo Service
 * Financial charges against vendors for operational failures
 * (Short shipments, late deliveries, non-compliance, etc.)
 */

import { prisma } from "@/lib/prisma";

export type DebitMemoReason =
  | "SHORT_SHIPMENT"
  | "LATE_DELIVERY"
  | "NON_COMPLIANT_PACKAGING"
  | "MISSING_DOCS"
  | "QUALITY_FAILURE"
  | "DAMAGED_GOODS"
  | "INCORRECT_LABELING"
  | "INCOMPLETE_ORDER"
  | "OTHER";

export type CalculationMethod =
  | "FIXED_FEE"
  | "PERCENTAGE"
  | "QUANTITY_BASED"
  | "TIME_BASED";

export interface DebitMemoCalculation {
  method: CalculationMethod;
  baseAmount?: number;
  percentage?: number;
  quantity?: number;
  unitCost?: number;
  daysLate?: number;
  dailyPenalty?: number;
  details: any;
}

export class DebitMemoService {
  /**
   * Create debit memo
   */
  async createDebitMemo(params: {
    organizationId: string;
    vendorId: string;
    reason: DebitMemoReason;
    reasonDescription: string;
    purchaseOrderId?: string;
    grnId?: string;
    rtvId?: string;
    calculationMethod: CalculationMethod;
    calculationDetails: DebitMemoCalculation;
    offsetFromPayment?: boolean;
    notes?: string;
    createdBy: string;
  }) {
    // Calculate debit amount
    const debitAmount = this.calculateDebitAmount(params.calculationDetails);

    // Generate debit memo number
    const debitMemoNumber = await this.generateDebitMemoNumber(
      params.organizationId,
    );

    // Get vendor
    const vendor = await prisma.supplier.findUnique({
      where: { id: params.vendorId },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Calculate payment terms
    const invoiceDate = new Date();
    const paymentDue = new Date(invoiceDate);
    paymentDue.setDate(paymentDue.getDate() + 30); // NET_30

    // Create debit memo
    const debitMemo = await prisma.vendorDebitMemo.create({
      data: {
        debitMemoNumber,
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        reason: params.reason,
        reasonDescription: params.reasonDescription,
        purchaseOrderId: params.purchaseOrderId,
        grnId: params.grnId,
        rtvId: params.rtvId,
        debitAmount,
        calculationMethod: params.calculationMethod,
        calculationDetails: params.calculationDetails as any,
        invoiceNumber: `DM-INV-${debitMemoNumber}`,
        invoiceDate,
        paymentTerms: "NET_30",
        paymentDue,
        offsetFromPayment: params.offsetFromPayment ?? true,
        notes: params.notes,
        createdBy: params.createdBy,
      },
      include: {
        vendor: true,
      },
    });

    // Generate invoice PDF
    await this.generateDebitMemoInvoice(debitMemo.id);

    // Send notification to vendor
    await this.notifyVendor(debitMemo.id);

    return debitMemo;
  }

  /**
   * Calculate debit amount based on method
   */
  private calculateDebitAmount(calculation: DebitMemoCalculation): number {
    let amount = 0;

    switch (calculation.method) {
      case "FIXED_FEE":
        amount = calculation.baseAmount || 0;
        break;

      case "PERCENTAGE":
        amount =
          (calculation.baseAmount || 0) * ((calculation.percentage || 0) / 100);
        break;

      case "QUANTITY_BASED":
        amount = (calculation.quantity || 0) * (calculation.unitCost || 0);
        break;

      case "TIME_BASED":
        amount = (calculation.daysLate || 0) * (calculation.dailyPenalty || 0);
        break;
    }

    return Math.round(amount * 100) / 100; // Round to 2 decimals
  }

  /**
   * Approve debit memo
   */
  async approveDebitMemo(params: { debitMemoId: string; approvedBy: string }) {
    const debitMemo = await prisma.vendorDebitMemo.update({
      where: { id: params.debitMemoId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: params.approvedBy,
      },
      include: {
        vendor: true,
      },
    });

    // Schedule payment offset if enabled
    if (debitMemo.offsetFromPayment) {
      await this.schedulePaymentOffset(debitMemo.id);
    }

    return debitMemo;
  }

  /**
   * Schedule payment offset
   */
  private async schedulePaymentOffset(debitMemoId: string) {
    const debitMemo = await prisma.vendorDebitMemo.findUnique({
      where: { id: debitMemoId },
    });

    if (!debitMemo) return;

    // Get vendor's next payment
    const nextPayment = await this.getVendorNextPayment(debitMemo.vendorId);

    if (nextPayment) {
      await prisma.vendorDebitMemo.update({
        where: { id: debitMemoId },
        data: {
          offsetScheduled: true,
          offsetDate: nextPayment.date,
        },
      });
    }
  }

  /**
   * Process vendor dispute
   */
  async processDispute(params: { debitMemoId: string; disputeReason: string }) {
    return await prisma.vendorDebitMemo.update({
      where: { id: params.debitMemoId },
      data: {
        disputed: true,
        disputeReason: params.disputeReason,
        disputeStatus: "OPEN",
        status: "DISPUTED",
      },
    });
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(params: {
    debitMemoId: string;
    outcome: "UPHELD" | "REDUCED" | "CANCELLED";
    adjustedAmount?: number;
    resolution: string;
  }) {
    const updateData: any = {
      disputeStatus: "RESOLVED",
      disputeResolvedAt: new Date(),
      disputeOutcome: params.outcome,
    };

    if (params.outcome === "CANCELLED") {
      updateData.status = "CANCELLED";
    } else if (params.outcome === "UPHELD") {
      updateData.status = "APPROVED";
    } else if (params.outcome === "REDUCED" && params.adjustedAmount) {
      updateData.status = "APPROVED";
      updateData.debitAmount = params.adjustedAmount;
    }

    return await prisma.vendorDebitMemo.update({
      where: { id: params.debitMemoId },
      data: updateData,
    });
  }

  /**
   * Mark as collected
   */
  async markAsCollected(params: {
    debitMemoId: string;
    collectedAmount: number;
  }) {
    return await prisma.vendorDebitMemo.update({
      where: { id: params.debitMemoId },
      data: {
        status: "OFFSET",
        collectedAt: new Date(),
        collectedAmount: params.collectedAmount,
      },
    });
  }

  /**
   * List debit memos
   */
  async listDebitMemos(params: {
    organizationId: string;
    vendorId?: string;
    status?: string;
    reason?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.status) where.status = params.status;
    if (params.reason) where.reason = params.reason;

    const [debitMemos, total] = await Promise.all([
      prisma.vendorDebitMemo.findMany({
        where,
        include: {
          vendor: true,
        },
        orderBy: { createdAt: "desc" },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.vendorDebitMemo.count({ where }),
    ]);

    return {
      debitMemos,
      total,
      hasMore: (params.skip || 0) + debitMemos.length < total,
    };
  }

  /**
   * Get debit memo statistics
   */
  async getStatistics(params: {
    organizationId: string;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const debitMemos = await prisma.vendorDebitMemo.findMany({
      where,
      select: {
        debitAmount: true,
        collectedAmount: true,
        status: true,
        reason: true,
        disputed: true,
      },
    });

    const totalAmount = debitMemos.reduce(
      (sum: number, dm: any) => sum + Number(dm.debitAmount),
      0,
    );
    const collectedAmount = debitMemos.reduce(
      (sum: number, dm: any) => sum + Number(dm.collectedAmount || 0),
      0,
    );
    const pendingAmount = debitMemos
      .filter((dm: any) => dm.status === "PENDING" || dm.status === "APPROVED")
      .reduce((sum: number, dm: any) => sum + Number(dm.debitAmount), 0);

    const byReason = debitMemos.reduce(
      (acc: Record<string, number>, dm: any) => {
        acc[dm.reason] = (acc[dm.reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = debitMemos.reduce(
      (acc: Record<string, number>, dm: any) => {
        acc[dm.status] = (acc[dm.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalCount: debitMemos.length,
      totalAmount,
      collectedAmount,
      pendingAmount,
      disputedCount: debitMemos.filter((dm: any) => dm.disputed).length,
      byReason,
      byStatus,
      collectionRate:
        totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async generateDebitMemoNumber(
    organizationId: string,
  ): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Count existing debit memos this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0);

    const count = await prisma.vendorDebitMemo.count({
      where: {
        organizationId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `DM-${year}${month}-${sequence}`;
  }

  private async generateDebitMemoInvoice(debitMemoId: string): Promise<void> {
    // TODO: Generate PDF invoice
    console.log(`Generated invoice for debit memo: ${debitMemoId}`);
  }

  private async notifyVendor(debitMemoId: string): Promise<void> {
    // TODO: Send email notification to vendor
    console.log(`Notified vendor of debit memo: ${debitMemoId}`);
  }

  private async getVendorNextPayment(
    vendorId: string,
  ): Promise<{ date: Date } | null> {
    // TODO: Integrate with AP system to get next payment date
    return {
      date: new Date(Date.now() + 7 * 86400000), // 7 days from now
    };
  }
}

export const debitMemoService = new DebitMemoService();
export default debitMemoService;
