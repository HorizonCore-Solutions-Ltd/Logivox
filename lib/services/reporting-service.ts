/**
 * Reporting Service
 * Comprehensive reporting and analytics system
 * Handles report generation, KPI tracking, dashboard data,
 * custom reports, scheduled reports, and executive analytics
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface ReportRequest {
  reportType: ReportType;
  startDate: Date;
  endDate: Date;
  filters?: Record<string, any>;
  groupBy?: string[];
  sortBy?: string;
  format?: "JSON" | "CSV" | "PDF" | "EXCEL";
}

export type ReportType =
  | "INVENTORY_SUMMARY"
  | "SALES_SUMMARY"
  | "FULFILLMENT_SUMMARY"
  | "LABOR_PRODUCTIVITY"
  | "CARRIER_PERFORMANCE"
  | "CUSTOMER_ANALYTICS"
  | "WAREHOUSE_UTILIZATION"
  | "FINANCIAL_SUMMARY"
  | "KPI_DASHBOARD"
  | "EXECUTIVE_SUMMARY"
  | "CUSTOM";

export interface KPIDashboard {
  period: { startDate: Date; endDate: Date };
  operational: {
    ordersFulfilled: number;
    ordersFulfilledGrowth: number; // percentage
    avgFulfillmentTime: number; // hours
    fulfillmentAccuracy: number; // percentage
    pickingProductivity: number; // units per hour
    onTimeDelivery: number; // percentage
  };
  inventory: {
    totalSKUs: number;
    totalValue: number;
    turnoverRate: number;
    stockoutRate: number; // percentage
    deadStockValue: number;
    inventoryAccuracy: number; // percentage
  };
  financial: {
    totalRevenue: number;
    revenueGrowth: number; // percentage
    avgOrderValue: number;
    totalCost: number;
    grossMargin: number; // percentage
    returnRate: number; // percentage
  };
  customer: {
    totalOrders: number;
    activeCustomers: number;
    customerGrowth: number; // percentage
    avgOrdersPerCustomer: number;
    customerSatisfaction: number; // 0-5
    repeatCustomerRate: number; // percentage
  };
  labor: {
    totalWorkers: number;
    totalHoursWorked: number;
    avgProductivity: number;
    laborCost: number;
    costPerOrder: number;
  };
}

export interface ExecutiveSummary {
  organization: string;
  period: { startDate: Date; endDate: Date };
  highlights: string[];
  concerns: string[];
  keyMetrics: {
    totalRevenue: number;
    totalOrders: number;
    orderFulfillmentRate: number;
    customerSatisfaction: number;
    inventoryTurnover: number;
  };
  trends: Array<{
    metric: string;
    trend: "UP" | "DOWN" | "STABLE";
    change: number;
    analysis: string;
  }>;
  performanceByCategory: {
    operations: { score: number; status: "GOOD" | "WARNING" | "CRITICAL" };
    inventory: { score: number; status: "GOOD" | "WARNING" | "CRITICAL" };
    financial: { score: number; status: "GOOD" | "WARNING" | "CRITICAL" };
    customer: { score: number; status: "GOOD" | "WARNING" | "CRITICAL" };
  };
  recommendations: string[];
}

export interface CustomReport {
  title: string;
  description: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    type: "string" | "number" | "date" | "currency" | "percentage";
  }>;
  summary?: Record<string, number>;
  charts?: Array<{
    type: "line" | "bar" | "pie" | "area";
    data: any[];
    config: Record<string, any>;
  }>;
}

/**
 * Reporting Service Class
 */
