/**
 * Supplier Performance Review Service
 * Formal quarterly/annual vendor performance evaluations
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ReviewType = "QUARTERLY" | "ANNUAL" | "AD_HOC";
export type Recommendation = "CONTINUE" | "PROBATION" | "DEVELOP" | "TERMINATE";

export interface PerformanceMetrics {
  qualityScore: number;
  deliveryScore: number;
  responsivenessScore: number;
  pricingScore: number;
  complianceScore: number;
}

export class SupplierPerformanceReviewService {
  /**
   * Create performance review
   */
  async createReview(params: {
    organizationId: string;
    vendorId: string;
    reviewPeriod: string;
    periodStart: Date;
    periodEnd: Date;
    reviewType: ReviewType;
    createdBy: string;
  }) {
    // Generate review number
    const reviewNumber = await this.generateReviewNumber(params.organizationId);

    // Calculate performance scores
    const metrics = await this.calculatePerformanceMetrics({
      vendorId: params.vendorId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    });

    // Create review
    const review = await prisma.supplierPerformanceReview.create({
      data: {
        reviewNumber,
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        reviewPeriod: params.reviewPeriod,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        reviewType: params.reviewType,
        ...metrics.scores,
        metricsSnapshot: metrics.snapshot as any,
        strengths: metrics.strengths as any,
        weaknesses: metrics.weaknesses as any,
        improvementAreas: metrics.improvementAreas as any,
        createdBy: params.createdBy,
      },
      include: {
        vendor: true,
      },
    });

    return review;
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(params: {
    vendorId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{
    scores: PerformanceMetrics & { overallScore: number };
    snapshot: any;
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
  }> {
    // Get quality metrics
    const qualityScore = await prisma.vendorQualityScore.findFirst({
      where: { supplierId: params.vendorId },
    });

    // Get delivery performance
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: params.vendorId,
        orderDate: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
    });

    const onTimeDeliveries = pos.filter((po) => {
      // TODO: Check if delivery was on time
      return true;
    }).length;

    const deliveryScore =
      pos.length > 0 ? (onTimeDeliveries / pos.length) * 100 : 50;

    // Get responsiveness (from RTVs, issues resolution time)
    const responsivenessScore = 75; // TODO: Calculate based on response times

    // Get pricing competitiveness
    const pricingScore = 80; // TODO: Calculate based on market comparison

    // Get compliance score
    const complianceChecks = await prisma.vendorComplianceCheck.findMany({
      where: {
        vendorId: params.vendorId,
        checkDate: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
    });

    const avgComplianceRate =
      complianceChecks.length > 0
        ? complianceChecks.reduce(
            (sum: number, c: any) => sum + Number(c.complianceRate),
            0,
          ) / complianceChecks.length
        : 50;

    const scores = {
      qualityScore: Math.round(qualityScore?.overallScore || 50),
      deliveryScore: Math.round(deliveryScore),
      responsivenessScore: Math.round(responsivenessScore),
      pricingScore: Math.round(pricingScore),
      complianceScore: Math.round(avgComplianceRate),
      overallScore: 0,
    };

    // Calculate weighted overall score
    scores.overallScore = Math.round(
      scores.qualityScore * 0.3 +
        scores.deliveryScore * 0.25 +
        scores.responsivenessScore * 0.2 +
        scores.pricingScore * 0.15 +
        scores.complianceScore * 0.1,
    );

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvementAreas: string[] = [];

    if (scores.qualityScore >= 90)
      strengths.push("Exceptional product quality");
    else if (scores.qualityScore < 70) {
      weaknesses.push("Quality issues");
      improvementAreas.push("Implement quality control improvements");
    }

    if (scores.deliveryScore >= 90) strengths.push("Reliable on-time delivery");
    else if (scores.deliveryScore < 70) {
      weaknesses.push("Delivery delays");
      improvementAreas.push("Improve production planning and logistics");
    }

    if (scores.responsivenessScore >= 90)
      strengths.push("Excellent communication");
    else if (scores.responsivenessScore < 70) {
      weaknesses.push("Slow issue resolution");
      improvementAreas.push("Enhance customer service response times");
    }

    return {
      scores,
      snapshot: {
        purchaseOrders: pos.length,
        onTimeDeliveries,
        complianceChecks: complianceChecks.length,
        rtvCount: 0, // TODO: Get from RTVs
      },
      strengths,
      weaknesses,
      improvementAreas,
    };
  }

  /**
   * Add corrective action plan (stub - correctiveActionsRequired field not in schema)
   */
  async addCorrectiveActionPlan(params: {
    reviewId: string;
    actionPlan: {
      issue: string;
      rootCause: string;
      action: string;
      responsible: string;
      dueDate: Date;
      status: string;
    }[];
  }) {
    // Note: correctiveActionsRequired, correctiveActionPlan fields not in schema
    // Store in actionItems instead
    return await prisma.supplierPerformanceReview.update({
      where: { id: params.reviewId },
      data: {
        actionItems: params.actionPlan as any,
      },
    });
  }

  /**
   * Schedule meeting (stub - fields not in schema)
   */
  async scheduleMeeting(params: {
    reviewId: string;
    meetingDate: Date;
    attendees: string[];
  }) {
    // Note: meetingScheduled, meetingDate, meetingAttendees fields not in schema
    // Store in notes instead
    return await prisma.supplierPerformanceReview.update({
      where: { id: params.reviewId },
      data: {
        notes: `Meeting scheduled for ${params.meetingDate.toISOString()} with attendees: ${params.attendees.join(", ")}`,
      },
    });
  }

  /**
   * Add meeting notes (stub - fields not in schema)
   */
  async addMeetingNotes(params: {
    reviewId: string;
    notes: string;
    actionItems: { description: string; owner: string; dueDate: Date }[];
  }) {
    // Note: meetingNotes, meetingActionItems fields not in schema
    // Store in actionItems instead
    return await prisma.supplierPerformanceReview.update({
      where: { id: params.reviewId },
      data: {
        notes: params.notes,
        actionItems: params.actionItems as any,
      },
    });
  }

  /**
   * Complete review with recommendation
   */
  async completeReview(params: {
    reviewId: string;
    recommendation: Recommendation;
    recommendationReason?: string;
    nextReviewDue?: Date;
  }) {
    const updateData: any = {
      status: "APPROVED",
      recommendation: params.recommendation,
      approvedAt: new Date(),
    };

    if (params.recommendationReason) {
      updateData.notes = params.recommendationReason;
    }

    return await prisma.supplierPerformanceReview.update({
      where: { id: params.reviewId },
      data: updateData,
    });
  }

  /**
   * Vendor acknowledges review
   */
  async vendorAcknowledgment(reviewId: string) {
    return await prisma.supplierPerformanceReview.update({
      where: { id: reviewId },
      data: {
        status: "PUBLISHED",
      },
    });
  }

  /**
   * List reviews
   */
  async listReviews(params: {
    organizationId: string;
    vendorId?: string;
    status?: string;
    reviewType?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.status) where.status = params.status;
    if (params.reviewType) where.reviewType = params.reviewType;

    const [reviews, total] = await Promise.all([
      prisma.supplierPerformanceReview.findMany({
        where,
        include: {
          vendor: true,
        },
        orderBy: { createdAt: "desc" },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.supplierPerformanceReview.count({ where }),
    ]);

    return {
      reviews,
      total,
      hasMore: (params.skip || 0) + reviews.length < total,
    };
  }

  /**
   * Get upcoming reviews
   */
  /**
   * Get upcoming reviews (stub - nextReviewDue field not in schema)
   */
  async getUpcomingReviews(params: {
    organizationId: string;
    daysAhead?: number;
  }) {
    // Note: nextReviewDue field not in schema
    // Return reviews that need follow-up
    return await prisma.supplierPerformanceReview.findMany({
      where: {
        organizationId: params.organizationId,
        status: { in: ["UNDER_REVIEW", "DRAFT"] },
      },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get review statistics
   */
  async getStatistics(params: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const reviews = await prisma.supplierPerformanceReview.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        overallScore: true,
        recommendation: true,
        status: true,
        qualityScore: true,
        deliveryScore: true,
        responsivenessScore: true,
        pricingScore: true,
        complianceScore: true,
        vendorId: true,
        reviewPeriod: true,
        periodStart: true,
        periodEnd: true,
        reviewType: true,
        reviewNumber: true,
        metricsSnapshot: true,
        strengths: true,
        weaknesses: true,
        improvementAreas: true,
        actionItems: true,
        reviewedBy: true,
        reviewedAt: true,
        approvedBy: true,
      },
    });

    const avgScore =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.overallScore, 0) /
          reviews.length
        : 0;

    const byRecommendation = reviews.reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.recommendation || "NONE"] =
          (acc[r.recommendation || "NONE"] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = reviews.reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalReviews: reviews.length,
      avgScore: Math.round(avgScore),
      byRecommendation,
      byStatus,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async generateReviewNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();

    const count = await prisma.supplierPerformanceReview.count({
      where: {
        organizationId,
        reviewPeriod: {
          startsWith: String(year),
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `SPR-${year}-${sequence}`;
  }
}

export const supplierPerformanceReviewService =
  new SupplierPerformanceReviewService();
export default supplierPerformanceReviewService;
