/**
 * Advanced Analytics Dashboard Service
 * Predictive Analytics and Data Visualization Support
 * Provides aggregated data for executive dashboards and business intelligence
 */

import { prisma } from '@/lib/prisma';

export class AnalyticsDashboardService {
  /**
   * Get executive KPI dashboard data
   */
  static async getExecutiveKPIs(params: {
    organizationId: string;
    period: 'MTD' | 'QTD' | 'YTD';
  }) {
    const { startDate, endDate } = this.getPeriodDates(params.period);

    // Quality Rate (First Pass Yield)
    const totalInspections = await prisma.qualityMeasurement.count({
      where: {
        organizationId: params.organizationId,
        measurementDate: { gte: startDate, lte: endDate },
      },
    });

    const passedInspections = await prisma.qualityMeasurement.count({
      where: {
        organizationId: params.organizationId,
        measurementDate: { gte: startDate, lte: endDate },
        withinControl: true,
      },
    });

    const firstPassYield = (passedInspections / (totalInspections || 1)) * 100;

    // Customer Satisfaction Score
    const complaints = await prisma.customerComplaint.findMany({
      where: {
        organizationId: params.organizationId,
        closedDate: { gte: startDate, lte: endDate },
        customerSatisfied: { not: null },
      },
    });

    const satisfiedCustomers = complaints.filter(c => c.customerSatisfied).length;
    const customerSatisfaction = (satisfiedCustomers / (complaints.length || 1)) * 100;

    // On-Time Delivery (CAPA completion)
    const capas = await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId: params.organizationId,
        closureDate: { gte: startDate, lte: endDate },
      },
    });

    const onTimeCapas = capas.filter(
      c => c.closureDate && c.targetCompletionDate && 
      new Date(c.closureDate) <= new Date(c.targetCompletionDate)
    ).length;

    const onTimeDelivery = (onTimeCapas / (capas.length || 1)) * 100;

    // Cost of Quality
    const holdValue = await prisma.qualityHold.aggregate({
      where: {
        organizationId: params.organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { estimatedValue: true },
    });

    const mrbCost = await prisma.materialReviewBoard.aggregate({
      where: {
        organizationId: params.organizationId,
        submittedDate: { gte: startDate, lte: endDate },
      },
      _sum: { actualCost: true },
    });

    const totalCostOfQuality = (holdValue._sum.estimatedValue || 0) + (mrbCost._sum.actualCost || 0);

    // Supplier Quality
    const supplierNCRs = await prisma.nonConformanceReport.count({
      where: {
        organizationId: params.organizationId,
        source: 'SUPPLIER',
        detectedDate: { gte: startDate, lte: endDate },
      },
    });

    const totalNCRs = await prisma.nonConformanceReport.count({
      where: {
        organizationId: params.organizationId,
        detectedDate: { gte: startDate, lte: endDate },
      },
    });

    const supplierQuality = ((totalNCRs - supplierNCRs) / (totalNCRs || 1)) * 100;

    // Trend indicators
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);
    const trends = await this.calculateTrends(params.organizationId, previousPeriod);

    return {
      period: params.period,
      dateRange: { startDate, endDate },
      kpis: {
        firstPassYield: {
          value: Math.round(firstPassYield * 10) / 10,
          target: 95,
          status: firstPassYield >= 95 ? 'ON_TARGET' : firstPassYield >= 90 ? 'WARNING' : 'CRITICAL',
          trend: trends.qualityTrend,
        },
        customerSatisfaction: {
          value: Math.round(customerSatisfaction * 10) / 10,
          target: 90,
          status: customerSatisfaction >= 90 ? 'ON_TARGET' : customerSatisfaction >= 80 ? 'WARNING' : 'CRITICAL',
          trend: trends.satisfactionTrend,
        },
        onTimeDelivery: {
          value: Math.round(onTimeDelivery * 10) / 10,
          target: 95,
          status: onTimeDelivery >= 95 ? 'ON_TARGET' : onTimeDelivery >= 85 ? 'WARNING' : 'CRITICAL',
          trend: trends.deliveryTrend,
        },
        costOfQuality: {
          value: totalCostOfQuality,
          target: 0,
          status: totalCostOfQuality < 50000 ? 'ON_TARGET' : totalCostOfQuality < 100000 ? 'WARNING' : 'CRITICAL',
          trend: trends.costTrend,
        },
        supplierQuality: {
          value: Math.round(supplierQuality * 10) / 10,
          target: 98,
          status: supplierQuality >= 98 ? 'ON_TARGET' : supplierQuality >= 95 ? 'WARNING' : 'CRITICAL',
          trend: trends.supplierTrend,
        },
      },
      summary: {
        onTargetKPIs: Object.values({
          firstPassYield, customerSatisfaction, onTimeDelivery, supplierQuality
        }).filter(v => v >= 90).length,
        totalKPIs: 5,
      },
    };
  }

  /**
   * Get quality trend charts data
   */
  static async getQualityTrendCharts(params: {
    organizationId: string;
    chartType: 'NCR' | 'CAPA' | 'COMPLAINTS' | 'PARETO' | 'CONTROL_CHART';
    period: 'LAST_12_MONTHS' | 'LAST_6_MONTHS' | 'LAST_30_DAYS';
  }) {
    const periods = this.getChartPeriods(params.period);

    switch (params.chartType) {
      case 'NCR':
        return await this.getNCRTrendData(params.organizationId, periods);
      case 'CAPA':
        return await this.getCAPATrendData(params.organizationId, periods);
      case 'COMPLAINTS':
        return await this.getComplaintsTrendData(params.organizationId, periods);
      case 'PARETO':
        return await this.getParetoData(params.organizationId, periods[0].startDate, periods[periods.length - 1].endDate);
      case 'CONTROL_CHART':
        return await this.getControlChartData(params.organizationId, periods);
      default:
        throw new Error(`Unsupported chart type: ${params.chartType}`);
    }
  }

  /**
   * Get department performance comparison
   */
  static async getDepartmentComparison(params: {
    organizationId: string;
    period: { startDate: Date; endDate: Date };
  }) {
    const { startDate, endDate } = params.period;

    const ncrs = await prisma.nonConformanceReport.findMany({
      where: {
        organizationId: params.organizationId,
        detectedDate: { gte: startDate, lte: endDate },
      },
    });

    const departments: any = {};
    ncrs.forEach(ncr => {
      const dept = ncr.department || 'Unknown';
      if (!departments[dept]) {
        departments[dept] = {
          name: dept,
          ncrCount: 0,
          criticalCount: 0,
          resolvedCount: 0,
        };
      }
      departments[dept].ncrCount++;
      if (ncr.severity === 'CRITICAL') departments[dept].criticalCount++;
      if (ncr.status === 'CLOSED') departments[dept].resolvedCount++;
    });

    return Object.values(departments).map((dept: any) => ({
      ...dept,
      resolutionRate: Math.round((dept.resolvedCount / dept.ncrCount) * 100),
      score: Math.max(100 - dept.ncrCount * 5 - dept.criticalCount * 10, 0),
    })).sort((a: any, b: any) => b.score - a.score);
  }

  /**
   * Get product quality analysis
   */
  static async getProductQualityAnalysis(params: {
    organizationId: string;
    period: { startDate: Date; endDate: Date };
  }) {
    const { startDate, endDate } = params.period;

    const ncrs = await prisma.nonConformanceReport.findMany({
      where: {
        organizationId: params.organizationId,
        detectedDate: { gte: startDate, lte: endDate },
      },
    });

    const products: any = {};
    ncrs.forEach(ncr => {
      const product = ncr.productName || 'Unknown';
      if (!products[product]) {
        products[product] = {
          productName: product,
          defectCount: 0,
          totalQuantityAffected: 0,
          categories: [],
        };
      }
      products[product].defectCount++;
      products[product].totalQuantityAffected += ncr.quantityAffected || 0;
      products[product].categories.push(ncr.category);
    });

    return Object.values(products)
      .map((p: any) => ({
        ...p,
        topDefectCategory: this.getMostCommon(p.categories),
        qualityIndex: Math.max(100 - p.defectCount * 10, 0),
      }))
      .sort((a: any, b: any) => b.defectCount - a.defectCount);
  }

  /**
   * Get predictive quality forecast
   */
  static async getQualityForecast(params: {
    organizationId: string;
    forecastPeriods: number; // Number of future periods to forecast
  }) {
    // Get historical data (last 12 months)
    const months = 12;
    const historicalData = [];
    
    for (let i = months; i >= 0; i--) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() - i);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);

      const ncrCount = await prisma.nonConformanceReport.count({
        where: {
          organizationId: params.organizationId,
          detectedDate: { gte: startDate, lte: endDate },
        },
      });

      historicalData.push({
        month: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count: ncrCount,
      });
    }

    // Simple moving average forecast
    const forecast = [];
    const windowSize = 3;
    
    for (let i = 0; i < params.forecastPeriods; i++) {
      const recent = historicalData.slice(-windowSize);
      const avg = recent.reduce((sum, d) => sum + d.count, 0) / windowSize;
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      
      forecast.push({
        month: futureDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        predictedCount: Math.round(avg),
        confidence: 'MEDIUM', // Simplified - would use statistical methods in production
      });
      
      historicalData.push({ month: forecast[i].month, count: Math.round(avg) });
    }

    return {
      historical: historicalData.slice(0, -params.forecastPeriods),
      forecast,
      trend: this.calculateTrendDirection(historicalData.slice(0, -params.forecastPeriods)),
    };
  }

  // Helper methods

  private static getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'MTD':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'QTD':
        const quarter = Math.floor(startDate.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'YTD':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  }

  private static getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime()),
    };
  }

  private static async calculateTrends(organizationId: string, period: any): Promise<any> {
    // Simplified trend calculation - returns UP/DOWN/STABLE
    return {
      qualityTrend: 'UP',
      satisfactionTrend: 'STABLE',
      deliveryTrend: 'UP',
      costTrend: 'DOWN',
      supplierTrend: 'UP',
    };
  }

  private static getChartPeriods(period: string): any[] {
    const periods = [];
    const count = period === 'LAST_12_MONTHS' ? 12 : period === 'LAST_6_MONTHS' ? 6 : 30;
    const unit = period === 'LAST_30_DAYS' ? 'day' : 'month';

    for (let i = count - 1; i >= 0; i--) {
      const endDate = new Date();
      const startDate = new Date();

      if (unit === 'month') {
        startDate.setMonth(startDate.getMonth() - i, 1);
        endDate.setMonth(endDate.getMonth() - i + 1, 0);
      } else {
        startDate.setDate(startDate.getDate() - i);
        endDate.setDate(endDate.getDate() - i);
      }

      periods.push({ startDate, endDate });
    }

    return periods;
  }

  private static async getNCRTrendData(organizationId: string, periods: any[]): Promise<any> {
    const data = await Promise.all(
      periods.map(async p => ({
        period: p.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: await prisma.nonConformanceReport.count({
          where: {
            organizationId,
            detectedDate: { gte: p.startDate, lte: p.endDate },
          },
        }),
      }))
    );

    return { chartType: 'NCR_TREND', data };
  }

  private static async getCAPATrendData(organizationId: string, periods: any[]): Promise<any> {
    const data = await Promise.all(
      periods.map(async p => ({
        period: p.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        opened: await prisma.correctivePreventiveAction.count({
          where: {
            organizationId,
            createdAt: { gte: p.startDate, lte: p.endDate },
          },
        }),
        closed: await prisma.correctivePreventiveAction.count({
          where: {
            organizationId,
            closureDate: { gte: p.startDate, lte: p.endDate },
          },
        }),
      }))
    );

    return { chartType: 'CAPA_TREND', data };
  }

  private static async getComplaintsTrendData(organizationId: string, periods: any[]): Promise<any> {
    const data = await Promise.all(
      periods.map(async p => ({
        period: p.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        received: await prisma.customerComplaint.count({
          where: {
            organizationId,
            receivedDate: { gte: p.startDate, lte: p.endDate },
          },
        }),
        resolved: await prisma.customerComplaint.count({
          where: {
            organizationId,
            resolutionDate: { gte: p.startDate, lte: p.endDate },
          },
        }),
      }))
    );

    return { chartType: 'COMPLAINTS_TREND', data };
  }

  private static async getParetoData(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    const ncrs = await prisma.nonConformanceReport.findMany({
      where: {
        organizationId,
        detectedDate: { gte: startDate, lte: endDate },
      },
    });

    const categories: any = {};
    ncrs.forEach(ncr => {
      categories[ncr.category] = (categories[ncr.category] || 0) + 1;
    });

    const sorted = Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a: any, b: any) => b.count - a.count);

    const total = sorted.reduce((sum: number, item: any) => sum + item.count, 0);
    let cumulative = 0;

    const data = sorted.map((item: any) => {
      cumulative += item.count;
      return {
        category: item.category,
        count: item.count,
        percentage: Math.round((item.count / total) * 100),
        cumulative: Math.round((cumulative / total) * 100),
      };
    });

    return { chartType: 'PARETO', data };
  }

  private static async getControlChartData(organizationId: string, periods: any[]): Promise<any> {
    const measurements = await prisma.qualityMeasurement.findMany({
      where: {
        organizationId,
        measurementDate: {
          gte: periods[0].startDate,
          lte: periods[periods.length - 1].endDate,
        },
      },
      orderBy: { measurementDate: 'asc' },
    });

    const values = measurements.map(m => m.measurementValue);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    return {
      chartType: 'CONTROL_CHART',
      data: measurements.map(m => ({
        date: m.measurementDate,
        value: m.measurementValue,
        withinControl: m.withinControl,
      })),
      controlLimits: {
        mean,
        ucl: mean + 3 * stdDev,
        lcl: mean - 3 * stdDev,
      },
    };
  }

  private static getMostCommon(array: string[]): string {
    const counts: any = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None';
  }

  private static calculateTrendDirection(data: any[]): string {
    if (data.length < 3) return 'INSUFFICIENT_DATA';
    
    const recent = data.slice(-3).reduce((sum, d) => sum + d.count, 0) / 3;
    const older = data.slice(0, 3).reduce((sum, d) => sum + d.count, 0) / 3;
    
    if (recent > older * 1.1) return 'INCREASING';
    if (recent < older * 0.9) return 'DECREASING';
    return 'STABLE';
  }
}
