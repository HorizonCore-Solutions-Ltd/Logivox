import { apiClient } from "./client";

export interface DeliveryRun {
  id: string;
  runNumber: string;
  driverId: string;
  driverName: string;
  vehicleRegistration: string;
  date: string;
  totalStops: number;
  completedStops: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  startTime?: string;
  endTime?: string;
}

export interface DeliveryStop {
  id: string;
  runId: string;
  sequence: number; // 1, 2, 3...
  customerId: string;
  customerName: string;
  address: string;
  postcode: string;
  contactName?: string;
  contactPhone?: string;
  status: "PENDING" | "ARRIVED" | "DELIVERED" | "FAILED" | "OFF_ROUTE";
  arrivalTime?: string;
  completionTime?: string;
  failureReason?: string;
  itemsCount: number;
  specialInstructions?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryItem {
  id: string;
  stopId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitLabel: string;
  // Provenance from Marshalling
  trailerSection?: string; // FRONT/MID/REAR
  trailerLayer?: number;
  trailerPosition?: string;
  isHazardous?: boolean;
  type?: "DELIVERY" | "COLLECTION" | "RETURN";
  destinationLabel?: string; // e.g., "Return to Depot"
}

export type IncidentType = "DAMAGE" | "DELAY" | "BREAKDOWN" | "ACCIDENT" | "OTHER";

export interface IncidentReport {
  runId: string;
  stopId?: string; // Optional if general road incident
  type: IncidentType;
  description: string;
  photos: string[]; // Base64 or URLs
  reportedAt: string;
}

export interface ProofOfDelivery {
  recipientName: string;
  signatureBase64?: string; // or URL
  photoUrl?: string;
  notes?: string;
  deliveredAt: string;
  location?: { lat: number; lng: number };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export function reportIncident(report: IncidentReport) {
  return apiClient.post("/api/delivery/incident", report);
}

export function requestEmergencyAccess(code: string) {
  return apiClient.post<{ token: string; runId: string; user: any }>("/api/auth/emergency-login", { code });
}


// ─── API Functions ────────────────────────────────────────────────────────────

export function getMyRun(date?: string) {
  // Defaults to today for the logged-in driver
  const q = date ? `?date=${date}` : "";
  return apiClient<{ run: DeliveryRun | null; stops: DeliveryStop[] }>(
    `/api/delivery/my-run${q}`
  ).then((res) => res.data);
}

export function startRun(runId: string) {
  return apiClient<DeliveryRun>(`/api/delivery/runs/${runId}/start`, {
    method: "POST",
  }).then((res) => res.data);
}

export function confirmStopArrival(stopId: string) {
  return apiClient<DeliveryStop>(`/api/delivery/stops/${stopId}/arrive`, {
    method: "POST",
  }).then((res) => res.data);
}

export function getStopItems(stopId: string) {
  return apiClient<{ items: DeliveryItem[] }>(`/api/delivery/stops/${stopId}/items`).then((res) => res.data);
}

export function completeDelivery(
  stopId: string,
  pod: {
    recipientName: string;
    signature?: string; // base64
    photo?: string;     // base64
    notes?: string;
    location?: { lat: number; lng: number };
  }
) {
  return apiClient<DeliveryStop>(`/api/delivery/stops/${stopId}/complete`, {
    method: "POST",
    data: pod,
  }).then((res) => res.data);
}

export function failDelivery(stopId: string, reason: string, photo?: string) {
  return apiClient<DeliveryStop>(`/api/delivery/stops/${stopId}/fail`, {
    method: "POST",
    data: { reason, photo },
  }).then((res) => res.data);
}
