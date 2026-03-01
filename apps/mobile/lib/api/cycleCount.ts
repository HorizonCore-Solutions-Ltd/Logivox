import { apiClient } from "./client";

export interface CycleCountLine {
  id: string;
  cycleCountId: string;
  sku: string;
  productName: string;
  location: string;
  expectedQty: number;
  countedQty?: number;
  variance?: number; // countedQty - expectedQty
  status: "PENDING" | "COUNTED" | "CONFIRMED";
  notes?: string;
}

export interface CycleCount {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  type: "FULL" | "PARTIAL" | "LOCATION" | "ABC";
  status: "SCHEDULED" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED" | "CANCELLED";
  assignedTo?: string;
  assignedToName?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  totalLines: number;
  countedLines: number;
  varianceCount: number;
  varianceValue?: number;
  lines?: CycleCountLine[];
  createdAt: string;
}

// GET /api/cycle-counts
export async function getCycleCounts(params?: {
  status?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await apiClient.get("/api/cycle-counts", { params });
  return data as { items: CycleCount[]; total: number; page: number; pageSize: number };
}

// GET /api/cycle-counts/:id
export async function getCycleCount(id: string) {
  const { data } = await apiClient.get(`/api/cycle-counts/${id}`);
  return data as CycleCount;
}

// POST /api/cycle-counts — create/start a new count
export async function createCycleCount(payload: {
  type: CycleCount["type"];
  locations?: string[];
  skus?: string[];
  scheduledDate?: string;
}) {
  const { data } = await apiClient.post("/api/cycle-counts", payload);
  return data as CycleCount;
}

// PUT /api/cycle-counts/:id/start
export async function startCycleCount(id: string) {
  const { data } = await apiClient.put(`/api/cycle-counts/${id}/start`);
  return data as CycleCount;
}

// PUT /api/cycle-counts/:id/lines/:lineId — record a count for a line
export async function recordCount(
  cycleCountId: string,
  lineId: string,
  payload: { countedQty: number; notes?: string }
) {
  const { data } = await apiClient.put(
    `/api/cycle-counts/${cycleCountId}/lines/${lineId}`,
    payload
  );
  return data as CycleCountLine;
}

// POST /api/cycle-counts/:id/submit — submit for review
export async function submitCycleCount(id: string, notes?: string) {
  const { data } = await apiClient.post(`/api/cycle-counts/${id}/submit`, { notes });
  return data as CycleCount;
}

// PUT /api/cycle-counts/:id/complete — manager approves
export async function completeCycleCount(id: string) {
  const { data } = await apiClient.put(`/api/cycle-counts/${id}/complete`);
  return data as CycleCount;
}

// POST /api/cycle-counts/:id/lines/:lineId/recount — flag for recount
export async function requestRecount(cycleCountId: string, lineId: string, reason: string) {
  const { data } = await apiClient.post(
    `/api/cycle-counts/${cycleCountId}/lines/${lineId}/recount`,
    { reason }
  );
  return data as CycleCountLine;
}
