/**
 * Supplier Scorecard Calculator
 * Calculates comprehensive supplier quality metrics
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SupplierMetrics {
  supplierId: string;
  supplierName: string;
  period: string;

  // Quality Metrics
  totalNCRs: number;
  criticalNCRs: number;
  majorNCRs: number;
  minorNCRs: number;
  ncrRate: number; // NCRs per 1000 units received

  // Response Metrics
  averageResponseTime: number; // days
  responseRate: number; // percentage

  // Financial Impact
  totalClaimAmount: number;
  totalCostImpact: number;

  // Delivery Metrics (if available)
  onTimeDeliveryRate: number;

  // Inspection Results
  totalInspections: number;
  passedInspections: number;
  inspectionPassRate: number;

  // Overall Score
  qualityScore: number; // 0-100
  scoreGrade: string; // A, B, C, D, F

  // Trend
  trend: "IMPROVING" | "STABLE" | "DECLINING";
}

export class SupplierScorecardService {
  /**
   * Calculate comprehensive supplier scorecard
   */
  static async calculateScorecard(
    supplierId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SupplierMetrics> {
    // Get supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) throw new Error("Supplier not found");

    // Get NCRs in period
    const ncrs = await prisma.nonConformanceReport.findMany({
      where: {
        supplierId,
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        supplierResponses: true,
      },
    });

    const totalNCRs = ncrs.length;
    const criticalNCRs = ncrs.filter((n) => n.severity === "CRITICAL").length;
    const majorNCRs = ncrs.filter((n) => n.severity === "MAJOR").length;
    const minorNCRs = ncrs.filter((n) => n.severity === "MINOR").length;

    // Calculate response metrics
    const ncrsWithResponses = ncrs.filter(
      (n) => n.supplierResponses.length > 0,
    );
    const responseRate =
      totalNCRs > 0 ? (ncrsWithResponses.length / totalNCRs) * 100 : 100;

    const responseTimes = ncrsWithResponses.map((ncr) => {
      const response = ncr.supplierResponses[0];
      const ncrDate = new Date(ncr.reportDate);
      const responseDate = new Date(response.responseDate);
      return (
        (responseDate.getTime() - ncrDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Financial impact
    const totalClaimAmount = ncrs.reduce(
      (sum, ncr) => sum + (ncr.claimAmount ? Number(ncr.claimAmount) : 0),
      0,
    );

    const totalCostImpact = ncrs.reduce(
      (sum, ncr) => sum + (ncr.actualCost ? Number(ncr.actualCost) : 0),
      0,
    );

    // Get inspections (QC inspections related to supplier through GRN)
    const supplierGRNs = await prisma.goodsReceiptNote.findMany({
      where: {
        purchaseOrder: {
          supplierId,
        },
        receivedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
      },
    });

    const grnIds = supplierGRNs.map((g) => g.id);

    const inspections = await prisma.qCInspection.findMany({
      where: {
        grnId: {
          in: grnIds,
        },
        inspectedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(
      (i) => i.result === "PASS",
    ).length;
    const inspectionPassRate =
      totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 100;

    // Calculate NCR rate (per 1000 units)
    // Get total received quantity from GRNs (Goods Receipt Notes)
    const grns = await prisma.goodsReceiptNote.findMany({
      where: {
        purchaseOrder: {
          supplierId,
        },
        receivedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const totalQuantityReceived = grns.reduce((sum, grn) => {
      const itemsTotal =
        grn.items?.reduce(
          (itemSum: number, item: any) =>
            itemSum + (item.receivedQuantity || 0),
          0,
        ) || 0;
      return sum + itemsTotal;
    }, 0);
    const ncrRate =
      totalQuantityReceived > 0
        ? (totalNCRs / totalQuantityReceived) * 1000
        : 0;

    // Calculate overall quality score (0-100)
    let qualityScore = 100;

    // Deduct points for NCRs
    qualityScore -= criticalNCRs * 15;
    qualityScore -= majorNCRs * 10;
    qualityScore -= minorNCRs * 5;

    // Deduct points for slow response
    if (averageResponseTime > 7) {
      qualityScore -= Math.min(10, (averageResponseTime - 7) * 2);
    }

    // Deduct points for low response rate
    if (responseRate < 100) {
      qualityScore -= (100 - responseRate) * 0.5;
    }

    // Bonus points for high inspection pass rate
    if (inspectionPassRate >= 99) {
      qualityScore += 5;
    }

    // Ensure score is 0-100
    qualityScore = Math.max(0, Math.min(100, qualityScore));

    // Determine grade
    const scoreGrade = this.getScoreGrade(qualityScore);

    // Calculate trend (compare to previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() -
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const previousNCRs = await prisma.nonConformanceReport.count({
      where: {
        supplierId,
        reportDate: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    let trend: "IMPROVING" | "STABLE" | "DECLINING";
    if (totalNCRs < previousNCRs * 0.8) {
      trend = "IMPROVING";
    } else if (totalNCRs > previousNCRs * 1.2) {
      trend = "DECLINING";
    } else {
      trend = "STABLE";
    }

    // On-time delivery rate - calculate from POs
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        expectedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const deliveredPOs = purchaseOrders.filter(
      (po) => po.receivedDate !== null,
    );
    const onTimePOs = deliveredPOs.filter((po) => {
      if (!po.receivedDate || !po.expectedDate) return false;
      return po.receivedDate <= po.expectedDate;
    });

    const onTimeDeliveryRate =
      deliveredPOs.length > 0
        ? (onTimePOs.length / deliveredPOs.length) * 100
        : 100;

    return {
      supplierId,
      supplierName: supplier.name,
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalNCRs,
      criticalNCRs,
      majorNCRs,
      minorNCRs,
      ncrRate: Math.round(ncrRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      responseRate: Math.round(responseRate),
      totalClaimAmount,
      totalCostImpact,
      onTimeDeliveryRate,
      totalInspections,
      passedInspections,
      inspectionPassRate: Math.round(inspectionPassRate * 10) / 10,
      qualityScore: Math.round(qualityScore),
      scoreGrade,
      trend,
    };
  }

  /**
   * Get letter grade from score
   */
  static getScoreGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Get all supplier rankings
   */
  static async getSupplierRankings(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SupplierMetrics[]> {
    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const scorecards: SupplierMetrics[] = [];

    for (const supplier of suppliers) {
      try {
        const scorecard = await this.calculateScorecard(
          supplier.id,
          startDate,
          endDate,
        );
        scorecards.push(scorecard);
      } catch (error) {
        console.error(
          `Error calculating scorecard for ${supplier.name}:`,
          error,
        );
      }
    }

    // Sort by quality score
    return scorecards.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Get scorecard comparison over time
   */
  static async getScorecardTrend(
    supplierId: string,
    periods: number = 6,
  ): Promise<SupplierMetrics[]> {
    const trends: SupplierMetrics[] = [];
    const now = new Date();

    for (let i = 0; i < periods; i++) {
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() - i);
      endDate.setDate(0); // Last day of previous month

      const startDate = new Date(endDate);
      startDate.setDate(1); // First day of month

      const scorecard = await this.calculateScorecard(
        supplierId,
        startDate,
        endDate,
      );

      trends.unshift(scorecard);
    }

    return trends;
  }
}

export default SupplierScorecardService;
