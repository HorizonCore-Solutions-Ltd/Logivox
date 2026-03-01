/**
 * SupplierScorecardService
 *
 * Calculates quality, delivery, compliance, responsiveness, and pricing scores
 * for suppliers by aggregating data from PurchaseOrders, NCRs,
 * VendorComplianceChecks, QCReceivingInspections, and SupplierPerformanceReviews.
 */

import { prisma } from "@/lib/prisma";

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  periodStart: Date;
  periodEnd: Date;
  scores: {
    quality: number; // 0–100: pass rate on receiving inspections
    delivery: number; // 0–100: on-time delivery rate
    compliance: number; // 0–100: vendor compliance check pass rate
    responsiveness: number; // 0–100: avg response time to NCRs (faster = higher)
    pricing: number; // 0–100: avg latest manual review pricing score
    overall: number; // weighted composite
  };
  metrics: {
    totalPOs: number;
    onTimePOs: number;
    totalInspections: number;
    passedInspections: number;
    totalNCRs: number;
    openNCRs: number;
    avgNCRResolutionDays: number | null;
    totalComplianceChecks: number;
    passedComplianceChecks: number;
    lastReviewDate: Date | null;
    lastReviewOverallScore: number | null;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  trend: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
}

export interface SupplierRanking {
  rank: number;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  scores: SupplierScorecard["scores"];
}

