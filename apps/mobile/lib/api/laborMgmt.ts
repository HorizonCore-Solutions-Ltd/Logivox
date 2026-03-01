import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActiveWorker {
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  status: "ACTIVE" | "BREAK" | "IDLE" | "OFFLINE";
  currentTask?: string;
  currentLocation?: string;
  clockedInAt?: string;
  picksToday?: number;
  unitsToday?: number;
  throughput?: number; // units per hour
  standard?: number; // expected units per hour
  efficiencyPct?: number;
  overtime?: boolean;
}

export interface LaborDashboard {
  totalWorkers: number;
  activeWorkers: number;
  onBreak: number;
  idle: number;
  avgEfficiencyPct: number;
  totalUnitsToday: number;
  shiftsActive: number;
  overtimeHeadcount: number;
  departmentBreakdown: Array<{
    department: string;
    headcount: number;
    avgEfficiency: number;
  }>;
}

export interface HeatmapCell {
  zone: string;
  activityScore: number; // 0-100
  workerCount: number;
  throughput: number;
  congestionLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface LaborEmployee {
  id: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  hourlyRate?: number;
  status?: string;
  shiftsThisWeek?: number;
  avgEfficiencyPct?: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getLaborDashboard(warehouseId?: string) {
  const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
  return apiClient<LaborDashboard>(`/api/labor/dashboard${qs}`);
}

export function getActiveWorkers(warehouseId?: string) {
  const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
  return apiClient<{ workers: ActiveWorker[] }>(`/api/labor/employees${qs}`);
}

export function getFloorHeatmap(warehouseId?: string) {
  const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
  return apiClient<{ cells: HeatmapCell[] }>(`/api/labor/floor-heatmap${qs}`);
}

export function getLaborEmployee(id: string) {
  return apiClient<LaborEmployee>(`/api/labor/employees/${id}`);
}
