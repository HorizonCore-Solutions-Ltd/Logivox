/**
 * Risk Management Service
 * Implements ISO 9001:2015 risk-based thinking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RiskAssessment {
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
}

export interface RiskHeatmapData {
  category: string;
  risks: Array<{
    id: string;
    title: string;
    severity: number;
    occurrence: number;
    rpn: number;
  }>;
}

export class RiskService {
  /**
   * Calculate Risk Priority Number (RPN)
   */
  static calculateRPN(severity: number, occurrence: number, detection: number): number {
    return severity * occurrence * detection;
  }

  /**
   * Get risk level based on RPN
   */
  static getRiskLevel(rpn: number): {
    level: string;
    color: string;
    action: string;
  } {
    if (rpn >= 200) {
      return {
        level: 'CRITICAL',
        color: 'red',
        action: 'Immediate action required. Stop process if necessary.'
      };
    } else if (rpn >= 125) {
      return {
        level: 'HIGH',
        color: 'orange',
        action: 'Priority mitigation required within 30 days.'
      };
    } else if (rpn >= 50) {
      return {
        level: 'MEDIUM',
        color: 'yellow',
        action: 'Mitigation recommended within 90 days.'
      };
    } else {
      return {
        level: 'LOW',
        color: 'green',
        action: 'Monitor and review periodically.'
      };
    }
  }

  /**
   * Create risk assessment
   */
  static async createRisk(data: {
    organizationId: string;
    title: string;
    description: string;
    category: string;
    processArea?: string;
    severity: number;
    occurrence: number;
    detection: number;
    owner: string;
    createdBy: string;
  }) {
    const rpn = this.calculateRPN(data.severity, data.occurrence, data.detection);

    const risk = await prisma.riskRegister.create({
      data: {
        riskNumber: `RISK-${Date.now()}`,
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        category: data.category as any,
        processArea: data.processArea,
        severity: data.severity,
        occurrence: data.occurrence,
        detection: data.detection,
        rpn,
        status: 'IDENTIFIED',
        owner: data.owner,
        createdBy: data.createdBy,
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    });

    return risk;
  }

  /**
   * Update risk with mitigation plan
   */
  static async updateMitigation(
    riskId: string,
    mitigationPlan: string,
    mitigationOwner: string,
    residualAssessment: RiskAssessment
  ) {
    const residualRPN = this.calculateRPN(
      residualAssessment.severity,
      residualAssessment.occurrence,
      residualAssessment.detection
    );

    return await prisma.riskRegister.update({
      where: { id: riskId },
      data: {
        mitigationPlan,
        mitigationOwner,
        residualSeverity: residualAssessment.severity,
        residualOccurrence: residualAssessment.occurrence,
        residualDetection: residualAssessment.detection,
        residualRPN,
        status: 'MITIGATION_PLANNED'
      }
    });
  }

  /**
   * Get risk heatmap data
   */
  static async getRiskHeatmap(organizationId: string): Promise<RiskHeatmapData[]> {
    const risks = await prisma.riskRegister.findMany({
      where: {
        organizationId,
        status: {
          not: 'CLOSED'
        }
      }
    });

    // Group by category
    const grouped: { [key: string]: any[] } = {};
    risks.forEach(risk => {
      if (!grouped[risk.category]) {
        grouped[risk.category] = [];
      }
      grouped[risk.category].push({
        id: risk.id,
        title: risk.title,
        severity: risk.severity,
        occurrence: risk.occurrence,
        rpn: risk.rpn
      });
    });

    return Object.keys(grouped).map(category => ({
      category,
      risks: grouped[category]
    }));
  }

  /**
   * Get high priority risks
   */
  static async getHighPriorityRisks(organizationId: string) {
    return await prisma.riskRegister.findMany({
      where: {
        organizationId,
        rpn: {
          gte: 125
        },
        status: {
          not: 'CLOSED'
        }
      },
      orderBy: {
        rpn: 'desc'
      }
    });
  }

  /**
   * Link risk to NCR
   */
  static async linkToNCR(riskId: string, ncrId: string) {
    const risk = await prisma.riskRegister.findUnique({
      where: { id: riskId }
    });

    if (!risk) throw new Error('Risk not found');

    const linkedNCRIds = [...risk.linkedNCRIds, ncrId];

    return await prisma.riskRegister.update({
      where: { id: riskId },
      data: { linkedNCRIds }
    });
  }

  /**
   * Link risk to CAPA
   */
  static async linkToCAPA(riskId: string, capaId: string) {
    const risk = await prisma.riskRegister.findUnique({
      where: { id: riskId }
    });

    if (!risk) throw new Error('Risk not found');

    const linkedCAPAIds = [...risk.linkedCAPAIds, capaId];

    return await prisma.riskRegister.update({
      where: { id: riskId },
      data: { linkedCAPAIds }
    });
  }

  /**
   * Get risks due for review
   */
  static async getRisksDueForReview() {
    return await prisma.riskRegister.findMany({
      where: {
        nextReviewDate: {
          lte: new Date()
        },
        status: {
          not: 'CLOSED'
        }
      },
      orderBy: {
        nextReviewDate: 'asc'
      }
    });
  }

  /**
   * Calculate risk reduction after mitigation
   */
  static calculateRiskReduction(initialRPN: number, residualRPN: number): {
    reduction: number;
    percentage: number;
  } {
    const reduction = initialRPN - residualRPN;
    const percentage = (reduction / initialRPN) * 100;

    return {
      reduction,
      percentage: Math.round(percentage)
    };
  }
}

export default RiskService;
