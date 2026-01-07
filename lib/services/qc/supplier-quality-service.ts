import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface QualityMetrics {
  supplierId: string;
  organizationId: string;
  totalPurchaseOrders: number;
  totalUnitsReceived: number;
  totalDefectiveUnits: number;
  totalRtvCount: number;
  totalRtvValue: number;
  lifetimeDefectRate: number;
  recent90DefectRate: number;
  avgResolutionDays: number | null;
  qualityScore: number;
  reliabilityScore: number;
  responseScore: number;
  overallScore: number;
  status: string;
  tier: string;
}

export class SupplierQualityService {
  /**
   * Calculate all quality metrics for a supplier
   */
  static async calculateQualityMetrics(
    supplierId: string,
    organizationId: string,
  ): Promise<QualityMetrics> {
    // Get all completed inspections
    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        supplierId,
        organizationId,
        status: "COMPLETED",
      },
      include: {
        defects: true,
      },
    });

    // Get all RTVs
    const rtvs = await prisma.rTV.findMany({
      where: {
        supplierId,
        organizationId,
      },
    });

    // Get PO count
    const poCount = await prisma.purchaseOrder.count({
      where: {
        supplierId,
        organizationId,
        status: {
          in: ["RECEIVED", "CLOSED"],
        },
      },
    });

    // Calculate lifetime metrics
    const totalUnitsReceived = inspections.reduce(
      (sum, insp) => sum + insp.totalUnits,
      0,
    );
    const totalDefectiveUnits = inspections.reduce((sum, insp) => {
      return (
        sum +
        insp.defects.reduce(
          (defectSum, defect) => defectSum + defect.quantityAffected,
          0,
        )
      );
    }, 0);

    const lifetimeDefectRate =
      totalUnitsReceived > 0
        ? (totalDefectiveUnits / totalUnitsReceived) * 100
        : 0;

    // Calculate 90-day metrics
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recent90Inspections = inspections.filter(
      (insp) => new Date(insp.createdAt) >= ninetyDaysAgo,
    );

    const recent90Units = recent90Inspections.reduce(
      (sum, insp) => sum + insp.totalUnits,
      0,
    );
    const recent90Defects = recent90Inspections.reduce((sum, insp) => {
      return (
        sum +
        insp.defects.reduce(
          (defectSum, defect) => defectSum + defect.quantityAffected,
          0,
        )
      );
    }, 0);

    const recent90DefectRate =
      recent90Units > 0 ? (recent90Defects / recent90Units) * 100 : 0;

    // Calculate average resolution days for RTVs
    const creditedRTVs = rtvs.filter((rtv) => rtv.creditedAt);
    const avgResolutionDays =
      creditedRTVs.length > 0
        ? creditedRTVs.reduce((sum, rtv) => {
            const created = new Date(rtv.createdAt).getTime();
            const credited = new Date(rtv.creditedAt!).getTime();
            return sum + (credited - created) / (1000 * 60 * 60 * 24);
          }, 0) / creditedRTVs.length
        : null;

    // Calculate total RTV value
    const totalRtvValue = rtvs.reduce(
      (sum, rtv) => sum + parseFloat(rtv.value.toString()),
      0,
    );

    // Calculate scores (0-100)
    const qualityScore = this.calculateQualityScore(recent90DefectRate);
    const reliabilityScore = this.calculateReliabilityScore(
      poCount,
      inspections.length,
    );
    const responseScore = this.calculateResponseScore(avgResolutionDays);
    const overallScore = Math.round(
      (qualityScore + reliabilityScore + responseScore) / 3,
    );

    // Determine status and tier
    const status = this.determineStatus(overallScore, recent90DefectRate);
    const tier = this.determineTier(overallScore);

    return {
      supplierId,
      organizationId,
      totalPurchaseOrders: poCount,
      totalUnitsReceived,
      totalDefectiveUnits,
      totalRtvCount: rtvs.length,
      totalRtvValue,
      lifetimeDefectRate: parseFloat(lifetimeDefectRate.toFixed(4)),
      recent90DefectRate: parseFloat(recent90DefectRate.toFixed(4)),
      avgResolutionDays,
      qualityScore,
      reliabilityScore,
      responseScore,
      overallScore,
      status,
      tier,
    };
  }

  /**
   * Calculate quality score based on defect rate
   */
  private static calculateQualityScore(defectRate: number): number {
    if (defectRate === 0) return 100;
    if (defectRate < 0.1) return 98;
    if (defectRate < 0.5) return 95;
    if (defectRate < 1.0) return 85;
    if (defectRate < 2.0) return 75;
    if (defectRate < 5.0) return 60;
    if (defectRate < 10.0) return 40;
    return 20;
  }

  /**
   * Calculate reliability score based on order history
   */
  private static calculateReliabilityScore(
    poCount: number,
    inspectionCount: number,
  ): number {
    if (poCount === 0) return 100; // New supplier, benefit of doubt

    const inspectionRate = inspectionCount / poCount;

    // Penalize if high inspection rate (indicates quality issues)
    if (inspectionRate < 0.1) return 100; // Very few inspections needed
    if (inspectionRate < 0.3) return 90;
    if (inspectionRate < 0.5) return 75;
    if (inspectionRate < 0.7) return 60;
    return 50;
  }

  /**
   * Calculate response score based on RTV resolution time
   */
  private static calculateResponseScore(
    avgResolutionDays: number | null,
  ): number {
    if (avgResolutionDays === null) return 100; // No RTVs, good sign

    if (avgResolutionDays <= 5) return 100;
    if (avgResolutionDays <= 10) return 90;
    if (avgResolutionDays <= 15) return 75;
    if (avgResolutionDays <= 30) return 60;
    if (avgResolutionDays <= 45) return 40;
    return 20;
  }

  /**
   * Determine supplier status
   */
  private static determineStatus(
    overallScore: number,
    defectRate: number,
  ): string {
    if (defectRate > 10 || overallScore < 40) {
      return "BLOCKED";
    }
    if (defectRate > 5 || overallScore < 60) {
      return "SUSPENDED";
    }
    if (defectRate > 2 || overallScore < 75) {
      return "PROBATION";
    }
    return "APPROVED";
  }

  /**
   * Determine supplier tier
   */
  private static determineTier(overallScore: number): string {
    if (overallScore >= 95) return "PREMIUM";
    if (overallScore >= 80) return "STANDARD";
    if (overallScore >= 60) return "BASIC";
    return "POOR";
  }

  /**
   * Update supplier quality score
   */
  static async updateSupplierQuality(
    supplierId: string,
    organizationId: string,
  ) {
    const metrics = await this.calculateQualityMetrics(
      supplierId,
      organizationId,
    );

    // Get recent dates
    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        supplierId,
        organizationId,
        status: "COMPLETED",
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 100,
    });

    const defects = await prisma.qCDefect.findMany({
      where: {
        inspection: {
          supplierId,
          organizationId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    const rtvs = await prisma.rTV.findMany({
      where: {
        supplierId,
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    // Calculate consecutive good orders
    const recentInspections = inspections.slice(0, 10);
    let consecutiveGoodOrders = 0;
    for (const insp of recentInspections) {
      if (insp.result === "PASS") {
        consecutiveGoodOrders++;
      } else {
        break;
      }
    }

    // Calculate 90-day stats
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recent90POs = await prisma.purchaseOrder.count({
      where: {
        supplierId,
        organizationId,
        orderDate: { gte: ninetyDaysAgo },
      },
    });

    const recent90Inspections = inspections.filter(
      (insp) => new Date(insp.createdAt) >= ninetyDaysAgo,
    );

    const recent90Units = recent90Inspections.reduce(
      (sum, insp) => sum + insp.totalUnits,
      0,
    );
    const recent90Defects = recent90Inspections.reduce(
      (sum, insp) => sum + insp.failedUnits,
      0,
    );
    const recent90Rtvs = rtvs.filter(
      (rtv) => new Date(rtv.createdAt) >= ninetyDaysAgo,
    ).length;

    // Upsert quality score
    const qualityScore = await prisma.vendorQualityScore.upsert({
      where: {
        organizationId_supplierId: {
          organizationId,
          supplierId,
        },
      },
      create: {
        organizationId,
        supplierId,
        totalPurchaseOrders: metrics.totalPurchaseOrders,
        totalUnitsReceived: metrics.totalUnitsReceived,
        totalDefectiveUnits: metrics.totalDefectiveUnits,
        totalRtvCount: metrics.totalRtvCount,
        totalRtvValue: metrics.totalRtvValue,
        recent90DaysOrders: recent90POs,
        recent90DaysUnits: recent90Units,
        recent90DaysDefects: recent90Defects,
        recent90DaysRtv: recent90Rtvs,
        lifetimeDefectRate: metrics.lifetimeDefectRate,
        recent90DefectRate: metrics.recent90DefectRate,
        avgResolutionDays: metrics.avgResolutionDays
          ? Math.round(metrics.avgResolutionDays)
          : null,
        qualityScore: metrics.qualityScore,
        reliabilityScore: metrics.reliabilityScore,
        responseScore: metrics.responseScore,
        overallScore: metrics.overallScore,
        status: metrics.status,
        tier: metrics.tier,
        lastDefectDate: defects[0]?.createdAt,
        lastRtvDate: rtvs[0]?.createdAt,
        lastInspectionDate: inspections[0]?.completedAt,
        consecutiveGoodOrders,
      },
      update: {
        totalPurchaseOrders: metrics.totalPurchaseOrders,
        totalUnitsReceived: metrics.totalUnitsReceived,
        totalDefectiveUnits: metrics.totalDefectiveUnits,
        totalRtvCount: metrics.totalRtvCount,
        totalRtvValue: metrics.totalRtvValue,
        recent90DaysOrders: recent90POs,
        recent90DaysUnits: recent90Units,
        recent90DaysDefects: recent90Defects,
        recent90DaysRtv: recent90Rtvs,
        lifetimeDefectRate: metrics.lifetimeDefectRate,
        recent90DefectRate: metrics.recent90DefectRate,
        avgResolutionDays: metrics.avgResolutionDays
          ? Math.round(metrics.avgResolutionDays)
          : null,
        qualityScore: metrics.qualityScore,
        reliabilityScore: metrics.reliabilityScore,
        responseScore: metrics.responseScore,
        overallScore: metrics.overallScore,
        status: metrics.status,
        tier: metrics.tier,
        lastDefectDate: defects[0]?.createdAt,
        lastRtvDate: rtvs[0]?.createdAt,
        lastInspectionDate: inspections[0]?.completedAt,
        consecutiveGoodOrders,
      },
    });

    return qualityScore;
  }

  /**
   * Get supplier quality score
   */
  static async getSupplierQuality(supplierId: string, organizationId: string) {
    return await prisma.vendorQualityScore.findUnique({
      where: {
        organizationId_supplierId: {
          organizationId,
          supplierId,
        },
      },
      include: {
        supplier: true,
      },
    });
  }

  /**
   * List all supplier quality scores
   */
  static async listSupplierQuality(
    organizationId: string,
    filters: {
      status?: string;
      tier?: string;
      minScore?: number;
      maxScore?: number;
    } = {},
  ) {
    const where: any = {
      organizationId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.tier) where.tier = filters.tier;
    if (filters.minScore || filters.maxScore) {
      where.overallScore = {};
      if (filters.minScore) where.overallScore.gte = filters.minScore;
      if (filters.maxScore) where.overallScore.lte = filters.maxScore;
    }

    return await prisma.vendorQualityScore.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: {
        overallScore: "desc",
      },
    });
  }

  /**
   * Get quality trends for supplier
   */
  static async getQualityTrends(
    supplierId: string,
    organizationId: string,
    months: number = 6,
  ) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        supplierId,
        organizationId,
        status: "COMPLETED",
        completedAt: {
          gte: startDate,
        },
      },
      include: {
        defects: true,
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    // Group by month
    const trends: any[] = [];
    const monthsMap = new Map<string, any>();

    for (const inspection of inspections) {
      const monthKey = new Date(inspection.completedAt!)
        .toISOString()
        .substring(0, 7); // YYYY-MM

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: monthKey,
          totalInspections: 0,
          totalUnits: 0,
          defectiveUnits: 0,
          passedInspections: 0,
          failedInspections: 0,
          defectRate: 0,
        });
      }

      const data = monthsMap.get(monthKey);
      data.totalInspections++;
      data.totalUnits += inspection.totalUnits;
      data.defectiveUnits += inspection.defects.reduce(
        (sum, d) => sum + d.quantityAffected,
        0,
      );
      if (inspection.result === "PASS") data.passedInspections++;
      if (inspection.result === "FAIL") data.failedInspections++;
    }

    // Calculate defect rates
    for (const [month, data] of monthsMap.entries()) {
      data.defectRate =
        data.totalUnits > 0
          ? parseFloat(
              ((data.defectiveUnits / data.totalUnits) * 100).toFixed(2),
            )
          : 0;
      trends.push(data);
    }

    return trends;
  }

  /**
   * Compare suppliers
   */
  static async compareSuppliers(organizationId: string, supplierIds: string[]) {
    const suppliers = await prisma.vendorQualityScore.findMany({
      where: {
        organizationId,
        supplierId: {
          in: supplierIds,
        },
      },
      include: {
        supplier: true,
      },
    });

    return suppliers.map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplier.name,
      overallScore: s.overallScore,
      qualityScore: s.qualityScore,
      reliabilityScore: s.reliabilityScore,
      responseScore: s.responseScore,
      defectRate: s.recent90DefectRate,
      tier: s.tier,
      status: s.status,
    }));
  }

  /**
   * Bulk update all supplier quality scores
   */
  static async updateAllSupplierQuality(organizationId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const results = [];
    for (const supplier of suppliers) {
      try {
        const qualityScore = await this.updateSupplierQuality(
          supplier.id,
          organizationId,
        );
        results.push({ supplierId: supplier.id, success: true, qualityScore });
      } catch (error) {
        results.push({ supplierId: supplier.id, success: false, error });
      }
    }

    return results;
  }
}

export default SupplierQualityService;
