/**
 * Corrective and Preventive Action (CAPA) Service
 * Enterprise-grade CAPA management with formal workflow and verification
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type CAPAType = "CORRECTIVE" | "PREVENTIVE" | "BOTH";
export type CAPAStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ACTIONS_IMPLEMENTED"
  | "VERIFICATION_PENDING"
  | "VERIFIED"
  | "CLOSED"
  | "CANCELLED";
export type RootCauseMethod =
  | "5_WHYS"
  | "FISHBONE"
  | "FAULT_TREE"
  | "PARETO"
  | "FMEA";

export class CAPAService {
  /**
   * Generate next CAPA number
   */
  private static async generateCAPANumber(
    organizationId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    const lastCAPA = await prisma.correctivePreventiveAction.findFirst({
      where: {
        organizationId,
        capaNumber: {
          startsWith: `CAPA-${year}${month}`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastCAPA) {
      const lastSequence = parseInt(
        lastCAPA.capaNumber.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `CAPA-${year}${month}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Calculate Risk Priority Number (RPN)
   */
  private static calculateRPN(
    severity: number,
    occurrence: number,
    detection: number,
  ): number {
    return severity * occurrence * detection;
  }

  /**
   * Create new CAPA
   */
  static async createCAPA(params: {
    organizationId: string;
    capaType: CAPAType;
    actionCategory: string;
    sourceType: string;
    sourceId?: string;
    ncrId?: string;
    problemStatement: string;
    problemSeverity: string;
    rootCauseMethod: RootCauseMethod;
    rootCauseAnalysis: any;
    rootCause: string;
    contributingFactors?: any[];
    riskSeverity?: number;
    riskOccurrence?: number;
    riskDetection?: number;
    immediateActions: any[];
    correctiveActions: any[];
    preventiveActions: any[];
    responsiblePerson: string;
    departmentResponsible?: string;
    targetCompletionDate: Date;
    correctiveActionsOwner?: string;
    correctiveTargetDate?: Date;
    preventiveActionsOwner?: string;
    preventiveTargetDate?: Date;
    verificationMethod?: string;
    verificationCriteria?: string;
    managementReviewRequired?: boolean;
    priority?: string;
    createdBy: string;
  }) {
    const capaNumber = await this.generateCAPANumber(params.organizationId);

    // Calculate RPN if risk values provided
    let riskPriority: number | undefined;
    if (params.riskSeverity && params.riskOccurrence && params.riskDetection) {
      riskPriority = this.calculateRPN(
        params.riskSeverity,
        params.riskOccurrence,
        params.riskDetection,
      );
    }

    const capa = await prisma.correctivePreventiveAction.create({
      data: {
        capaNumber,
        organizationId: params.organizationId,
        capaType: params.capaType,
        actionCategory: params.actionCategory,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        ncrId: params.ncrId,
        problemStatement: params.problemStatement,
        problemSeverity: params.problemSeverity,
        rootCauseMethod: params.rootCauseMethod,
        rootCauseAnalysis: params.rootCauseAnalysis,
        rootCause: params.rootCause,
        contributingFactors: params.contributingFactors || [],
        riskSeverity: params.riskSeverity,
        riskOccurrence: params.riskOccurrence,
        riskDetection: params.riskDetection,
        riskPriority,
        immediateActions: params.immediateActions,
        correctiveActions: params.correctiveActions,
        preventiveActions: params.preventiveActions,
        responsiblePerson: params.responsiblePerson,
        departmentResponsible: params.departmentResponsible,
        targetCompletionDate: params.targetCompletionDate,
        correctiveActionsOwner: params.correctiveActionsOwner,
        correctiveTargetDate: params.correctiveTargetDate,
        preventiveActionsOwner: params.preventiveActionsOwner,
        preventiveTargetDate: params.preventiveTargetDate,
        verificationMethod: params.verificationMethod,
        verificationCriteria: params.verificationCriteria,
        managementReviewRequired: params.managementReviewRequired || false,
        priority: params.priority || "MEDIUM",
        createdBy: params.createdBy,
      },
      include: {
        ncr: true,
      },
    });

    return capa;
  }

  /**
   * Update CAPA status
   */
  static async updateStatus(capaId: string, status: CAPAStatus) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: { status },
    });
  }

  /**
   * Complete containment actions
   */
  static async completeContainment(capaId: string) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        containmentComplete: true,
        containmentDate: new Date(),
      },
    });
  }

  /**
   * Complete corrective actions
   */
  static async completeCorrectiveActions(capaId: string) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        correctiveCompletedDate: new Date(),
        status: "ACTIONS_IMPLEMENTED",
      },
    });
  }

  /**
   * Complete preventive actions
   */
  static async completePreventiveActions(capaId: string) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        preventiveCompletedDate: new Date(),
      },
    });
  }

  /**
   * Verify CAPA effectiveness
   */
  static async verifyCAPI(params: {
    capaId: string;
    verificationPerformedBy: string;
    verificationPassed: boolean;
    effectivenessScore?: number;
    effectivenessNotes?: string;
  }) {
    const data: any = {
      verificationDate: new Date(),
      verificationPerformedBy: params.verificationPerformedBy,
      verificationPassed: params.verificationPassed,
      effectivenessScore: params.effectivenessScore,
      effectivenessNotes: params.effectivenessNotes,
    };

    if (params.verificationPassed) {
      data.status = "VERIFIED";
      data.effectivenessCheckDate = new Date();
    } else {
      data.status = "IN_PROGRESS"; // Back to in progress if failed
    }

    return await prisma.correctivePreventiveAction.update({
      where: { id: params.capaId },
      data,
    });
  }

  /**
   * Management review
   */
  static async managementReview(params: {
    capaId: string;
    managementReviewedBy: string;
    managementApproval: string;
    managementComments?: string;
  }) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: params.capaId },
      data: {
        managementReviewDate: new Date(),
        managementReviewedBy: params.managementReviewedBy,
        managementApproval: params.managementApproval,
        managementComments: params.managementComments,
      },
    });
  }

  /**
   * Close CAPA
   */
  static async closeCAPI(params: {
    capaId: string;
    closedBy: string;
    closureApprovedBy?: string;
  }) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: params.capaId },
      data: {
        status: "CLOSED",
        closedDate: new Date(),
        closedBy: params.closedBy,
        closureApproved: true,
        closureApprovedBy: params.closureApprovedBy,
        closureApprovedDate: new Date(),
      },
    });
  }

  /**
   * Mark training complete
   */
  static async completeTraining(capaId: string) {
    return await prisma.correctivePreventiveAction.update({
      where: { id: capaId },
      data: {
        trainingCompleted: true,
        trainingCompletedDate: new Date(),
      },
    });
  }

  /**
   * Get CAPA by ID
   */
  static async getCAPIById(capaId: string) {
    return await prisma.correctivePreventiveAction.findUnique({
      where: { id: capaId },
      include: {
        ncr: true,
      },
    });
  }

  /**
   * List CAPAs with filters
   */
  static async listCAPAs(
    organizationId: string,
    filters: {
      status?: CAPAStatus;
      capaType?: CAPAType;
      priority?: string;
      responsiblePerson?: string;
      overdue?: boolean;
    } = {},
  ) {
    const where: any = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.capaType) where.capaType = filters.capaType;
    if (filters.priority) where.priority = filters.priority;
    if (filters.responsiblePerson)
      where.responsiblePerson = filters.responsiblePerson;

    if (filters.overdue) {
      where.targetCompletionDate = { lt: new Date() };
      where.status = { not: "CLOSED" };
    }

    return await prisma.correctivePreventiveAction.findMany({
      where,
      include: {
        ncr: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get CAPA statistics
   */
  static async getCAPAStats(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const capas = await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const totalCAPAs = capas.length;
    const openCAPAs = capas.filter((c) => c.status === "OPEN").length;
    const inProgressCAPAs = capas.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const completedCAPAs = capas.filter((c) => c.status === "CLOSED").length;

    const now = new Date();
    const overdueCAPAs = capas.filter(
      (c) => c.targetCompletionDate < now && c.status !== "CLOSED",
    ).length;

    const verifiedCAPAs = capas.filter((c) => c.verificationPassed === true);
    const avgEffectiveness =
      verifiedCAPAs.length > 0
        ? verifiedCAPAs.reduce(
            (sum, c) => sum + (c.effectivenessScore || 0),
            0,
          ) / verifiedCAPAs.length
        : 0;

    const avgCompletionDays = this.calculateAvgCompletionDays(capas);

    return {
      totalCAPAs,
      openCAPAs,
      inProgressCAPAs,
      completedCAPAs,
      overdueCAPAs,
      avgEffectiveness: Math.round(avgEffectiveness),
      avgCompletionDays,
      completionRate: totalCAPAs > 0 ? (completedCAPAs / totalCAPAs) * 100 : 0,
    };
  }

  /**
   * Calculate average completion days
   */
  private static calculateAvgCompletionDays(capas: any[]): number {
    const completed = capas.filter(
      (c) => c.status === "CLOSED" && c.closedDate,
    );

    if (completed.length === 0) return 0;

    const totalDays = completed.reduce((sum, capa) => {
      const days = Math.floor(
        (capa.closedDate.getTime() - capa.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / completed.length);
  }

  /**
   * Get overdue CAPAs
   */
  static async getOverdueCAPAs(organizationId: string) {
    return await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId,
        targetCompletionDate: { lt: new Date() },
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
      include: {
        ncr: true,
      },
      orderBy: { targetCompletionDate: "asc" },
    });
  }
}
