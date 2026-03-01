import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GateEntry {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  vehicleNumber: string;
  trailerNumber?: string;
  driverName?: string;
  carrierName?: string;
  status: "PENDING" | "CHECKED_IN" | "ON_SITE" | "CHECKED_OUT";
  appointmentNumber?: string;
  appointmentType?: string;
  scheduledStart?: string;
  notes?: string;
  createdAt: string;
}

export interface YardLocation {
  id: string;
  name: string;
  zone: string;
  type: "DOCK" | "PARKING" | "STAGING" | "DROP_TRAILER" | "HAZMAT";
  isOccupied: boolean;
  currentVehicleNumber?: string;
  currentTrailerNumber?: string;
  appointmentId?: string;
}

export interface ShunterTask {
  id: string;
  taskType: "SPOT" | "PULL" | "RELOCATE";
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  vehicleNumber?: string;
  trailerNumber: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedTo?: string;
  appointmentNumber?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface GateSummary {
  inboundToday: number;
  outboundToday: number;
  onSite: number;
  pendingCheckIn: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getGateLog(direction?: "INBOUND" | "OUTBOUND") {
  const params = new URLSearchParams();
  if (direction) params.set("direction", direction);
  return apiClient<{ entries: GateEntry[]; summary: GateSummary }>(
    `/api/yard/gate-log?${params}`
  ).then((res) => res.data);
}

export function createGateEntry(data: {
  direction: "INBOUND" | "OUTBOUND";
  vehicleNumber: string;
  trailerNumber?: string;
  driverName?: string;
  carrierName?: string;
  appointmentId?: string;
  notes?: string;
}) {
  return apiClient<GateEntry>("/api/yard/gate-log", {
    method: "POST",
    data: data,
  }).then((res) => res.data);
}

export function checkOutGateEntry(id: string, notes?: string) {
  return apiClient<GateEntry>(`/api/yard/gate-log/${id}/checkout`, {
    method: "POST",
    data: { notes },
  }).then((res) => res.data);
}

export function getYardLocations() {
  return apiClient<{ locations: YardLocation[] }>("/api/yard/shunter").then(
    (res) => res.data
  );
}

export function getShunterTasks() {
  return apiClient<{ tasks: ShunterTask[] }>("/api/yard/shunter").then(
    (res) => res.data
  );
}

export function acceptShunterTask(id: string) {
  return apiClient<ShunterTask>(`/api/yard/shunter/${id}/accept`, {
    method: "POST",
  }).then((res) => res.data);
}

export function completeShunterTask(id: string, notes?: string) {
  return apiClient<ShunterTask>(`/api/yard/shunter/${id}/complete`, {
    method: "POST",
    data: { notes },
  }).then((res) => res.data);
}

export function createShunterTask(data: {
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  trailerNumber: string;
  taskType: "SPOT" | "PULL" | "RELOCATE";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notes?: string;
  requirements?: string;
}) {
  return apiClient<ShunterTask>("/api/yard/shunter", {
    method: "POST",
    data,
  }).then((res) => res.data);
}
