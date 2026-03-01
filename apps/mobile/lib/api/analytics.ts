import { apiClient } from "./client";

export interface KPICard {
  label: string;
  value: string | number;
  change?: number; // percentage change vs prior period
  trend?: "UP" | "DOWN" | "STABLE";
  unit?: string;
}

export interface DashboardData {
  role: string;
  kpis: KPICard[];
  charts?: Array<{
    type: "bar" | "line" | "pie";
    title: string;
    data: Array<{ label: string; value: number }>;
  }>;
  alerts?: Array<{
    id: string;
    message: string;
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  }>;
  period: string;
}

export interface WarehouseMetrics {
  pickRate: number; // units per hour
  pickAccuracy: number; // %
  receiveRate: number;
  shipRate: number;
  utilizationRate: number; // space usage %
  activeWorkers: number;
  ordersToday: number;
  linesPickedToday: number;
}

export interface FinancialMetrics {
  revenueThisMonth: number;
  outstandingInvoices: number;
  overdueAmount: number;
  cashCollectedThisMonth: number;
  grossMargin: number;
  topProducts: Array<{ name: string; revenue: number }>;
}

// GET /api/dashboards/role — role-adaptive dashboard
export async function getRoleDashboard(role?: string) {
  const { data } = await apiClient.get("/api/dashboards/role", {
    params: { role },
  });
  return data as DashboardData;
}

// GET /api/metrics/warehouse
export async function getWarehouseMetrics(warehouseId?: string) {
  const { data } = await apiClient.get("/api/metrics/warehouse", {
    params: { warehouseId },
  });
  return data as WarehouseMetrics;
}

// GET /api/metrics/picker — picker-specific KPIs for current user
export async function getPickerMetrics() {
  const { data } = await apiClient.get("/api/metrics/picker");
  return data as {
    picksToday: number;
    picksThisWeek: number;
    accuracy: number;
    avgPickSpeed: number; // items/hour
    rank?: number;
    rankTotal?: number;
    streak?: number; // days with zero errors
  };
}

// GET /api/reporting/financial
export async function getFinancialMetrics(period = "month") {
  const { data } = await apiClient.get("/api/reporting/financial", {
    params: { period },
  });
  return data as FinancialMetrics;
}

// GET /api/analytics/inventory
export async function getInventoryAnalytics() {
  const { data } = await apiClient.get("/api/analytics/inventory");
  return data as {
    totalSKUs: number;
    totalValue: number;
    turnoverRate: number;
    deadStockCount: number;
    lowStockCount: number;
    overStockCount: number;
    topMovers: Array<{ sku: string; name: string; velocity: number }>;
  };
}

// GET /api/labor/performance — labor/workforce performance
export async function getLaborPerformance(params?: {
  period?: string;
  warehouseId?: string;
}) {
  const { data } = await apiClient.get("/api/labor/performance", { params });
  return data as {
    workers: Array<{
      id: string;
      name: string;
      role: string;
      picksToday: number;
      accuracy: number;
      hoursWorked: number;
    }>;
  };
}
