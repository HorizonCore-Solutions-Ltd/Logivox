/**
 * Quality Hold Service
 * Enterprise quarantine management with release workflows
 */

import { prisma } from "@/lib/prisma";

export type HoldType = "PRODUCT" | "LOT" | "LOCATION" | "VENDOR" | "ORDER";
export type HoldDisposition =
  | "RELEASE"
  | "REWORK"
  | "RETURN_TO_VENDOR"
  | "SCRAP"
  | "DESTROY"
  | "USE_AS_IS";

export class QualityHoldService {
  /**
   * Generate next hold number
   */
  private static async generateHoldNumber(
    organizationId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    const lastHold = await prisma.qualityHold.findFirst({
      where: {
        organizationId,
        holdNumber: {
          startsWith: `QH-${year}${month}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastHold) {
      const lastSequence = parseInt(
        lastHold.holdNumber.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `QH-${year}${month}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Create quality hold
   */
  static async createHold(params: {
    organizationId: string;
    holdType: HoldType;
    holdLevel: string;
    productSku?: string;
    productName?: string;
    lotNumber?: string;
    serialNumbers?: string[];
    locationId?: string;
    locationName?: string;
    vendorId?: string;
    orderId?: string;
    quantityOnHold: number;
    holdReason: string;
    holdDescription: string;
    severity: string;
    initiatedBy: string;
    sourceType: string;
    sourceId?: string;
    ncrId?: string;
    estimatedValue?: number;
    photos?: string[];
    documents?: string[];
    priority?: string;
    investigationRequired?: boolean;
    createdBy: string;
  }) {
    const holdNumber = await this.generateHoldNumber(params.organizationId);

    const hold = await prisma.qualityHold.create({
      data: {
        holdNumber,
        organizationId: params.organizationId,
        holdType: params.holdType,
        holdLevel: params.holdLevel,
        productSku: params.productSku,
        productName: params.productName,
        lotNumber: params.lotNumber,
        serialNumbers: params.serialNumbers || [],
        locationId: params.locationId,
        locationName: params.locationName,
        vendorId: params.vendorId,
        orderId: params.orderId,
        quantityOnHold: params.quantityOnHold,
        quantityRemaining: params.quantityOnHold,
        holdReason: params.holdReason,
        holdDescription: params.holdDescription,
        severity: params.severity,
        initiatedBy: params.initiatedBy,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        ncrId: params.ncrId,
        estimatedValue: params.estimatedValue,
        photos: params.photos || [],
        documents: params.documents || [],
        priority: params.priority || "MEDIUM",
        investigationRequired: params.investigationRequired !== false,
        investigationStatus:
          params.investigationRequired !== false ? "PENDING" : null,
        createdBy: params.createdBy,
      },
    });

    return hold;
  }

  /**
   * Request release
   */
  static async requestRelease(params: {
    holdId: string;
    releaseRequestedBy: string;
    releaseConditions?: string;
  }) {
    return await prisma.qualityHold.update({
      where: { id: params.holdId },
      data: {
        releaseRequested: true,
        releaseRequestDate: new Date(),
        releaseRequestedBy: params.releaseRequestedBy,
        releaseConditions: params.releaseConditions,
      },
    });
  }

  /**
   * Approve/reject release
   */
  static async approveRelease(params: {
    holdId: string;
    releaseApprovedBy: string;
    approved: boolean;
    quantity?: number;
    disposition: HoldDisposition;
    dispositionReason?: string;
  }) {
    const hold = await prisma.qualityHold.findUnique({
      where: { id: params.holdId },
    });

    if (!hold) throw new Error("Hold not found");

    const releaseQty = params.quantity || hold.quantityRemaining;
    const newRemaining = hold.quantityRemaining - releaseQty;

    const data: any = {
      releaseApproved: params.approved,
      releaseApprovedDate: new Date(),
      releaseApprovedBy: params.releaseApprovedBy,
      disposition: params.disposition,
      dispositionReason: params.dispositionReason,
      dispositionDate: new Date(),
      dispositionBy: params.releaseApprovedBy,
    };

    if (params.approved) {
      if (params.disposition === "RELEASE") {
        data.quantityReleased = hold.quantityReleased + releaseQty;
      } else if (
        params.disposition === "SCRAP" ||
        params.disposition === "DESTROY"
      ) {
        data.quantityRejected = hold.quantityRejected + releaseQty;
      }

      data.quantityRemaining = newRemaining;

      if (newRemaining === 0) {
        data.status =
          params.disposition === "RELEASE" ? "RELEASED" : "REJECTED";
      } else if (newRemaining < hold.quantityOnHold) {
        data.status = "PARTIAL_RELEASE";
      }
    }

    return await prisma.qualityHold.update({
      where: { id: params.holdId },
      data,
    });
  }

  /**
   * Update investigation status
   */
  static async updateInvestigation(params: {
    holdId: string;
    investigationStatus: string;
    investigationNotes?: string;
  }) {
    return await prisma.qualityHold.update({
      where: { id: params.holdId },
      data: {
        investigationStatus: params.investigationStatus,
        investigationNotes: params.investigationNotes,
      },
    });
  }

  /**
   * Escalate hold
   */
  static async escalateHold(params: { holdId: string; escalatedTo: string }) {
    return await prisma.qualityHold.update({
      where: { id: params.holdId },
      data: {
        escalated: true,
        escalatedDate: new Date(),
        escalatedTo: params.escalatedTo,
      },
    });
  }

  /**
   * Cancel hold
   */
  static async cancelHold(holdId: string, reason?: string) {
    return await prisma.qualityHold.update({
      where: { id: holdId },
      data: {
        status: "CANCELLED",
        notes: reason,
      },
    });
  }

  /**
   * Get hold by ID
   */
  static async getHoldById(holdId: string) {
    return await prisma.qualityHold.findUnique({
      where: { id: holdId },
    });
  }

  /**
   * List holds with filters
   */
  static async listHolds(
    organizationId: string,
    filters: {
      status?: string;
      holdType?: HoldType;
      severity?: string;
      vendorId?: string;
      productSku?: string;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.holdType) where.holdType = filters.holdType;
    if (filters.severity) where.severity = filters.severity;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.productSku) where.productSku = filters.productSku;

    return await prisma.qualityHold.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get hold statistics
   */
  static async getHoldStats(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const holds = await prisma.qualityHold.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const totalHolds = holds.length;
    const activeHolds = holds.filter((h) => h.status === "ACTIVE").length;
    const releasedHolds = holds.filter((h) => h.status === "RELEASED").length;
    const rejectedHolds = holds.filter((h) => h.status === "REJECTED").length;

    const totalQuantityOnHold = holds
      .filter((h) => h.status === "ACTIVE")
      .reduce((sum, h) => sum + h.quantityRemaining, 0);

    const totalValue = holds
      .filter((h) => h.estimatedValue && h.status === "ACTIVE")
      .reduce((sum, h) => sum + Number(h.estimatedValue), 0);

    const avgResolutionDays = this.calculateAvgResolutionDays(holds);

    return {
      totalHolds,
      activeHolds,
      releasedHolds,
      rejectedHolds,
      totalQuantityOnHold,
      totalValue,
      avgResolutionDays,
      releaseRate: totalHolds > 0 ? (releasedHolds / totalHolds) * 100 : 0,
    };
  }

  /**
   * Calculate average resolution days
   */
  private static calculateAvgResolutionDays(holds: any[]): number {
    const resolved = holds.filter(
      (h) =>
        (h.status === "RELEASED" || h.status === "REJECTED") &&
        h.dispositionDate,
    );

    if (resolved.length === 0) return 0;

    const totalDays = resolved.reduce((sum, hold) => {
      const days = Math.floor(
        (hold.dispositionDate.getTime() - hold.initiatedDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / resolved.length);
  }
}
