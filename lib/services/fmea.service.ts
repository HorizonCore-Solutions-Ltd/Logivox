/**
 * FMEA (Failure Mode and Effects Analysis) Service
 * Provides business logic for FMEA calculations and management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FMEARPNAssessment {
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Calculated
}

export interface FMEAReductionAnalysis {
  initialRPN: number;
  residualRPN: number;
  reduction: number;
  reductionPercentage: number;
  riskLevel: string;
}

export class FMEAService {
  /**
   * Calculate Risk Priority Number (RPN)
   */
  static calculateRPN(severity: number, occurrence: number, detection: number): number {
    if (severity < 1 || severity > 10) throw new Error('Severity must be 1-10');
    if (occurrence < 1 || occurrence > 10) throw new Error('Occurrence must be 1-10');
    if (detection < 1 || detection > 10) throw new Error('Detection must be 1-10');
    
    return severity * occurrence * detection;
  }

  /**
   * Get RPN risk level and recommended action
   */
  static getRPNLevel(rpn: number): {
    level: string;
    priority: string;
    color: string;
    action: string;
  } {
    if (rpn >= 200) {
      return {
        level: 'CRITICAL',
        priority: 'P1',
        color: 'red',
        action: 'Immediate action required. Process may need to be stopped.'
      };
    } else if (rpn >= 125) {
      return {
        level: 'HIGH',
        priority: 'P2',
        color: 'orange',
        action: 'Priority action required within 30 days.'
      };
    } else if (rpn >= 50) {
      return {
        level: 'MEDIUM',
        priority: 'P3',
        color: 'yellow',
        action: 'Action recommended within 90 days.'
      };
    } else {
      return {
        level: 'LOW',
        priority: 'P4',
        color: 'green',
        action: 'Monitor and review during regular cycles.'
      };
    }
  }

  /**
   * Calculate RPN reduction after mitigation
   */
  static calculateRPNReduction(
    initialRPN: number,
    residualRPN: number
  ): FMEAReductionAnalysis {
    const reduction = initialRPN - residualRPN;
    const reductionPercentage = (reduction / initialRPN) * 100;
    const riskLevel = this.getRPNLevel(residualRPN).level;

    return {
      initialRPN,
      residualRPN,
      reduction,
      reductionPercentage: Math.round(reductionPercentage * 10) / 10,
      riskLevel
    };
  }

  /**
   * Get FMEA completion status
   */
  static async getFMEAStatus(fmeaId: string) {
    const fmea = await prisma.fMEA.findUnique({
      where: { id: fmeaId },
      include: {
        failureModes: true
      }
    });

    if (!fmea) throw new Error('FMEA not found');

    const totalModes = fmea.failureModes.length;
    const openModes = fmea.failureModes.filter(fm => fm.status === 'OPEN').length;
    const mitigatedModes = fmea.failureModes.filter(fm => fm.residualRPN !== null).length;
    const closedModes = fmea.failureModes.filter(fm => fm.status === 'CLOSED').length;

    const averageRPN = totalModes > 0
      ? fmea.failureModes.reduce((sum, fm) => sum + fm.rpn, 0) / totalModes
      : 0;

    const modesWithResidualRPN = fmea.failureModes.filter(fm => fm.residualRPN !== null);
    const averageResidualRPN = modesWithResidualRPN.length > 0
      ? modesWithResidualRPN.reduce((sum, fm) => sum + (fm.residualRPN || 0), 0) / modesWithResidualRPN.length
      : null;

    const completionPercentage = totalModes > 0
      ? ((mitigatedModes + closedModes) / totalModes) * 100
      : 0;

    return {
      fmeaId: fmea.id,
      fmeaNumber: fmea.fmeaNumber,
      title: fmea.title,
      totalFailureModes: totalModes,
      openModes,
      mitigatedModes,
      closedModes,
      averageRPN: Math.round(averageRPN),
      averageResidualRPN: averageResidualRPN ? Math.round(averageResidualRPN) : null,
      completionPercentage: Math.round(completionPercentage),
      status: fmea.status
    };
  }

  /**
   * Get high-risk failure modes across all FMEAs
   */
  static async getHighRiskFailureModes(organizationId: string) {
    const fmeas = await prisma.fMEA.findMany({
      where: {
        organizationId,
        status: {
          in: ['IN_PROGRESS', 'UNDER_REVIEW']
        }
      },
      include: {
        failureModes: {
          where: {
            rpn: {
              gte: 125 // High and Critical
            },
            status: {
              not: 'CLOSED'
            }
          },
          orderBy: {
            rpn: 'desc'
          }
        }
      }
    });

    const highRiskModes = fmeas.flatMap(fmea => 
      fmea.failureModes.map(fm => ({
        ...fm,
        fmeaNumber: fmea.fmeaNumber,
        fmeaTitle: fmea.title,
        riskLevel: this.getRPNLevel(fm.rpn)
      }))
    );

    return highRiskModes;
  }

  /**
   * Get failure modes due for review/action
   */
  static async getFailureModesDueForAction() {
    const now = new Date();

    const overdueFailureModes = await prisma.fMEAFailureMode.findMany({
      where: {
        targetDate: {
          lte: now
        },
        status: {
          in: ['OPEN', 'ACTION_IN_PROGRESS']
        }
      },
      include: {
        fmea: {
          select: {
            fmeaNumber: true,
            title: true
          }
        }
      },
      orderBy: {
        rpn: 'desc'
      }
    });

    return overdueFailureModes.map(fm => ({
      ...fm,
      fmeaNumber: fm.fmea.fmeaNumber,
      fmeaTitle: fm.fmea.title,
      daysOverdue: Math.floor((now.getTime() - fm.targetDate!.getTime()) / (1000 * 60 * 60 * 24)),
      riskLevel: this.getRPNLevel(fm.rpn)
    }));
  }

  /**
   * Get FMEA analytics for dashboard
   */
  static async getFMEAAnalytics(organizationId: string) {
    const fmeas = await prisma.fMEA.findMany({
      where: { organizationId },
      include: {
        failureModes: true
      }
    });

    const totalFMEAs = fmeas.length;
    const activeFMEAs = fmeas.filter(f => f.status === 'IN_PROGRESS').length;
    const completedFMEAs = fmeas.filter(f => f.status === 'COMPLETED').length;

    const allFailureModes = fmeas.flatMap(f => f.failureModes);
    const totalFailureModes = allFailureModes.length;
    
    const criticalModes = allFailureModes.filter(fm => fm.rpn >= 200).length;
    const highModes = allFailureModes.filter(fm => fm.rpn >= 125 && fm.rpn < 200).length;
    const mediumModes = allFailureModes.filter(fm => fm.rpn >= 50 && fm.rpn < 125).length;
    const lowModes = allFailureModes.filter(fm => fm.rpn < 50).length;

    const mitigatedModes = allFailureModes.filter(fm => fm.residualRPN !== null);
    const totalRPNReduction = mitigatedModes.reduce((sum, fm) => {
      return sum + (fm.rpn - (fm.residualRPN || fm.rpn));
    }, 0);

    const averageRPNReduction = mitigatedModes.length > 0
      ? totalRPNReduction / mitigatedModes.length
      : 0;

    return {
      totalFMEAs,
      activeFMEAs,
      completedFMEAs,
      totalFailureModes,
      failureModesByRisk: {
        critical: criticalModes,
        high: highModes,
        medium: mediumModes,
        low: lowModes
      },
      mitigatedModes: mitigatedModes.length,
      averageRPNReduction: Math.round(averageRPNReduction)
    };
  }

  /**
   * Link failure mode to CAPA
   */
  static async linkFailureModeToCAPAAsync(failureModeId: string, capaId: string) {
    const failureMode = await prisma.fMEAFailureMode.findUnique({
      where: { id: failureModeId }
    });

    if (!failureMode) throw new Error('Failure mode not found');

    let linkedCAPAIds: string[] = [];
    
    // Parse existing linkedCAPAIds if it's a JSON string
    if (failureMode.linkedCAPAIds) {
      try {
        linkedCAPAIds = typeof failureMode.linkedCAPAIds === 'string' 
          ? JSON.parse(failureMode.linkedCAPAIds)
          : failureMode.linkedCAPAIds;
      } catch (e) {
        linkedCAPAIds = [];
      }
    }

    if (!linkedCAPAIds.includes(capaId)) {
      linkedCAPAIds.push(capaId);
    }

    return await prisma.fMEAFailureMode.update({
      where: { id: failureModeId },
      data: {
        linkedCAPAIds: linkedCAPAIds
      }
    });
  }

  /**
   * Get severity rating guidance
   */
  static getSeverityGuidance(): { rating: number; description: string }[] {
    return [
      { rating: 10, description: 'Hazardous without warning - May endanger operator/user' },
      { rating: 9, description: 'Hazardous with warning - Serious consequences' },
      { rating: 8, description: 'Very high - Product/item inoperable with loss of primary function' },
      { rating: 7, description: 'High - Product/item operable with significant degradation' },
      { rating: 6, description: 'Moderate - Product/item operable with some degradation' },
      { rating: 5, description: 'Low - Fit and finish/squeak and rattle item does not conform' },
      { rating: 4, description: 'Very low - Fit and finish/squeak and rattle item hardly noticeable' },
      { rating: 3, description: 'Minor - Fit and finish/squeak and rattle item noticeable' },
      { rating: 2, description: 'Very minor - Fit and finish/squeak and rattle item noticeable to discriminating customers' },
      { rating: 1, description: 'None - No effect' }
    ];
  }

  /**
   * Get occurrence rating guidance
   */
  static getOccurrenceGuidance(): { rating: number; description: string; probability: string }[] {
    return [
      { rating: 10, description: 'Very high: Failure is almost inevitable', probability: '≥ 1 in 2' },
      { rating: 9, description: 'Very high: Repeated failures', probability: '1 in 3' },
      { rating: 8, description: 'High: Frequent failures', probability: '1 in 8' },
      { rating: 7, description: 'High: Frequent failures', probability: '1 in 20' },
      { rating: 6, description: 'Moderate: Occasional failures', probability: '1 in 80' },
      { rating: 5, description: 'Moderate: Occasional failures', probability: '1 in 400' },
      { rating: 4, description: 'Low: Relatively few failures', probability: '1 in 2,000' },
      { rating: 3, description: 'Low: Relatively few failures', probability: '1 in 15,000' },
      { rating: 2, description: 'Remote: Failure is unlikely', probability: '1 in 150,000' },
      { rating: 1, description: 'Remote: Failure is unlikely', probability: '< 1 in 1,500,000' }
    ];
  }

  /**
   * Get detection rating guidance
   */
  static getDetectionGuidance(): { rating: number; description: string }[] {
    return [
      { rating: 10, description: 'Absolute uncertainty - Cannot detect or is not checked' },
      { rating: 9, description: 'Very remote - Controls probably will not detect' },
      { rating: 8, description: 'Remote - Controls have poor chance of detection' },
      { rating: 7, description: 'Very low - Controls have low chance of detection' },
      { rating: 6, description: 'Low - Controls may detect' },
      { rating: 5, description: 'Moderate - Controls may detect' },
      { rating: 4, description: 'Moderately high - Controls have good chance to detect' },
      { rating: 3, description: 'High - Controls have high chance to detect' },
      { rating: 2, description: 'Very high - Controls almost certain to detect' },
      { rating: 1, description: 'Almost certain - Controls will detect' }
    ];
  }
}

export default FMEAService;
