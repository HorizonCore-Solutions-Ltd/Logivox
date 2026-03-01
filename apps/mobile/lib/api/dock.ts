import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DockAppointment {
  id: string;
  appointmentNumber: string;
  appointmentType:
    | "INBOUND"
    | "OUTBOUND"
    | "CROSS_DOCK"
    | "MAINTENANCE"
    | "OTHER";
  status:
    | "SCHEDULED"
    | "CONFIRMED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "LOADING"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  trailerNumber?: string;
  sealNumber?: string;
  dockDoor?: string;
  yardLocationName?: string;
  expectedPallets?: number;
  expectedWeight?: number;
  referenceNumber?: string;
  checkedInAt?: string;
  completedAt?: string;
}

export interface StagingZone {
  id: string;
  name: string;
  zone: string;
  type: "STANDARD" | "REFRIGERATED" | "HAZMAT" | "OVERSIZED";
  capacity: number;
  currentItems: number;
  utilizationPct: number;
  shipmentId?: string;
  shipmentNumber?: string;
  status: "AVAILABLE" | "ALLOCATED" | "LOADING" | "READY" | "CLEARED";
  loadReadyAt?: string;
}

export interface DockStatus {
  totalDoors: number;
  activeDoors: number;
  inboundActive: number;
  outboundActive: number;
  appointmentsToday: number;
  pendingCheckIn: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getDockAppointments(params?: {
  appointmentType?: string;
  status?: string;
  date?: string;
}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiClient<{ appointments: DockAppointment[]; total: number }>(
    `/api/dock/appointments${qs ? `?${qs}` : ""}`,
  );
}

export function getDockAppointment(id: string) {
  return apiClient<DockAppointment>(`/api/dock/appointments/${id}`);
}

export function createDockAppointment(
  data: Partial<DockAppointment> & {
    appointmentType: DockAppointment["appointmentType"];
    scheduledDate: string;
    scheduledStart: string;
    scheduledEnd: string;
    duration: number;
  },
) {
  return apiClient<DockAppointment>("/api/dock/appointments", {
    method: "POST",
    data: data,
  });
}

export function checkInAppointment(
  id: string,
  data: {
    driverName?: string;
    vehicleNumber?: string;
    trailerNumber?: string;
    sealNumber?: string;
  },
) {
  return apiClient<DockAppointment>(`/api/dock/appointments/${id}/check-in`, {
    method: "POST",
    data: data,
  });
}

export function getDockStatus() {
  return apiClient<DockStatus>("/api/dock/status");
}

export function getStagingZones() {
  return apiClient<{ zones: StagingZone[] }>("/api/dock/staging");
}

export function allocateStagingZone(data: {
  shipmentId: string;
  estimatedItems: number;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  loadTime: string;
}) {
  return apiClient<StagingZone>("/api/dock/staging", {
    method: "POST",
    data: { action: "allocate_staging_zone", ...data },
  });
}

export function markLoadReady(shipmentId: string, verifiedBy: string) {
  return apiClient<StagingZone>("/api/dock/staging", {
    method: "POST",
    data: { action: "mark_load_ready", shipmentId, verifiedBy },
  });
}

export function getBOL(appointmentId: string) {
  return apiClient<{ url: string; bolNumber: string }>(
    `/api/dock/bol?appointmentId=${appointmentId}`,
  );
}
