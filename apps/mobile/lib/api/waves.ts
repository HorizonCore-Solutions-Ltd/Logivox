import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Wave {
  id: string;
  name: string;
  waveType:
    | "SINGLE_ORDER"
    | "BATCH"
    | "ZONE"
    | "CARRIER"
    | "PRIORITY"
    | "CUSTOM";
  status:
    | "DRAFT"
    | "PLANNED"
    | "RELEASED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  strategy:
    | "FIFO"
    | "LIFO"
    | "ZONE_BASED"
    | "CARRIER_BASED"
    | "SHIP_DATE"
    | "PRIORITY"
    | "SHORTEST_PATH"
    | "CUSTOM";
  totalOrders: number;
  totalLines: number;
  completedLines: number;
  assignedPickerCount: number;
  scheduledFor?: string;
  pickDeadline?: string;
  shipDate?: string;
  releasedAt?: string;
  completedAt?: string;
  targetLoadSheetId?: string;
  targetTrailerNumber?: string;
  estimatedVolume?: number;
  estimatedWeight?: number;
  exceedsTrailerCapacity?: boolean;
  createdAt: string;
}

export interface WaveAutomationRule {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: "SCHEDULE" | "ORDER_COUNT" | "VOLUME" | "MANUAL";
  triggerValue?: number;
  lastTriggeredAt?: string;
  waveTemplate: Partial<Wave>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getWaves(params?: {
  status?: string;
  priority?: string;
  waveType?: string;
}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v != null)
    ) as Record<string, string>
  ).toString();
  return apiClient<{ waves: Wave[]; total: number }>(
    `/api/waves${qs ? `?${qs}` : ""}`
  );
}

export function getWave(id: string) {
  return apiClient<Wave>(`/api/waves/${id}`);
}

export function createWave(data: {
  warehouseId: string;
  name: string;
  waveType: Wave["waveType"];
  priority?: Wave["priority"];
  strategy: Wave["strategy"];
  scheduledFor?: string;
  pickDeadline?: string;
  shipDate?: string;
  orderIds?: string[];
  maxOrders?: number;
  maxLines?: number;
  targetLoadSheetId?: string;
}) {
  return apiClient<Wave>("/api/waves", {
    method: "POST",
    data: data,
  });
}

export function releaseWave(id: string) {
  return apiClient<Wave>(`/api/waves/${id}`, {
    method: "PATCH",
    data: { action: "release" },
  });
}

export function cancelWave(id: string, reason?: string) {
  return apiClient<Wave>(`/api/waves/${id}`, {
    method: "PATCH",
    data: { action: "cancel", reason },
  });
}

export function getWaveLines(id: string) {
  return apiClient<{ lines: Array<{ id: string; orderId: string; sku: string; quantity: number; pickedQuantity: number; status: string }> }>(
    `/api/waves/${id}/lines`
  );
}

export function getWaveAutomationRules() {
  return apiClient<{ rules: WaveAutomationRule[] }>(
    "/api/waves/automation-rules"
  );
}

export function triggerWaveRule(ruleId: string) {
  return apiClient<{ message: string; waveId?: string }>(
    `/api/waves/automation-rules/${ruleId}/trigger`,
    { method: "POST" }
  );
}
