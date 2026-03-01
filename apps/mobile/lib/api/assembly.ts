import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssemblyOrder {
  id: string;
  orderNumber: string;
  status:
    | "DRAFT"
    | "PLANNED"
    | "PICKING"
    | "ASSEMBLING"
    | "QC_HOLD"
    | "COMPLETED"
    | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  assemblyItemSku: string;
  assemblyItemName: string;
  quantity: number;
  completedQuantity: number;
  bomId: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

export interface BOMLine {
  id: string;
  componentSku: string;
  componentName: string;
  componentLocationCode?: string;
  requiredQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  pickedQuantity: number;
  status: "PENDING" | "ALLOCATED" | "PICKED" | "CONSUMED" | "SHORT";
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getAssemblyOrders(params?: {
  status?: string;
  priority?: string;
}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v != null)
    ) as Record<string, string>
  ).toString();
  return apiClient<{ orders: AssemblyOrder[]; total: number }>(
    `/api/assembly-orders${qs ? `?${qs}` : ""}`
  );
}

export function getAssemblyOrder(id: string) {
  return apiClient<AssemblyOrder & { bomLines: BOMLine[] }>(
    `/api/assembly-orders/${id}`
  );
}

export function startAssemblyOrder(id: string) {
  return apiClient<AssemblyOrder>(`/api/assembly-orders/${id}`, {
    method: "PATCH",
    data: { action: "start" },
  });
}

export function pickBOMComponent(
  orderId: string,
  lineId: string,
  quantity: number
) {
  return apiClient<BOMLine>(`/api/assembly-orders/${orderId}/pick`, {
    method: "POST",
    data: { lineId, quantity },
  });
}

export function completeAssemblyOrder(
  id: string,
  completedQuantity: number,
  notes?: string
) {
  return apiClient<AssemblyOrder>(`/api/assembly-orders/${id}`, {
    method: "PATCH",
    data: { action: "complete", completedQuantity, notes },
  });
}

export function cancelAssemblyOrder(id: string, reason?: string) {
  return apiClient<AssemblyOrder>(`/api/assembly-orders/${id}`, {
    method: "PATCH",
    data: { action: "cancel", reason },
  });
}
