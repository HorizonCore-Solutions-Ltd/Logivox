/**
 * Quality Report Service
 * Generate comprehensive quality reports with metrics and trends
 */

import { prisma } from "@/lib/prisma";

export type ReportType =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUAL"
  | "CUSTOM";
export type ReportCategory =
  | "INSPECTION"
  | "DEFECTS"
  | "NCR"
  | "CAPA"
  | "SUPPLIER"
  | "COMPLIANCE"
  | "EXECUTIVE";

export class QualityReportService {
  /**
   * Generate next report number
   */
  private static async generateReportNumber(
    organizationId: string,
  ): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const lastReport = await prisma.qualityReport.findFirst({
      where: {
        organizationId,
        reportNumber: {
          startsWith: `QR-${year}${month}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastReport) {
      const lastSequence = parseInt(
        lastReport.reportNumber.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `QR-${year}${month}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Generate inspection summary report
   */
  static async generateInspectionReport(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const inspections = await prisma.qCReceivingInspection.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const total = inspections.length;
    const passed = inspections.filter((i) => i.result === "PASS").length;
    const failed = inspections.filter((i) => i.result === "FAIL").length;
    const conditional = inspections.filter(
      (i) => i.result === "CONDITIONAL_ACCEPTANCE",
    ).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      conditional,
      passRate,
      inspections,
    };
  }

  /**
   * Generate defects report
   */
  static async generateDefectsReport(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const defects = await prisma.qCDefect.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const total = defects.length;
    const critical = defects.filter((d) =>
      d.defectType.includes("CRITICAL"),
    ).length;
    const major = defects.filter((d) => d.defectType.includes("MAJOR")).length;
    const minor = defects.filter((d) => d.defectType.includes("MINOR")).length;

    // Group by defect code
    const byDefectCode = defects.reduce(
      (acc, d) => {
        const code = d.defectType || "UNKNOWN";
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Top 5 defect codes
    const topDefects = Object.entries(byDefectCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    return {
      total,
      critical,
      major,
      minor,
      byDefectCode,
      topDefects,
      defects,
    };
  }

  /**
   * Generate NCR report
   */
  static async generateNCRReport(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const ncrs = await prisma.nonConformanceReport.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const total = ncrs.length;
    const open = ncrs.filter((n) => n.status === "OPEN").length;
    const inInvestigation = ncrs.filter(
      (n) => n.status === "IN_INVESTIGATION",
    ).length;
    const inProgress = ncrs.filter((n) => n.status === "IN_PROGRESS").length;
    const closed = ncrs.filter((n) => n.status === "CLOSED").length;

    // Supplier claims
    const claimsPending = ncrs.filter(
      (n) => n.claimStatus === "PENDING",
    ).length;
    const claimsSubmitted = ncrs.filter(
      (n) => n.claimStatus === "SUBMITTED",
    ).length;
    const claimsApproved = ncrs.filter(
      (n) => n.claimStatus === "APPROVED",
    ).length;
    const claimsPaid = ncrs.filter((n) => n.claimStatus === "PAID").length;

    const totalClaimAmount = ncrs
      .filter((n) => n.claimAmount !== null)
      .reduce((sum, n) => sum + (Number(n.claimAmount) || 0), 0);

    const approvedClaimAmount = ncrs
      .filter((n) => n.claimStatus === "APPROVED" || n.claimStatus === "PAID")
      .reduce((sum, n) => sum + (Number(n.claimAmount) || 0), 0);

    return {
      total,
      open,
      inInvestigation,
      inProgress,
      closed,
      claims: {
        pending: claimsPending,
        submitted: claimsSubmitted,
        approved: claimsApproved,
        paid: claimsPaid,
        totalAmount: totalClaimAmount,
        approvedAmount: approvedClaimAmount,
      },
      ncrs,
    };
  }

  /**
   * Generate CAPA report
   */
  static async generateCAPAReport(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const capas = await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const total = capas.length;
    const open = capas.filter((c) => c.status === "OPEN").length;
    const inProgress = capas.filter((c) => c.status === "IN_PROGRESS").length;
    const completed = capas.filter((c) => c.status === "COMPLETED").length;
    const verified = capas.filter((c) => c.status === "VERIFIED").length;
    const closed = capas.filter((c) => c.status === "CLOSED").length;

    // Calculate average RPN
    const avgRPN =
      capas.length > 0
        ? capas.reduce((sum, c) => sum + (c.riskPriority || 0), 0) /
          capas.length
        : 0;

    // High risk CAPAs (RPN > 100)
    const highRisk = capas.filter((c) => (c.riskPriority || 0) > 100).length;

    // Overdue CAPAs
    const now = new Date();
    const overdue = capas.filter(
      (c) =>
        c.status !== "CLOSED" &&
        c.targetCompletionDate &&
        new Date(c.targetCompletionDate) < now,
    ).length;

    return {
      total,
      open,
      inProgress,
      completed,
      verified,
      closed,
      avgRPN,
      highRisk,
      overdue,
      capas,
    };
  }

  /**
   * Generate supplier quality report
   */
  static async generateSupplierReport(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: params.organizationId },
      include: {
        qualityScore: {
          where: {
            createdAt: {
              gte: params.startDate,
              lte: params.endDate,
            },
          },
        },
        ncrs: {
          where: {
            createdAt: {
              gte: params.startDate,
              lte: params.endDate,
            },
          },
        },
      },
    });

    const supplierSummary = suppliers.map((supplier) => {
      // Quality scores don't exist as direct relation - calculate from NCRs
      const avgScore = 0; // TODO: Calculate based on NCR metrics

      const ncrCount = supplier.ncrs.length;
      const claimAmount = supplier.ncrs.reduce(
        (sum: number, n: any) => sum + (Number(n.claimAmount) || 0),
        0,
      );

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        avgQualityScore: avgScore,
        ncrCount,
        claimAmount,
      };
    });

    // Top 5 suppliers by quality score
    const topSuppliers = [...supplierSummary]
      .sort((a, b) => b.avgQualityScore - a.avgQualityScore)
      .slice(0, 5);

    // Bottom 5 suppliers by quality score
    const bottomSuppliers = [...supplierSummary]
      .sort((a, b) => a.avgQualityScore - b.avgQualityScore)
      .slice(0, 5);

    return {
      totalSuppliers: suppliers.length,
      avgQualityScore:
        supplierSummary.length > 0
          ? supplierSummary.reduce((sum, s) => sum + s.avgQualityScore, 0) /
            supplierSummary.length
          : 0,
      topSuppliers,
      bottomSuppliers,
      supplierSummary,
    };
  }

  /**
   * Generate executive summary report
   */
  static async generateExecutiveSummary(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const [inspectionData, defectsData, ncrData, capaData, supplierData] =
      await Promise.all([
        this.generateInspectionReport(params),
        this.generateDefectsReport(params),
        this.generateNCRReport(params),
        this.generateCAPAReport(params),
        this.generateSupplierReport(params),
      ]);

    return {
      period: {
        startDate: params.startDate,
        endDate: params.endDate,
      },
      summary: {
        inspectionPassRate: inspectionData.passRate,
        totalDefects: defectsData.total,
        criticalDefects: defectsData.critical,
        totalNCRs: ncrData.total,
        openNCRs: ncrData.open,
        totalCAPAs: capaData.total,
        overdueCAPAs: capaData.overdue,
        avgSupplierScore: supplierData.avgQualityScore,
        supplierClaimAmount: ncrData.claims.totalAmount,
      },
      inspections: inspectionData,
      defects: defectsData,
      ncr: ncrData,
      capa: capaData,
      suppliers: supplierData,
    };
  }

  /**
   * Create quality report
   */
  static async createReport(params: {
    organizationId: string;
    reportType: ReportType;
    reportCategory: ReportCategory;
    reportNumber: string;
    reportDescription?: string;
    periodStart: Date;
    periodEnd: Date;
    generatedBy: string;
  }) {
    const reportNumber = await this.generateReportNumber(params.organizationId);

    // Generate metrics based on category
    let metrics: any = {};

    switch (params.reportCategory) {
      case "INSPECTION":
        metrics = await this.generateInspectionReport({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;

      case "DEFECTS":
        metrics = await this.generateDefectsReport({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;

      case "NCR":
        metrics = await this.generateNCRReport({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;

      case "CAPA":
        metrics = await this.generateCAPAReport({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;

      case "SUPPLIER":
        metrics = await this.generateSupplierReport({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;

      case "EXECUTIVE":
        metrics = await this.generateExecutiveSummary({
          organizationId: params.organizationId,
          startDate: params.periodStart,
          endDate: params.periodEnd,
        });
        break;
    }

    const report = await prisma.qualityReport.create({
      data: {
        reportNumber,
        organizationId: params.organizationId,
        reportType: params.reportType,
        reportCategory: params.reportCategory,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        metrics,
        reportDate: new Date(),
        createdBy: params.generatedBy || "system",
      },
    });

    return report;
  }

  /**
   * List reports with filters
   */
  static async listReports(
    organizationId: string,
    filters: {
      reportType?: ReportType;
      reportCategory?: ReportCategory;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.reportType) where.reportType = filters.reportType;
    if (filters.reportCategory) where.reportCategory = filters.reportCategory;
    if (filters.startDate || filters.endDate) {
      where.periodStart = {};
      if (filters.startDate) where.periodStart.gte = filters.startDate;
      if (filters.endDate) where.periodStart.lte = filters.endDate;
    }

    return await prisma.qualityReport.findMany({
      where,
      orderBy: { reportDate: "desc" },
    });
  }

  /**
   * Get report by ID
   */
  static async getReportById(reportId: string) {
    return await prisma.qualityReport.findUnique({
      where: { id: reportId },
    });
  }

  /**
   * Schedule automatic report generation
   */
  static async scheduleReport(params: {
    organizationId: string;
    reportType: ReportType;
    reportCategory: ReportCategory;
    reportNumber: string;
    reportDescription?: string;
    scheduleEnabled: boolean;
    scheduleFrequency: string;
    nextRunDate?: Date;
    emailRecipients?: string[];
    createdBy: string;
  }) {
    const report = await prisma.qualityReport.create({
      data: {
        reportNumber: await this.generateReportNumber(params.organizationId),
        organizationId: params.organizationId,
        reportType: params.reportType,
        reportCategory: params.reportCategory,
        periodStart: new Date(),
        periodEnd: new Date(),
        reportDate: new Date(),
        metrics: {},
        createdBy: params.createdBy || "system",
      },
    });

    return report;
  }
}