export interface ScorecardTrendPoint {
  period: string; // "YYYY-MM" label
  periodStart: Date;
  periodEnd: Date;
  scores: SupplierScorecard["scores"];
  overall: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

async function computeScores(
  supplierId: string,
  orgId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<
  SupplierScorecard["scores"] & { metrics: SupplierScorecard["metrics"] }
> {
  const dateFilter = { gte: periodStart, lte: periodEnd };

  // Run all DB queries in parallel
  const [poData, inspectionData, ncrData, complianceData, latestReview] =
    await Promise.all([
      // POs in period — check for actualDeliveryDate vs expectedDeliveryDate
      prisma.purchaseOrder.findMany({
        where: {
          supplierId,
          organizationId: orgId,
          createdAt: dateFilter,
          status: { in: ["RECEIVED", "CLOSED", "COMPLETED"] },
        },
        select: {
          id: true,
          expectedDeliveryDate: true,
          actualDeliveryDate: true,
        },
      }),
      // QC receiving inspections
      prisma.qCReceivingInspection
        .findMany({
          where: {
            supplierId,
            organizationId: orgId,
            inspectionDate: dateFilter,
          },
          select: {
            id: true,
            result: true,
          },
        })
        .catch(() => [] as { id: string; result: string }[]),
      // NCRs raised against supplier
      prisma.nonConformanceReport
        .findMany({
          where: {
            supplierId,
            organizationId: orgId,
            createdAt: dateFilter,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            closedAt: true,
          },
        })
        .catch(
          () =>
            [] as {
              id: string;
              status: string;
              createdAt: Date;
              closedAt: Date | null;
            }[],
        ),
      // Vendor compliance checks
      prisma.vendorComplianceCheck.findMany({
        where: {
          vendorId: supplierId,
          organizationId: orgId,
          checkDate: dateFilter,
        },
        select: {
          id: true,
          overallResult: true,
        },
      }),
      // Latest performance review for pricing/responsiveness
      prisma.supplierPerformanceReview.findFirst({
        where: {
          vendorId: supplierId,
          organizationId: orgId,
          periodStart: { lte: periodEnd },
          status: "APPROVED",
        },
        orderBy: { periodEnd: "desc" },
        select: {
          qualityScore: true,
          deliveryScore: true,
          responsivenessScore: true,
          pricingScore: true,
          complianceScore: true,
          overallScore: true,
          reviewedAt: true,
        },
      }),
    ]);

  // ── Quality score: inspection pass rate ─────────────────────────────────
  const totalInspections = inspectionData.length;
  const passedInspections = inspectionData.filter(
    (i) =>
      i.result === "PASS" || i.result === "PASSED" || i.result === "APPROVED",
  ).length;
  const qualityScore =
    totalInspections > 0
      ? clamp((passedInspections / totalInspections) * 100)
      : (latestReview?.qualityScore ?? 75);

  // ── Delivery score: on-time delivery rate ───────────────────────────────
  const totalPOs = poData.length;
  const onTimePOs = poData.filter((po) => {
    if (!po.actualDeliveryDate || !po.expectedDeliveryDate) return true; // assume on-time if no data
    return po.actualDeliveryDate <= po.expectedDeliveryDate;
  }).length;
  const deliveryScore =
    totalPOs > 0
      ? clamp((onTimePOs / totalPOs) * 100)
      : (latestReview?.deliveryScore ?? 75);

  // ── Compliance score: vendor compliance check pass rate ──────────────────
  const totalComplianceChecks = complianceData.length;
  const passedComplianceChecks = complianceData.filter(
    (c) =>
      c.overallResult === "PASS" ||
      c.overallResult === "PASSED" ||
      c.overallResult === "COMPLIANT",
  ).length;
  const complianceScore =
    totalComplianceChecks > 0
      ? clamp((passedComplianceChecks / totalComplianceChecks) * 100)
      : (latestReview?.complianceScore ?? 75);

  // ── Responsiveness score: avg days to close NCRs → invert ────────────────
  const totalNCRs = ncrData.length;
  const openNCRs = ncrData.filter(
    (n) => n.status !== "CLOSED" && n.status !== "RESOLVED",
  ).length;
  const closedNCRs = ncrData.filter((n) => n.closedAt != null);
  let avgNCRResolutionDays: number | null = null;
  if (closedNCRs.length > 0) {
    const totalDays = closedNCRs.reduce((sum, n) => {
      const days =
        (n.closedAt!.getTime() - n.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgNCRResolutionDays = Math.round(totalDays / closedNCRs.length);
  }
  // Score: 0 days = 100, 30+ days = 0 — linear
  const responsivenessScore =
    avgNCRResolutionDays != null
      ? clamp(100 - (avgNCRResolutionDays / 30) * 100)
      : (latestReview?.responsivenessScore ?? 75);

  // ── Pricing score: from latest manual review ─────────────────────────────
  const pricingScore = latestReview?.pricingScore ?? 75;

  // ── Overall: weighted composite (matches industry practice) ─────────────
  const overall = clamp(
    qualityScore * 0.3 +
      deliveryScore * 0.3 +
      complianceScore * 0.2 +
      responsivenessScore * 0.1 +
      pricingScore * 0.1,
  );

  return {
    quality: qualityScore,
    delivery: deliveryScore,
    compliance: complianceScore,
    responsiveness: responsivenessScore,
    pricing: pricingScore,
    overall,
    metrics: {
      totalPOs,
      onTimePOs,
      totalInspections,
      passedInspections,
      totalNCRs,
      openNCRs,
      avgNCRResolutionDays,
      totalComplianceChecks,
      passedComplianceChecks,
      lastReviewDate: latestReview?.reviewedAt ?? null,
      lastReviewOverallScore: latestReview?.overallScore ?? null,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const SupplierScorecardService = {
  /**
   * Calculate a full scorecard for a single supplier over a date range.
   */
  async calculateScorecard(
    supplierId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SupplierScorecard> {
    const supplier = await prisma.supplier.findFirstOrThrow({
      where: { id: supplierId },
      select: { id: true, name: true, code: true, organizationId: true },
    });

    const { metrics, ...scores } = await computeScores(
      supplierId,
      supplier.organizationId,
      periodStart,
      periodEnd,
    );

    // Determine trend by comparing to previous same-length period
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);
    const prevPeriodStart = new Date(
      periodStart.getTime() - (periodEnd.getTime() - periodStart.getTime()),
    );
    let trend: SupplierScorecard["trend"] = "INSUFFICIENT_DATA";
    try {
      const prev = await computeScores(
        supplierId,
        supplier.organizationId,
        prevPeriodStart,
        prevPeriodEnd,
      );
      const delta = scores.overall - prev.overall;
      trend = delta >= 3 ? "IMPROVING" : delta <= -3 ? "DECLINING" : "STABLE";
    } catch {
      // leave as INSUFFICIENT_DATA
    }

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCode: supplier.code,
      periodStart,
      periodEnd,
      scores,
      metrics,
      grade: toGrade(scores.overall),
      trend,
    };
  },

  /**
   * Rank all active suppliers in an organization by overall score.
   */
  async getSupplierRankings(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SupplierRanking[]> {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    const scorecards = await Promise.all(
      suppliers.map(async (s) => {
        const { metrics, ...scores } = await computeScores(
          s.id,
          organizationId,
          periodStart,
          periodEnd,
        );
        return { supplier: s, scores, metrics };
      }),
    );

    // Sort descending by overall
    scorecards.sort((a, b) => b.scores.overall - a.scores.overall);

    return scorecards.map((sc, idx) => ({
      rank: idx + 1,
      supplierId: sc.supplier.id,
      supplierName: sc.supplier.name,
      supplierCode: sc.supplier.code,
      overallScore: sc.scores.overall,
      grade: toGrade(sc.scores.overall),
      scores: sc.scores,
    }));
  },

  /**
   * Return monthly scorecard trend for a supplier over N periods (months).
   */
  async getScorecardTrend(
    supplierId: string,
    periods = 6,
  ): Promise<ScorecardTrendPoint[]> {
    const supplier = await prisma.supplier.findFirstOrThrow({
      where: { id: supplierId },
      select: { organizationId: true },
    });

    const now = new Date();
    const results: ScorecardTrendPoint[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // last day of month
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1); // first day of month

      const { metrics: _m, ...scores } = await computeScores(
        supplierId,
        supplier.organizationId,
        periodStart,
        periodEnd,
      );

      const label = periodStart.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      results.push({
        period: label,
        periodStart,
        periodEnd,
        scores,
        overall: scores.overall,
      });
    }

    return results;
  },
};

export default SupplierScorecardService;
