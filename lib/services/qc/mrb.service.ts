/**
 * Material Review Board (MRB) Service
 * Disposition of Nonconforming Material
 * ISO 9001:2015 Clause 8.7 - Control of nonconforming outputs
 * ISO 13485:2016 Clause 8.3 - Control of nonconforming product
 * AS9100 Section 8.7 - Control of nonconforming process outputs and products
 */

import { prisma } from "@/lib/prisma";

export class MRBService {
  /**
   * Submit material for MRB review
   */
  static async submitForReview(params: {
    organizationId: string;
    ncrId?: string;
    productId: string;
    productName: string;
    lotNumber?: string;
    quantity: number;
    unitOfMeasure: string;
    location: string;
    nonconformanceDescription: string;
    severity: string; // MINOR, MAJOR, CRITICAL
    affectedCharacteristics: string[];
    measurementData?: any;
    photos?: any[];
    submittedBy: string;
    urgency: string; // ROUTINE, HIGH, CRITICAL
    customerImpact: boolean;
    estimatedValue?: number;
  }) {
    const mrbNumber = `MRB-${Date.now()}`;

    return await prisma.materialReviewBoard.create({
      data: {
        mrbNumber,
        organizationId: params.organizationId,
        ncrId: params.ncrId,
        productId: params.productId,
        productName: params.productName,
        lotNumber: params.lotNumber,
        quantity: params.quantity,
        unitOfMeasure: params.unitOfMeasure,
        location: params.location,
        nonconformanceDescription: params.nonconformanceDescription,
        severity: params.severity,
        affectedCharacteristics: params.affectedCharacteristics,
        measurementData: params.measurementData,
        photos: params.photos || [],
        submittedBy: params.submittedBy,
        submittedDate: new Date(),
        urgency: params.urgency,
        customerImpact: params.customerImpact,
        estimatedValue: params.estimatedValue,
        status: "PENDING_REVIEW",
      },
    });
  }

  /**
   * Schedule MRB meeting
   */
  static async scheduleMeeting(params: {
    mrbId: string;
    meetingDate: Date;
    chairperson: string;
    attendees: string[];
    location?: string;
  }) {
    return await prisma.materialReviewBoard.update({
      where: { id: params.mrbId },
      data: {
        status: "SCHEDULED",
        meetingDate: params.meetingDate,
        chairperson: params.chairperson,
        attendees: params.attendees,
        meetingLocation: params.location,
      },
    });
  }

  /**
   * Record MRB disposition decision
   */
  static async recordDisposition(params: {
    mrbId: string;
    disposition: string; // USE_AS_IS, REWORK, RETURN_TO_SUPPLIER, SCRAP, REPAIR, SORT
    dispositionJustification: string;
    conditions?: string[]; // Conditions for use-as-is
    reworkInstructions?: string;
    inspectionRequirements?: string;
    approvalLevel: string; // STANDARD, MANAGEMENT, CUSTOMER, REGULATORY
    approvers: {
      role: string;
      name: string;
      approved: boolean;
      comments?: string;
    }[];
    effectiveDate: Date;
    expirationDate?: Date; // For temporary dispositions
    limitedQuantity?: number; // For limited use-as-is
    costImpact?: number;
    scheduleImpact?: number; // Days
    customerNotificationRequired: boolean;
  }) {
    const mrb = await prisma.materialReviewBoard.findUnique({
      where: { id: params.mrbId },
    });

    if (!mrb) {
      throw new Error("MRB record not found");
    }

    // Check if all required approvals obtained
    const allApproved = params.approvers.every((a) => a.approved);

    if (!allApproved) {
      throw new Error(
        "All required approvals must be obtained before recording disposition",
      );
    }

    return await prisma.materialReviewBoard.update({
      where: { id: params.mrbId },
      data: {
        status: "DISPOSITION_APPROVED",
        disposition: params.disposition,
        dispositionJustification: params.dispositionJustification,
        conditions: params.conditions || [],
        reworkInstructions: params.reworkInstructions,
        inspectionRequirements: params.inspectionRequirements,
        approvalLevel: params.approvalLevel,
        approvers: params.approvers,
        dispositionDate: new Date(),
        effectiveDate: params.effectiveDate,
        expirationDate: params.expirationDate,
        limitedQuantity: params.limitedQuantity,
        costImpact: params.costImpact,
        scheduleImpact: params.scheduleImpact,
        customerNotificationRequired: params.customerNotificationRequired,
      },
    });
  }

  /**
   * Execute disposition (rework, scrap, etc.)
   */
  static async executeDisposition(params: {
    mrbId: string;
    executedBy: string;
    executionDate: Date;
    actualQuantityProcessed: number;
    executionNotes?: string;
    verificationResults?: string;
    finalInspectionPassed: boolean;
    actualCost?: number;
    dispositionComplete: boolean;
  }) {
    const mrb = await prisma.materialReviewBoard.findUnique({
      where: { id: params.mrbId },
    });

    if (mrb?.status !== "DISPOSITION_APPROVED") {
      throw new Error("Disposition must be approved before execution");
    }

    return await prisma.materialReviewBoard.update({
      where: { id: params.mrbId },
      data: {
        status: params.dispositionComplete ? "COMPLETED" : "IN_PROGRESS",
        executedBy: params.executedBy,
        executionDate: params.executionDate,
        actualQuantityProcessed: params.actualQuantityProcessed,
        executionNotes: params.executionNotes,
        verificationResults: params.verificationResults,
        finalInspectionPassed: params.finalInspectionPassed,
        actualCost: params.actualCost,
      },
    });
  }

