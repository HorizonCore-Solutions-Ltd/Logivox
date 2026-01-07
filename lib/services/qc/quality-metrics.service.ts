/**
 * Real-time Quality Metrics Service
 * Live Quality Performance Tracking and Alerting
 * Aggregates data from all QA modules for real-time insights
 */

import { prisma } from '@/lib/prisma';

export class QualityMetricsService {
  /**
   * Get real-time quality dashboard metrics
   */
  static async getRealTimeMetrics(params: {
    organizationId: string;
    timeRange?: 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  }) {
    const timeRange = params.timeRange || 'TODAY';
    const { startDate, endDate } = this.getTimeRange(timeRange);

    // NCR Metrics
    const ncrStats = await prisma.nonConformanceReport.aggregate({
      where: {
        organizationId: params.organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const openNCRs = await prisma.nonConformanceReport.count({
      where: {
        organizationId: params.organizationId,
        status: { in: ['OPEN', 'INVESTIGATION', 'CONTAINMENT'] },
      },
    });

    // CAPA Metrics
    const capaStats = await prisma.correctivePreventiveAction.aggregate({
      where: {
        organizationId: params.organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const overdueCapas = await prisma.correctivePreventiveAction.count({
      where: {
        organizationId: params.organizationId,
        status: { not: 'CLOSED' },
        targetCompletionDate: { lt: new Date() },
      },
    });

    // Quality Holds
    const activeHolds = await prisma.qualityHold.count({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
      },
    });

    const holdValue = await prisma.qualityHold.aggregate({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
      },
      _sum: { estimatedValue: true },
    });

    // Customer Complaints
    const complaints = await prisma.customerComplaint.aggregate({
      where: {
        organizationId: params.organizationId,
        receivedDate: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const openComplaints = await prisma.customerComplaint.count({
      where: {
        organizationId: params.organizationId,
        status: { in: ['OPEN', 'INVESTIGATION'] },
      },
    });

    // MRB Reviews
    const mrbStats = await prisma.materialReviewBoard.aggregate({
      where: {
        organizationId: params.organizationId,
        submittedDate: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const pendingMRB = await prisma.materialReviewBoard.count({
      where: {
        organizationId: params.organizationId,
        status: { in: ['PENDING_REVIEW', 'SCHEDULED'] },
      },
    });

    // Audits
    const upcomingAudits = await prisma.audit.count({
      where: {
        organizationId: params.organizationId,
        scheduledDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    });

    // Calibration Due
    const calibrationDue = await prisma.calibrationEquipment.count({
      where: {
        organizationId: params.organizationId,
        nextCalibrationDue: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
        status: { not: 'RETIRED' },
      },
    });

    // Training Expiring
    const trainingExpiring = await prisma.trainingRecord.count({
      where: {
        requirement: { organizationId: params.organizationId },
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Next 60 days
        },
      },
    });

    return {
      timestamp: new Date(),
      timeRange,
      nonConformances: {
        total: ncrStats._count,
        open: openNCRs,
        percentOpen: (openNCRs / (ncrStats._count || 1)) * 100,
      },
      correctiveActions: {
        total: capaStats._count,
        overdue: overdueCapas,
        onTimePerformance: ((capaStats._count - overdueCapas) / (capaStats._count || 1)) * 100,
      },
      qualityHolds: {
        active: activeHolds,
        totalValue: holdValue._sum.estimatedValue || 0,
      },
      customerComplaints: {
        total: complaints._count,
        open: openComplaints,
        responseRate: ((complaints._count - openComplaints) / (complaints._count || 1)) * 100,
      },
      materialReview: {
        total: mrbStats._count,
        pending: pendingMRB,
      },
      upcoming: {
        audits: upcomingAudits,
        calibrations: calibrationDue,
        trainingExpirations: trainingExpiring,
      },
    };
  }

  /**
   * Get quality trend analysis
   */
  static async getTrendAnalysis(params: {
    organizationId: string;
    metric: 'NCR' | 'CAPA' | 'COMPLAINTS' | 'MRB' | 'HOLDS';
    periods: number; // Number of periods to analyze
    periodType: 'DAY' | 'WEEK' | 'MONTH';
  }) {
    const trends: any[] = [];
    const now = new Date();

    for (let i = 0; i < params.periods; i++) {
      const { startDate, endDate } = this.getPeriodRange(
        now,
        i,
        params.periodType
      );

      let count = 0;
      
      switch (params.metric) {
        case 'NCR':
          count = await prisma.nonConformanceReport.count({
            where: {
              organizationId: params.organizationId,
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;
        case 'CAPA':
          count = await prisma.correctivePreventiveAction.count({
            where: {
              organizationId: params.organizationId,
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;
        case 'COMPLAINTS':
          count = await prisma.customerComplaint.count({
            where: {
              organizationId: params.organizationId,
              receivedDate: { gte: startDate, lte: endDate },
            },
          });
          break;
        case 'MRB':
          count = await prisma.materialReviewBoard.count({
            where: {
              organizationId: params.organizationId,
              submittedDate: { gte: startDate, lte: endDate },
            },
          });
          break;
        case 'HOLDS':
          count = await prisma.qualityHold.count({
            where: {
              organizationId: params.organizationId,
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;
      }

      trends.unshift({
        period: this.formatPeriod(startDate, params.periodType),
        startDate,
        endDate,
        count,
      });
    }

    // Calculate trend direction
    const recentAvg = trends.slice(-3).reduce((sum, t) => sum + t.count, 0) / 3;
    const olderAvg = trends.slice(0, 3).reduce((sum, t) => sum + t.count, 0) / 3;
    const trendDirection = recentAvg > olderAvg ? 'INCREASING' : recentAvg < olderAvg ? 'DECREASING' : 'STABLE';
    const trendPercentage = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100;

    return {
      metric: params.metric,
      periodType: params.periodType,
      trends,
      analysis: {
        trendDirection,
        trendPercentage: Math.round(trendPercentage),
        recentAverage: Math.round(recentAvg),
        olderAverage: Math.round(olderAvg),
      },
    };
  }

  /**
   * Get quality alerts requiring attention
   */
  static async getQualityAlerts(params: {
    organizationId: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    const alerts: any[] = [];

    // Critical overdue CAPAs
    const overdueCAPAs = await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId: params.organizationId,
        status: { not: 'CLOSED' },
        targetCompletionDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // >7 days overdue
      },
      take: 10,
    });

    overdueCAPAs.forEach(capa => {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(capa.targetCompletionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        type: 'OVERDUE_CAPA',
        severity: daysOverdue > 30 ? 'CRITICAL' : 'HIGH',
        title: `CAPA ${capa.capaNumber} Overdue`,
        description: `${daysOverdue} days past target completion date`,
        actionRequired: 'Update CAPA status or extend deadline',
        link: `/qc/capa/${capa.id}`,
        daysOverdue,
      });
    });

    // Reportable customer complaints
    const reportableComplaints = await prisma.customerComplaint.count({
      where: {
        organizationId: params.organizationId,
        isReportable: true,
        status: { not: 'CLOSED' },
      },
    });

    if (reportableComplaints > 0) {
      alerts.push({
        type: 'REPORTABLE_COMPLAINTS',
        severity: 'CRITICAL',
        title: `${reportableComplaints} Reportable Complaints`,
        description: 'Customer complaints requiring regulatory reporting',
        actionRequired: 'Review and file regulatory reports',
        link: '/qc/complaints',
        count: reportableComplaints,
      });
    }

    // Overdue calibrations
    const overdueCalibrations = await prisma.calibrationEquipment.count({
      where: {
        organizationId: params.organizationId,
        nextCalibrationDue: { lt: new Date() },
        status: { not: 'RETIRED' },
        criticalEquipment: true,
      },
    });

    if (overdueCalibrations > 0) {
      alerts.push({
        type: 'OVERDUE_CALIBRATION',
        severity: 'HIGH',
        title: `${overdueCalibrations} Critical Equipment Overdue`,
        description: 'Critical equipment past calibration due date',
        actionRequired: 'Remove from service and schedule calibration',
        link: '/qc/calibration',
        count: overdueCalibrations,
      });
    }

    // Pending MRB reviews
    const urgentMRB = await prisma.materialReviewBoard.count({
      where: {
        organizationId: params.organizationId,
        status: 'PENDING_REVIEW',
        urgency: 'CRITICAL',
        customerImpact: true,
      },
    });

    if (urgentMRB > 0) {
      alerts.push({
        type: 'URGENT_MRB',
        severity: 'HIGH',
        title: `${urgentMRB} Urgent MRB Reviews`,
        description: 'Critical material reviews with customer impact',
        actionRequired: 'Schedule immediate MRB meeting',
        link: '/qc/mrb',
        count: urgentMRB,
      });
    }

    // Filter by severity if specified
    if (params.severity) {
      return alerts.filter(a => a.severity === params.severity);
    }

    return alerts.sort((a, b) => {
      const severityOrder: any = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get quality performance score
   */
  static async getQualityScore(params: {
    organizationId: string;
  }) {
    const metrics = await this.getRealTimeMetrics({
      organizationId: params.organizationId,
      timeRange: 'MONTH',
    });

    // Calculate weighted score (0-100)
    let score = 100;

    // Penalty for open NCRs (up to -20 points)
    score -= Math.min(metrics.nonConformances.percentOpen * 0.2, 20);

    // Penalty for overdue CAPAs (up to -25 points)
    const capaOnTime = metrics.correctiveActions.onTimePerformance;
    score -= Math.min((100 - capaOnTime) * 0.25, 25);

    // Penalty for open complaints (up to -20 points)
    const complaintResponse = metrics.customerComplaints.responseRate;
    score -= Math.min((100 - complaintResponse) * 0.2, 20);

    // Penalty for active holds (up to -15 points)
    if (metrics.qualityHolds.active > 0) {
      score -= Math.min(metrics.qualityHolds.active * 2, 15);
    }

    // Penalty for pending MRB (up to -10 points)
    if (metrics.materialReview.pending > 0) {
      score -= Math.min(metrics.materialReview.pending * 2, 10);
    }

    // Penalty for overdue items (up to -10 points)
    const overdueItems =
      metrics.upcoming.calibrations +
      (metrics.upcoming.trainingExpirations > 0 ? 1 : 0);
    score -= Math.min(overdueItems * 2, 10);

    return {
      score: Math.max(Math.round(score), 0),
      grade: this.getGrade(score),
      metrics,
      recommendations: this.getRecommendations(score, metrics),
    };
  }

  /**
   * Helper: Get time range
   */
  private static getTimeRange(range: string): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'TODAY':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'WEEK':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'MONTH':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'QUARTER':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'YEAR':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Helper: Get period range
   */
  private static getPeriodRange(
    baseDate: Date,
    periodsAgo: number,
    periodType: string
  ): { startDate: Date; endDate: Date } {
    const endDate = new Date(baseDate);
    const startDate = new Date(baseDate);

    switch (periodType) {
      case 'DAY':
        startDate.setDate(startDate.getDate() - periodsAgo - 1);
        endDate.setDate(endDate.getDate() - periodsAgo);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'WEEK':
        startDate.setDate(startDate.getDate() - (periodsAgo + 1) * 7);
        endDate.setDate(endDate.getDate() - periodsAgo * 7);
        break;
      case 'MONTH':
        startDate.setMonth(startDate.getMonth() - periodsAgo - 1);
        endDate.setMonth(endDate.getMonth() - periodsAgo);
        startDate.setDate(1);
        endDate.setDate(0); // Last day of previous month
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Helper: Format period
   */
  private static formatPeriod(date: Date, periodType: string): string {
    switch (periodType) {
      case 'DAY':
        return date.toLocaleDateString();
      case 'WEEK':
        return `Week of ${date.toLocaleDateString()}`;
      case 'MONTH':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Helper: Get quality grade
   */
  private static getGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Helper: Get improvement recommendations
   */
  private static getRecommendations(score: number, metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.nonConformances.percentOpen > 30) {
      recommendations.push(
        'High percentage of open NCRs - prioritize investigation and closure'
      );
    }

    if (metrics.correctiveActions.onTimePerformance < 80) {
      recommendations.push(
        'CAPA on-time performance below target - review resource allocation'
      );
    }

    if (metrics.customerComplaints.responseRate < 90) {
      recommendations.push(
        'Improve customer complaint response time to maintain satisfaction'
      );
    }

    if (metrics.qualityHolds.active > 5) {
      recommendations.push(
        'Reduce active quality holds through faster disposition decisions'
      );
    }

    if (metrics.upcoming.calibrations > 10) {
      recommendations.push(
        'Schedule calibrations in advance to prevent equipment downtime'
      );
    }

    return recommendations;
  }
}
