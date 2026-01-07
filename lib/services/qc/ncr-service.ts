/**
 * Non-Conformance Report (NCR) Service
 * Enterprise-grade NCR management with supplier claims and financial tracking
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type NCRSourceType =
  | "RECEIVING"
  | "PRODUCTION"
  | "PICKING"
  | "PACKING"
  | "CUSTOMER_COMPLAINT"
  | "AUDIT";

export type NCRDisposition =
  | "REWORK"
  | "SCRAP"
  | "RETURN_TO_VENDOR"
  | "USE_AS_IS"
  | "CREDIT_CLAIM"
  | "QUARANTINE";

export type ClaimStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "PARTIALLY_PAID";

export class NCRService {
  /**
   * Generate next NCR number
   */
  private static async generateNCRNumber(
    organizationId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    const lastNCR = await prisma.nonConformanceReport.findFirst({
      where: {
        organizationId,
        ncrNumber: {
          startsWith: `NCR-${year}${month}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastNCR) {
      const lastSequence = parseInt(lastNCR.ncrNumber.split("-").pop() || "0");
      sequence = lastSequence + 1;
    }

    return `NCR-${year}${month}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Create new NCR
   */
  static async createNCR(params: {
    organizationId: string;
    title: string;
    description: string;
    discoveredBy: string;
    discoveryLocation: string;
    sourceType: NCRSourceType;
    sourceId?: string;
    supplierId?: string;
    supplierName?: string;
    poNumber?: string;
    productSku?: string;
    productDescription?: string;
    lotNumber?: string;
    serialNumber?: string;
    quantityAffected: number;
    nonConformanceType: string;
    severity: string;
    category: string;
    suspectedRootCause?: string;
    disposition: NCRDisposition;
    estimatedCost?: number;
    claimAmount?: number;
    photos?: string[];
    documents?: string[];
    priority?: string;
    assignedTo?: string;
    dueDate?: Date;
    customerImpact?: boolean;
    createdBy: string;
  }) {
    const ncrNumber = await this.generateNCRNumber(params.organizationId);

    const ncr = await prisma.nonConformanceReport.create({
      data: {
        ncrNumber,
        organizationId: params.organizationId,
        title: params.title,
        description: params.description,
        discoveredBy: params.discoveredBy,
        discoveryLocation: params.discoveryLocation,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        supplierId: params.supplierId,
        supplierName: params.supplierName,
        poNumber: params.poNumber,
        productSku: params.productSku,
        productDescription: params.productDescription,
        lotNumber: params.lotNumber,
        serialNumber: params.serialNumber,
        quantityAffected: params.quantityAffected,
        nonConformanceType: params.nonConformanceType,
        severity: params.severity,
        category: params.category,
        suspectedRootCause: params.suspectedRootCause,
        disposition: params.disposition,
        estimatedCost: params.estimatedCost,
        claimAmount: params.claimAmount,
        claimStatus: params.claimAmount ? "PENDING" : null,
        photos: params.photos || [],
        documents: params.documents || [],
        priority: params.priority || "MEDIUM",
        assignedTo: params.assignedTo,
        dueDate: params.dueDate,
        customerImpact: params.customerImpact || false,
        createdBy: params.createdBy,
      },
      include: {
        supplier: true,
      },
    });

    return ncr;
  }

  /**
   * Update NCR
   */
  static async updateNCR(
    ncrId: string,
    updates: Partial<{
      status: string;
      disposition: NCRDisposition;
      dispositionDetails: string;
      confirmedRootCause: string;
      actualCost: number;
      assignedTo: string;
      dueDate: Date;
      notes: string;
    }>,
  ) {
    return await prisma.nonConformanceReport.update({
      where: { id: ncrId },
      data: updates,
      include: {
        supplier: true,
      },
    });
  }

  /**
   * Complete root cause analysis
   */
  static async completeRCA(params: {
    ncrId: string;
    rootCauseMethod: string;
    confirmedRootCause: string;
    rcaPerformedBy: string;
  }) {
    return await prisma.nonConformanceReport.update({
      where: { id: params.ncrId },
      data: {
        rootCauseMethod: params.rootCauseMethod,
        confirmedRootCause: params.confirmedRootCause,
        rcaCompletedDate: new Date(),
        rcaPerformedBy: params.rcaPerformedBy,
      },
    });
  }

  /**
   * Submit supplier claim
   */
  static async submitClaim(ncrId: string) {
    return await prisma.nonConformanceReport.update({
      where: { id: ncrId },
      data: {
        claimStatus: "SUBMITTED",
        claimSubmittedDate: new Date(),
      },
    });
  }

  /**
   * Update claim status
   */
  static async updateClaim(params: {
    ncrId: string;
    claimStatus: ClaimStatus;
    claimPaidAmount?: number;
    claimNotes?: string;
  }) {
    const data: any = {
      claimStatus: params.claimStatus,
      claimNotes: params.claimNotes,
    };

    if (params.claimStatus === "APPROVED") {
      data.claimApprovedDate = new Date();
    }

    if (
      params.claimStatus === "PAID" ||
      params.claimStatus === "PARTIALLY_PAID"
    ) {
      data.claimPaidAmount = params.claimPaidAmount;
    }

    return await prisma.nonConformanceReport.update({
      where: { id: params.ncrId },
      data,
    });
  }

  /**
   * Close NCR
   */
  static async closeNCR(params: {
    ncrId: string;
    closedBy: string;
    closureNotes?: string;
  }) {
    return await prisma.nonConformanceReport.update({
      where: { id: params.ncrId },
      data: {
        status: "CLOSED",
        closedDate: new Date(),
        closedBy: params.closedBy,
        closureNotes: params.closureNotes,
      },
    });
  }

  /**
   * Link NCR to CAPA
   */
  static async linkCAPA(ncrId: string, capaId: string) {
    const ncr = await prisma.nonConformanceReport.findUnique({
      where: { id: ncrId },
    });

    if (!ncr) throw new Error("NCR not found");

    const updatedCapaIds = [...(ncr.capaIds || []), capaId];

    return await prisma.nonConformanceReport.update({
      where: { id: ncrId },
      data: {
        capaRequired: true,
        capaIds: updatedCapaIds,
      },
    });
  }

  /**
   * Get NCR by ID
   */
  static async getNCRById(ncrId: string) {
    return await prisma.nonConformanceReport.findUnique({
      where: { id: ncrId },
      include: {
        supplier: true,
        capas: true,
      },
    });
  }

  /**
   * List NCRs with filters
   */
  static async listNCRs(
    organizationId: string,
    filters: {
      status?: string;
      severity?: string;
      supplierId?: string;
      category?: string;
      claimStatus?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.category) where.category = filters.category;
    if (filters.claimStatus) where.claimStatus = filters.claimStatus;

    if (filters.startDate || filters.endDate) {
      where.reportDate = {};
      if (filters.startDate) where.reportDate.gte = filters.startDate;
      if (filters.endDate) where.reportDate.lte = filters.endDate;
    }

    const ncrs = await prisma.nonConformanceReport.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ncrs;
  }

  /**
   * Get NCR statistics
   */
  static async getNCRStats(
    organizationId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.startDate || filters.endDate) {
      where.reportDate = {};
      if (filters.startDate) where.reportDate.gte = filters.startDate;
      if (filters.endDate) where.reportDate.lte = filters.endDate;
    }

    const ncrs = await prisma.nonConformanceReport.findMany({
      where,
    });

    const totalNCRs = ncrs.length;
    const openNCRs = ncrs.filter((n) => n.status === "OPEN").length;
    const closedNCRs = ncrs.filter((n) => n.status === "CLOSED").length;

    const criticalNCRs = ncrs.filter((n) => n.severity === "CRITICAL").length;
    const majorNCRs = ncrs.filter((n) => n.severity === "MAJOR").length;
    const minorNCRs = ncrs.filter((n) => n.severity === "MINOR").length;

    const totalClaimAmount = ncrs
      .filter((n) => n.claimAmount)
      .reduce((sum, n) => sum + Number(n.claimAmount), 0);

    const paidClaimAmount = ncrs
      .filter((n) => n.claimPaidAmount)
      .reduce((sum, n) => sum + Number(n.claimPaidAmount), 0);

    const totalCost = ncrs
      .filter((n) => n.actualCost || n.estimatedCost)
      .reduce((sum, n) => sum + Number(n.actualCost || n.estimatedCost), 0);

    const avgResolutionDays = this.calculateAvgResolutionDays(ncrs);

    return {
      totalNCRs,
      openNCRs,
      closedNCRs,
      criticalNCRs,
      majorNCRs,
      minorNCRs,
      totalClaimAmount,
      paidClaimAmount,
      totalCost,
      avgResolutionDays,
      closureRate: totalNCRs > 0 ? (closedNCRs / totalNCRs) * 100 : 0,
    };
  }

  /**
   * Calculate average resolution days
   */
  private static calculateAvgResolutionDays(ncrs: any[]): number {
    const closedNCRs = ncrs.filter(
      (n) => n.status === "CLOSED" && n.closedDate,
    );

    if (closedNCRs.length === 0) return 0;

    const totalDays = closedNCRs.reduce((sum, ncr) => {
      const days = Math.floor(
        (ncr.closedDate.getTime() - ncr.reportDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / closedNCRs.length);
  }
}