  /**
   * Close MRB review
   */
  static async closeMRB(params: {
    mrbId: string;
    closedBy: string;
    closureNotes?: string;
    lessonsLearned?: string;
    preventiveActionsRequired: boolean;
    capaId?: string;
  }) {
    return await prisma.materialReviewBoard.update({
      where: { id: params.mrbId },
      data: {
        status: "CLOSED",
        closedDate: new Date(),
        closedBy: params.closedBy,
        closureNotes: params.closureNotes,
        lessonsLearned: params.lessonsLearned,
        preventiveActionsRequired: params.preventiveActionsRequired,
        capaId: params.capaId,
      },
    });
  }

  /**
   * Get MRB statistics
   */
  static async getStatistics(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = {
      organizationId: params.organizationId,
    };

    if (params.startDate) {
      whereClause.submittedDate = {
        gte: params.startDate,
        ...(params.endDate && { lte: params.endDate }),
      };
    }

    const reviews = await prisma.materialReviewBoard.findMany({
      where: whereClause,
    });

    const byDisposition: any = {};
    const bySeverity: any = {};
    const byStatus: any = {};

    reviews.forEach((review) => {
      if (review.disposition) {
        byDisposition[review.disposition] =
          (byDisposition[review.disposition] || 0) + 1;
      }
      bySeverity[review.severity] = (bySeverity[review.severity] || 0) + 1;
      byStatus[review.status] = (byStatus[review.status] || 0) + 1;
    });

    // Calculate cycle times
    const cycleTimes = reviews
      .filter((r) => r.dispositionDate)
      .map((r) => {
        const hours = Math.floor(
          (new Date(r.dispositionDate!).getTime() -
            new Date(r.submittedDate).getTime()) /
            (1000 * 60 * 60),
        );
        return hours;
      });

    const avgCycleTime =
      cycleTimes.length > 0
        ? cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length
        : 0;

    // Calculate costs
    const totalEstimatedCost = reviews
      .filter((r) => r.estimatedValue)
      .reduce((sum, r) => sum + (r.estimatedValue || 0), 0);

    const totalActualCost = reviews
      .filter((r) => r.actualCost)
      .reduce((sum, r) => sum + (r.actualCost || 0), 0);

    // Calculate quantities
    const totalQuantityReviewed = reviews.reduce(
      (sum, r) => sum + r.quantity,
      0,
    );
    const totalQuantityProcessed = reviews
      .filter((r) => r.actualQuantityProcessed)
      .reduce((sum, r) => sum + (r.actualQuantityProcessed || 0), 0);

    return {
      summary: {
        total: reviews.length,
        pending: reviews.filter((r) => r.status === "PENDING_REVIEW").length,
        scheduled: reviews.filter((r) => r.status === "SCHEDULED").length,
        approved: reviews.filter((r) => r.status === "DISPOSITION_APPROVED")
          .length,
        inProgress: reviews.filter((r) => r.status === "IN_PROGRESS").length,
        completed: reviews.filter((r) => r.status === "COMPLETED").length,
        closed: reviews.filter((r) => r.status === "CLOSED").length,
      },
      byDisposition,
      bySeverity,
      byStatus,
      timing: {
        averageCycleTimeHours: Math.round(avgCycleTime),
      },
      financial: {
        totalEstimatedValue: totalEstimatedCost,
        totalActualCost: totalActualCost,
        savingsVsScrap: this.calculateSavings(reviews),
      },
      quantity: {
        totalReviewed: totalQuantityReviewed,
        totalProcessed: totalQuantityProcessed,
      },
      quality: {
        customerImpact: reviews.filter((r) => r.customerImpact).length,
        finalInspectionPassRate: this.calculatePassRate(reviews),
        preventiveActionsGenerated: reviews.filter(
          (r) => r.preventiveActionsRequired,
        ).length,
      },
    };
  }

  /**
   * Get pending MRB reviews
   */
  static async getPendingReviews(params: {
    organizationId: string;
    urgentOnly?: boolean;
  }) {
    const whereClause: any = {
      organizationId: params.organizationId,
      status: { in: ["PENDING_REVIEW", "SCHEDULED"] },
    };

    if (params.urgentOnly) {
      whereClause.urgency = { in: ["HIGH", "CRITICAL"] };
    }

    return await prisma.materialReviewBoard.findMany({
      where: whereClause,
      orderBy: [{ urgency: "desc" }, { submittedDate: "asc" }],
    });
  }

  /**
   * Helper: Calculate savings from dispositions other than scrap
   */
  private static calculateSavings(reviews: any[]): number {
    const scrappedValue = reviews
      .filter((r) => r.disposition === "SCRAP")
      .reduce((sum, r) => sum + (r.estimatedValue || 0), 0);

    const savedValue = reviews
      .filter((r) =>
        ["USE_AS_IS", "REWORK", "REPAIR", "SORT"].includes(r.disposition || ""),
      )
      .reduce(
        (sum, r) => sum + ((r.estimatedValue || 0) - (r.actualCost || 0)),
        0,
      );

    return savedValue;
  }

  /**
   * Helper: Calculate final inspection pass rate
   */
  private static calculatePassRate(reviews: any[]): number {
    const completed = reviews.filter(
      (r) => r.status === "COMPLETED" && r.finalInspectionPassed !== null,
    );

    if (completed.length === 0) return 0;

    const passed = completed.filter((r) => r.finalInspectionPassed).length;
    return (passed / completed.length) * 100;
  }
}
