/**
 * Vendor Compliance Service
 * Track and audit vendor compliance with standards and requirements
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type CheckType =
  | "PACKAGING"
  | "LABELING"
  | "DOCUMENTATION"
  | "CERTIFICATION"
  | "QUALITY_STANDARDS"
  | "SAFETY";

export type CheckResult = "PASSED" | "PASSED_WITH_WARNINGS" | "FAILED";

export interface ChecklistItem {
  id: string;
  requirement: string;
  result: "PASS" | "FAIL" | "NA";
  notes?: string;
  evidence?: string[];
  criticality: "CRITICAL" | "MAJOR" | "MINOR";
}

export class VendorComplianceService {
  /**
   * Create compliance check
   */
  async createCheck(params: {
    organizationId: string;
    vendorId: string;
    checkType: CheckType;
    checkDate: Date;
    inspectorId: string;
    checklistItems: ChecklistItem[];
    createdBy: string;
  }) {
    const checkNumber = await this.generateCheckNumber(params.organizationId);

    // Calculate metrics
    const totalItems = params.checklistItems.filter(
      (item) => item.result !== "NA",
    ).length;
    const passedItems = params.checklistItems.filter(
      (item) => item.result === "PASS",
    ).length;
    const failedItems = params.checklistItems.filter(
      (item) => item.result === "FAIL",
    ).length;
    const complianceRate =
      totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

    // Categorize violations
    const violations = params.checklistItems
      .filter((item) => item.result === "FAIL")
      .map((item) => ({
        requirement: item.requirement,
        criticality: item.criticality,
        notes: item.notes,
      }));

    const criticalViolations = violations.filter(
      (v) => v.criticality === "CRITICAL",
    ).length;
    const majorViolations = violations.filter(
      (v) => v.criticality === "MAJOR",
    ).length;
    const minorViolations = violations.filter(
      (v) => v.criticality === "MINOR",
    ).length;

    // Determine overall result
    let overallResult: CheckResult;
    if (criticalViolations > 0 || complianceRate < 70) {
      overallResult = "FAILED";
    } else if (majorViolations > 0 || complianceRate < 90) {
      overallResult = "PASSED_WITH_WARNINGS";
    } else {
      overallResult = "PASSED";
    }

    // Create check
    const check = await prisma.vendorComplianceCheck.create({
      data: {
        checkNumber,
        organizationId: params.organizationId,
        vendorId: params.vendorId,
        checkType: params.checkType,
        checkDate: params.checkDate,
        inspectorId: params.inspectorId,
        checklistItems: params.checklistItems as any,
        totalItems,
        passedItems,
        failedItems,
        complianceRate,
        violations: violations.length > 0 ? (violations as any) : null,
        violationCount: violations.length,
        criticalViolations,
        majorViolations,
        minorViolations,
        correctiveActionsRequired: violations.length > 0,
        overallResult,
        followUpRequired: overallResult !== "PASSED",
        createdBy: params.createdBy,
      },
      include: {
        vendor: true,
      },
    });

    // Calculate follow-up date if needed
    if (check.followUpRequired) {
      const followUpDate = new Date(check.checkDate);
      followUpDate.setDate(
        followUpDate.getDate() + (criticalViolations > 0 ? 7 : 30),
      );

      await prisma.vendorComplianceCheck.update({
        where: { id: check.id },
        data: { followUpDate },
      });
    }

    return check;
  }

  /**
   * Add corrective actions
   */
  async addCorrectiveActions(params: {
    checkId: string;
    actions: {
      violation: string;
      action: string;
      responsible: string;
      dueDate: Date;
      status: string;
    }[];
  }) {
    return await prisma.vendorComplianceCheck.update({
      where: { id: params.checkId },
      data: {
        correctiveActions: params.actions as any,
      },
    });
  }

  /**
   * Assess penalty
   */
  async assessPenalty(params: {
    checkId: string;
    penaltyAmount: number;
    penaltyReason: string;
  }) {
    return await prisma.vendorComplianceCheck.update({
      where: { id: params.checkId },
      data: {
        penaltyAssessed: true,
        penaltyAmount: params.penaltyAmount,
        penaltyReason: params.penaltyReason,
      },
    });
  }

  /**
   * Complete follow-up
   */
  async completeFollowUp(params: { checkId: string; notes: string }) {
    return await prisma.vendorComplianceCheck.update({
      where: { id: params.checkId },
      data: {
        followUpCompleted: true,
        status: "CLOSED",
        notes: params.notes,
      },
    });
  }

  /**
   * List compliance checks
   */
  async listChecks(params: {
    organizationId: string;
    vendorId?: string;
    checkType?: CheckType;
    overallResult?: CheckResult;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organizationId: params.organizationId,
    };

    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.checkType) where.checkType = params.checkType;
    if (params.overallResult) where.overallResult = params.overallResult;

    const [checks, total] = await Promise.all([
      prisma.vendorComplianceCheck.findMany({
        where,
        include: {
          vendor: true,
        },
        orderBy: { checkDate: "desc" },
        skip: params.skip || 0,
        take: params.take || 50,
      }),
      prisma.vendorComplianceCheck.count({ where }),
    ]);

    return {
      checks,
      total,
      hasMore: (params.skip || 0) + checks.length < total,
    };
  }

  /**
   * Get upcoming follow-ups
   */
  async getUpcomingFollowUps(params: {
    organizationId: string;
    daysAhead?: number;
  }) {
    const daysAhead = params.daysAhead || 7;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysAhead);

    return await prisma.vendorComplianceCheck.findMany({
      where: {
        organizationId: params.organizationId,
        followUpRequired: true,
        followUpCompleted: false,
        followUpDate: {
          lte: followUpDate,
        },
      },
      include: {
        vendor: true,
      },
      orderBy: { followUpDate: "asc" },
    });
  }

  /**
   * Get compliance statistics
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
      where.checkDate = {};
      if (params.startDate) where.checkDate.gte = params.startDate;
      if (params.endDate) where.checkDate.lte = params.endDate;
    }

    const checks = await prisma.vendorComplianceCheck.findMany({
      where,
      select: {
        complianceRate: true,
        overallResult: true,
        violationCount: true,
        criticalViolations: true,
        majorViolations: true,
        minorViolations: true,
        penaltyAmount: true,
        checkType: true,
      },
    });

    const avgComplianceRate =
      checks.length > 0
        ? checks.reduce((sum, c) => sum + Number(c.complianceRate), 0) /
          checks.length
        : 0;

    const totalPenalties = checks.reduce(
      (sum, c) => sum + Number(c.penaltyAmount || 0),
      0,
    );
    const totalViolations = checks.reduce(
      (sum, c) => sum + c.violationCount,
      0,
    );

    const byResult = checks.reduce(
      (acc, c) => {
        acc[c.overallResult] = (acc[c.overallResult] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byType = checks.reduce(
      (acc, c) => {
        acc[c.checkType] = (acc[c.checkType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalChecks: checks.length,
      avgComplianceRate: Math.round(avgComplianceRate * 100) / 100,
      totalViolations,
      criticalViolations: checks.reduce(
        (sum, c) => sum + c.criticalViolations,
        0,
      ),
      majorViolations: checks.reduce((sum, c) => sum + c.majorViolations, 0),
      minorViolations: checks.reduce((sum, c) => sum + c.minorViolations, 0),
      totalPenalties,
      passRate: ((byResult["PASSED"] || 0) / Math.max(checks.length, 1)) * 100,
      byResult,
      byType,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async generateCheckNumber(organizationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const count = await prisma.vendorComplianceCheck.count({
      where: { organizationId },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `VC-${year}${month}-${sequence}`;
  }
}

export const vendorComplianceService = new VendorComplianceService();
export default vendorComplianceService;