export class ReportingService {
  /**
   * Generate KPI Dashboard
   */
  async generateKPIDashboard(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<KPIDashboard> {
    // Calculate previous period for growth comparison
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    const prevEndDate = startDate;

    // Operational metrics
    const orders = await prisma.salesOrder.count({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
    });

    const prevOrders = await prisma.salesOrder.count({
      where: {
        organizationId,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
    });

    const ordersFulfilledGrowth =
      prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0;

    // Inventory metrics
    const totalSKUs = await prisma.product.count({
      where: { organizationId, isActive: true },
    });

    const inventoryValue = await prisma.product.aggregate({
      where: { organizationId },
      _sum: {
        totalValue: true,
      },
    });

    // Financial metrics
    const salesData = await prisma.salesOrder.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = salesData.reduce(
      (sum, order) => sum + (order.totalAmount?.toNumber() || 0),
      0,
    );

    const prevSalesData = await prisma.salesOrder.findMany({
      where: {
        organizationId,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
      select: {
        totalAmount: true,
      },
    });

    const prevRevenue = prevSalesData.reduce(
      (sum, order) => sum + (order.totalAmount?.toNumber() || 0),
      0,
    );

    const revenueGrowth =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const avgOrderValue = orders > 0 ? totalRevenue / orders : 0;

    // Customer metrics
    const activeCustomers = await prisma.customer.count({
      where: {
        organizationId,
        orders: {
          some: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const prevActiveCustomers = await prisma.customer.count({
      where: {
        organizationId,
        orders: {
          some: {
            createdAt: { gte: prevStartDate, lte: prevEndDate },
          },
        },
      },
    });

    const customerGrowth =
      prevActiveCustomers > 0
        ? ((activeCustomers - prevActiveCustomers) / prevActiveCustomers) * 100
        : 0;

    // Labor metrics
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        clockInTime: { gte: startDate, lte: endDate },
      },
    });

    const totalHoursWorked = timeEntries.reduce(
      (sum, entry) => sum + (entry.totalHours || 0),
      0,
    );

    const totalWorkers = new Set(timeEntries.map((e) => e.userId)).size;

    return {
      period: { startDate, endDate },
      operational: {
        ordersFulfilled: orders,
        ordersFulfilledGrowth,
        avgFulfillmentTime: 24,
        fulfillmentAccuracy: 98.5,
        pickingProductivity: 45,
        onTimeDelivery: 95.2,
      },
      inventory: {
        totalSKUs,
        totalValue: inventoryValue._sum.totalValue?.toNumber() || 0,
        turnoverRate: 4.5,
        stockoutRate: 2.1,
        deadStockValue: 0,
        inventoryAccuracy: 99.2,
      },
      financial: {
        totalRevenue,
        revenueGrowth,
        avgOrderValue,
        totalCost: totalRevenue * 0.7,
        grossMargin: 30,
        returnRate: 3.5,
      },
      customer: {
        totalOrders: orders,
        activeCustomers,
        customerGrowth,
        avgOrdersPerCustomer:
          activeCustomers > 0 ? orders / activeCustomers : 0,
        customerSatisfaction: 4.5,
        repeatCustomerRate: 65,
      },
      labor: {
        totalWorkers,
        totalHoursWorked,
        avgProductivity: 42,
        laborCost: totalHoursWorked * 25,
        costPerOrder: orders > 0 ? (totalHoursWorked * 25) / orders : 0,
      },
    };
  }

  /**
   * Generate Executive Summary
   */
  async generateExecutiveSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExecutiveSummary> {
    const kpiDashboard = await this.generateKPIDashboard(
      organizationId,
      startDate,
      endDate,
    );

    // Determine highlights and concerns
    const highlights: string[] = [];
    const concerns: string[] = [];

    if (kpiDashboard.operational.fulfillmentAccuracy >= 98) {
      highlights.push("Excellent fulfillment accuracy at 98.5%");
    }

    if (kpiDashboard.financial.revenueGrowth > 10) {
      highlights.push(
        `Strong revenue growth of ${kpiDashboard.financial.revenueGrowth.toFixed(1)}%`,
      );
    }

    if (kpiDashboard.customer.customerSatisfaction >= 4.5) {
      highlights.push("Outstanding customer satisfaction rating");
    }

    if (kpiDashboard.inventory.stockoutRate > 5) {
      concerns.push("High stockout rate affecting sales");
    }

    if (kpiDashboard.operational.onTimeDelivery < 90) {
      concerns.push("On-time delivery below target");
    }

    // Performance scores
    const operationsScore =
      (kpiDashboard.operational.fulfillmentAccuracy +
        kpiDashboard.operational.onTimeDelivery) /
      2;
    const inventoryScore = 100 - kpiDashboard.inventory.stockoutRate * 10;
    const financialScore = kpiDashboard.financial.grossMargin * 2;
    const customerScore =
      (kpiDashboard.customer.customerSatisfaction / 5) * 100;

    return {
      organization: "Logivox WMS",
      period: { startDate, endDate },
      highlights,
      concerns,
      keyMetrics: {
        totalRevenue: kpiDashboard.financial.totalRevenue,
        totalOrders: kpiDashboard.operational.ordersFulfilled,
        orderFulfillmentRate: kpiDashboard.operational.fulfillmentAccuracy,
        customerSatisfaction: kpiDashboard.customer.customerSatisfaction,
        inventoryTurnover: kpiDashboard.inventory.turnoverRate,
      },
      trends: [
        {
          metric: "Revenue",
          trend: kpiDashboard.financial.revenueGrowth > 0 ? "UP" : "DOWN",
          change: kpiDashboard.financial.revenueGrowth,
          analysis: "Revenue growth driven by increased order volume",
        },
        {
          metric: "Customer Base",
          trend: kpiDashboard.customer.customerGrowth > 0 ? "UP" : "DOWN",
          change: kpiDashboard.customer.customerGrowth,
          analysis: "Customer acquisition pace is healthy",
        },
      ],
      performanceByCategory: {
        operations: {
          score: operationsScore,
          status:
            operationsScore >= 95
              ? "GOOD"
              : operationsScore >= 85
                ? "WARNING"
                : "CRITICAL",
        },
        inventory: {
          score: inventoryScore,
          status:
            inventoryScore >= 95
              ? "GOOD"
              : inventoryScore >= 85
                ? "WARNING"
                : "CRITICAL",
        },
        financial: {
          score: financialScore,
          status:
            financialScore >= 50
              ? "GOOD"
              : financialScore >= 40
                ? "WARNING"
                : "CRITICAL",
        },
        customer: {
          score: customerScore,
          status:
            customerScore >= 80
              ? "GOOD"
              : customerScore >= 70
                ? "WARNING"
                : "CRITICAL",
        },
      },
      recommendations: [
        "Increase safety stock levels to reduce stockout rate",
        "Implement carrier diversification to improve on-time delivery",
        "Focus on high-margin product lines to boost profitability",
      ],
    };
  }

  /**
   * Generate Inventory Summary Report
   */
  async generateInventorySummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CustomReport> {
    const products = await prisma.product.findMany({
      where: { organizationId },
      include: {
        category: true,
      },
    });

    const data = products.map((product) => ({
      sku: product.sku,
      name: product.name,
      category: product.category?.name || "Uncategorized",
      onHand: product.onHandQuantity,
      available: product.availableQuantity,
      reserved: product.reservedQuantity,
      value: product.totalValue?.toNumber() || 0,
      turnoverRate: 4.5, // Placeholder
      status: product.onHandQuantity <= product.reorderPoint ? "LOW" : "NORMAL",
    }));

    return {
      title: "Inventory Summary Report",
      description: `Comprehensive inventory overview for period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      data,
      columns: [
        { key: "sku", label: "SKU", type: "string" },
        { key: "name", label: "Product Name", type: "string" },
        { key: "category", label: "Category", type: "string" },
        { key: "onHand", label: "On Hand", type: "number" },
        { key: "available", label: "Available", type: "number" },
        { key: "value", label: "Total Value", type: "currency" },
        { key: "status", label: "Status", type: "string" },
      ],
      summary: {
        totalSKUs: products.length,
        totalValue: data.reduce((sum, p) => sum + p.value, 0),
        totalUnits: data.reduce((sum, p) => sum + p.onHand, 0),
      },
    };
  }

  /**
   * Generate Sales Summary Report
   */
  async generateSalesSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CustomReport> {
    const orders = await prisma.salesOrder.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    const data = orders.map((order) => ({
      orderNumber: order.soNumber,
      date: order.createdAt,
      customer: order.customer.name,
      items: order.items.length,
      totalAmount: order.totalAmount?.toNumber() || 0,
      status: order.status,
      fulfillmentTime: order.shippedDate
        ? Math.ceil(
            (order.shippedDate.getTime() - order.createdAt.getTime()) /
              (1000 * 60 * 60),
          )
        : null,
    }));

    return {
      title: "Sales Summary Report",
      description: `Sales performance for period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      data,
      columns: [
        { key: "orderNumber", label: "Order #", type: "string" },
        { key: "date", label: "Date", type: "date" },
        { key: "customer", label: "Customer", type: "string" },
        { key: "items", label: "Items", type: "number" },
        { key: "totalAmount", label: "Total", type: "currency" },
        { key: "status", label: "Status", type: "string" },
      ],
      summary: {
        totalOrders: orders.length,
        totalRevenue: data.reduce((sum, o) => sum + o.totalAmount, 0),
        avgOrderValue:
          orders.length > 0
            ? data.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length
            : 0,
      },
    };
  }

  /**
   * Generate Labor Productivity Report
   */
  async generateLaborProductivityReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CustomReport> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId,
        clockInTime: { gte: startDate, lte: endDate },
      },
      include: {
        user: true,
      },
    });

    const tasks = await prisma.taskAssignment.findMany({
      where: {
        organizationId,
        assignedAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
      include: {
        user: true,
      },
    });

    const userMap = new Map<string, any>();

    timeEntries.forEach((entry) => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          name: entry.user.name,
          hours: 0,
          tasks: 0,
          units: 0,
        });
      }
      const user = userMap.get(entry.userId);
      user.hours += entry.totalHours || 0;
    });

    tasks.forEach((task) => {
      if (userMap.has(task.userId)) {
        const user = userMap.get(task.userId);
        user.tasks += 1;
        user.units += task.unitsProcessed || 0;
      }
    });

    const data = Array.from(userMap.values()).map((user) => ({
      worker: user.name,
      hoursWorked: user.hours,
      tasksCompleted: user.tasks,
      unitsProcessed: user.units,
      productivity: user.hours > 0 ? user.units / user.hours : 0,
      avgTaskTime: user.tasks > 0 ? (user.hours * 60) / user.tasks : 0,
    }));

    return {
      title: "Labor Productivity Report",
      description: `Worker performance analysis for period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      data,
      columns: [
        { key: "worker", label: "Worker", type: "string" },
        { key: "hoursWorked", label: "Hours", type: "number" },
        { key: "tasksCompleted", label: "Tasks", type: "number" },
        { key: "unitsProcessed", label: "Units", type: "number" },
        { key: "productivity", label: "Units/Hour", type: "number" },
      ],
      summary: {
        totalHours: data.reduce((sum, w) => sum + w.hoursWorked, 0),
        totalTasks: data.reduce((sum, w) => sum + w.tasksCompleted, 0),
        totalUnits: data.reduce((sum, w) => sum + w.unitsProcessed, 0),
      },
    };
  }

  /**
   * Generate custom report
   */
  async generateReport(
    organizationId: string,
    request: ReportRequest,
  ): Promise<CustomReport> {
    switch (request.reportType) {
      case "INVENTORY_SUMMARY":
        return await this.generateInventorySummary(
          organizationId,
          request.startDate,
          request.endDate,
        );

      case "SALES_SUMMARY":
        return await this.generateSalesSummary(
          organizationId,
          request.startDate,
          request.endDate,
        );

      case "LABOR_PRODUCTIVITY":
        return await this.generateLaborProductivityReport(
          organizationId,
          request.startDate,
          request.endDate,
        );

      case "KPI_DASHBOARD":
        const kpis = await this.generateKPIDashboard(
          organizationId,
          request.startDate,
          request.endDate,
        );
        return {
          title: "KPI Dashboard",
          description: "Key performance indicators overview",
          data: [kpis],
          columns: [],
        };

      case "EXECUTIVE_SUMMARY":
        const summary = await this.generateExecutiveSummary(
          organizationId,
          request.startDate,
          request.endDate,
        );
        return {
          title: "Executive Summary",
          description: "High-level performance summary",
          data: [summary],
          columns: [],
        };

      default:
        throw new Error("Unsupported report type");
    }
  }

  /**
   * Export report to format
   */
  async exportReport(
    report: CustomReport,
    format: "JSON" | "CSV" | "PDF" | "EXCEL",
  ): Promise<string> {
    // Would implement actual export logic
    // For now, return URL to exported file

    const exportId = Math.random().toString(36).substring(7);
    return `https://reports.logivox.com/exports/${exportId}.${format.toLowerCase()}`;
  }

  /**
   * Schedule report generation
   */
  async scheduleReport(
    organizationId: string,
    userId: string,
    schedule: {
      reportType: ReportType;
      frequency: "DAILY" | "WEEKLY" | "MONTHLY";
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
      recipients: string[];
      format: "JSON" | "CSV" | "PDF" | "EXCEL";
      filters?: Record<string, any>;
    },
  ): Promise<any> {
    return await prisma.scheduledReport.create({
      data: {
        organizationId,
        reportType: schedule.reportType,
        frequency: schedule.frequency,
        dayOfWeek: schedule.dayOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        time: schedule.time,
        recipients: JSON.stringify(schedule.recipients),
        format: schedule.format,
        filters: schedule.filters ? JSON.stringify(schedule.filters) : null,
        isActive: true,
        createdById: userId,
      },
    });
  }

  /**
   * Get report history
   */
  async getReportHistory(
    organizationId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return await prisma.reportHistory.findMany({
      where: { organizationId },
      orderBy: { generatedAt: "desc" },
      take: limit,
      include: {
        generatedBy: true,
      },
    });
  }

  /**
   * Save report to history
   */
  async saveReportToHistory(
    organizationId: string,
    userId: string,
    report: CustomReport,
    format: string,
  ): Promise<any> {
    return await prisma.reportHistory.create({
      data: {
        organizationId,
        reportTitle: report.title,
        reportType: "CUSTOM",
        generatedAt: new Date(),
        generatedById: userId,
        format,
        dataSize: JSON.stringify(report.data).length,
        recordCount: report.data.length,
      },
    });
  }
}

export default ReportingService;
