/**
 * Marshalling / Loading Team API
 *
 * Covers the full workflow:
 *  1. Bay assignment – which trailer is in which dock door
 *  2. Load sheets   – itemised list of what goes on the trailer
 *  3. Pick tasks    – admin distributes picks, pickers execute
 *  4. Box recording – tipper records each box as it arrives & is loaded
 *  5. Optimisation  – AI-suggested loading sequence inside the trailer
 */

import { apiClient } from "./client";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type LoadSheetStatus =
  | "BUILDING"
  | "READY"
  | "LOADING"
  | "LOADED"
  | "DISPATCHED"
  | "CANCELLED";

export type LoadSheetLineStatus =
  | "PENDING"
  | "PICKED"
  | "AT_BAY"
  | "LOADED"
  | "SHORT";

export type TrailerSection = "FRONT" | "MID" | "REAR" | "UNASSIGNED";

export type PickTaskStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AT_BAY"
  | "COMPLETED"
  | "SHORT_PICK"
  | "CANCELLED";

export type PickTaskType =
  | "PICK"
  | "PUT"
  | "MOVE"
  | "PACK"
  | "REPLENISH"
  | "CUSTOM";

export type BayStatus =
  | "EMPTY"
  | "INCOMING"
  | "SPOTTED"
  | "LOADING"
  | "SEALED"
  | "DEPARTING"
  | "OUT_OF_USE";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DockBay {
  id: string;
  doorNumber: string;
  status: BayStatus;
  trailerNumber?: string;
  loadSheetId?: string;
  loadSheetNumber?: string;
  carrierName?: string;
  driverName?: string;
  spottedAt?: string;
  /** Size/type of trailer required or currently parked */
  trailerType?: string;
  loadingStartedAt?: string;
  lastUpdatedAt: string;
}

export interface LoadSheet {
  id: string;
  loadSheetNumber: string;
  status: LoadSheetStatus;
  trailerNumber?: string;
  sealNumber?: string;
  bayDoorId?: string;
  bayDoor?: { id: string; doorNumber: string; status: string };
  driverName?: string;
  driverPhone?: string;
  carrierName?: string;
  carrierCode?: string;
  routeCode?: string;
  shipmentDate: string;
  customerName?: string;
  destinationAddress?: string;
  destinationBranch?: string;
  /** Org-configurable label for a unit/box (e.g. "Box", "Carton", "Tote", "Pallet"). Defaults to "Box". */
  unitLabel?: string;
  totalBoxes: number;
  totalPallets: number;
  totalStillage: number;
  totalWeight: number;
  maxWeightCapacity?: number;
  maxVolumeCapacity?: number;
  loadedVolume?: number;
  loadedBoxes: number;
  pendingBoxes: number;
  completionPct: number;
  generationMethod: string;
  loadingStartedBy?: string;
  loadingStartedAt?: string;
  loadingCompletedBy?: string;
  loadingCompletedAt?: string;
  safetyConfirmedBy?: string;
  verifiedBy?: string;
  dispatchedBy?: string;
  dispatchNotes?: string;
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoadSheetLine {
  id: string;
  loadSheetId: string;
  orderNumber?: string;
  sku: string;
  productName: string;
  barcode?: string;
  quantity: number;
  boxes: number;
  pallets: number;
  stillageType?: string; // "SUPPLIER_CAGE" | "PALLET" | "LOOSE" | "ROLL_CAGE"
  /** Number of units in org-defined unit (boxes / cartons / totes – matches LoadSheet.unitLabel). */
  unitCount?: number;
  weight?: number;
  volume?: number;
  status: LoadSheetLineStatus;
  loadSection: TrailerSection;
  loadLayer?: number;    // 1 = floor, 2 = second layer, etc.
  loadPosition?: string; // e.g. "LEFT-REAR-1"
  pickTaskId?: string;
  pickerName?: string;
  pickedAt?: string;
  arrivedAtBayAt?: string;
  loadedAt?: string;
  loadedBy?: string;
  notes?: string;
}

export interface PickTask {
  id: string;
  taskNumber: string;
  taskType: PickTaskType;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  status: PickTaskStatus;
  title: string;
  sku?: string;
  productName?: string;
  fromLocationCode?: string;
  toLocationCode?: string;
  quantity: number;
  completedQuantity: number;
  shortQuantity: number;
  loadSheetId?: string;
  loadSheetNumber?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  dueBy?: string;
  notes?: string;
}

export interface TrailerOptimisationResult {
  loadSheetId: string;
  sections: {
    section: TrailerSection;
    label: string;
    lines: Array<{
      lineId: string;
      sku: string;
      productName: string;
      boxes: number;
      weight: number;
      reason: string;
      loadOrder: number;
      layer: number;
      position: string;
    }>;
    totalBoxes: number;
    totalWeight: number;
    utilizationPct: number;
  }[];
  weightDistributionOk: boolean;
  estimatedLoadTimeMins: number;
  optimisedAt: string;
}

export interface LoadProgress {
  loadSheetId: string;
  loadSheetNumber: string;
  totalLines: number;
  pending: number;
  picked: number;
  atBay: number;
  loaded: number;
  short: number;
  completionPct: number;
  totalBoxesExpected: number;
  totalBoxesLoaded: number;
  openPickTasks: number;
  inProgressPickTasks: number;
  completedPickTasks: number;
}

// ─── Bay Management ───────────────────────────────────────────────────────────

export function getDockBays() {
  return apiClient<{ bays: DockBay[] }>("/api/dock/status").then(
    (res) => res.data
  );
}

export function assignTrailerToBay(
  bayId: string,
  data: { trailerNumber: string; loadSheetId?: string; carrierName?: string }
) {
  return apiClient<DockBay>(`/api/dock/bays/${bayId}/assign`, {
    method: "POST",
    data,
  }).then((res) => res.data);
}

export function updateBayStatus(bayId: string, status: BayStatus, notes?: string) {
  return apiClient<DockBay>(`/api/dock/bays/${bayId}/status`, {
    method: "PATCH",
    data: { status, notes },
  }).then((res) => res.data);
}

// ─── Load Sheets ──────────────────────────────────────────────────────────────

export function getLoadSheets(params?: {
  status?: LoadSheetStatus;
  date?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.date) q.set("date", params.date);
  if (params?.search) q.set("search", params.search);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return apiClient<{ loadSheets: LoadSheet[]; count: number }>(
    `/api/loadsheets${qs}`
  ).then((res) => res.data);
}

export function getLoadSheet(id: string) {
  return apiClient<LoadSheet>(`/api/loadsheets/${id}`).then((res) => res.data);
}

export function createLoadSheet(data: {
  shipmentDate: string;
  trailerNumber?: string;
  bayDoorId?: string;
  carrierName?: string;
  driverName?: string;
  driverPhone?: string;
  destinationAddress?: string;
  destinationBranch?: string;
  routeCode?: string;
  customerId?: string;
}) {
  return apiClient<LoadSheet>("/api/loadsheets", { method: "POST", data }).then(
    (res) => res.data
  );
}

export function scanTrailerNumber(loadSheetId: string, trailerNumber: string) {
  return apiClient<LoadSheet>(`/api/loadsheets/${loadSheetId}/scan-trailer`, {
    method: "POST",
    data: { trailerNumber },
  }).then((res) => res.data);
}

export function sealTrailer(loadSheetId: string, sealNumber: string, notes?: string) {
  return apiClient<LoadSheet>(`/api/loadsheets/${loadSheetId}/seal`, {
    method: "POST",
    data: { sealNumber, notes },
  }).then((res) => res.data);
}

export function advanceLoadSheetStatus(
  loadSheetId: string,
  action: "mark_ready" | "start_loading" | "complete_loading" | "dispatch",
  data?: {
    userId?: string;
    userName?: string;
    notes?: string;
  }
) {
  return apiClient<LoadSheet>(`/api/loadsheets/${loadSheetId}/status`, {
    method: "POST",
    data: { action, ...data },
  }).then((res) => res.data);
}

// ─── Load Sheet Lines ─────────────────────────────────────────────────────────

export function getLoadSheetLines(loadSheetId: string) {
  return apiClient<{ lines: LoadSheetLine[] }>(
    `/api/loadsheets/${loadSheetId}/lines`
  ).then((res) => res.data);
}

export function recordBoxLoaded(
  loadSheetId: string,
  lineId: string,
  data: {
    quantityLoaded: number;
    loadSection?: TrailerSection;
    loadLayer?: number;
    loadPosition?: string;
    notes?: string;
    loadedBy?: string;
    userId?: string;
  }
) {
  return apiClient<LoadSheetLine>(
    `/api/loadsheets/${loadSheetId}/lines/${lineId}/loaded`,
    { method: "POST", data }
  ).then((res) => res.data);
}

export function recordBoxAtBay(loadSheetId: string, lineId: string, pickTaskId?: string) {
  return apiClient<LoadSheetLine>(
    `/api/loadsheets/${loadSheetId}/lines/${lineId}/at-bay`,
    { method: "POST", data: { pickTaskId } }
  ).then((res) => res.data);
}

export function getLoadProgress(loadSheetId: string) {
  return apiClient<LoadProgress>(`/api/loadsheets/${loadSheetId}/progress`)
    .then((res) => res.data);
}

// ─── Pick Tasks ───────────────────────────────────────────────────────────────

export function getPickTasks(params?: {
  loadSheetId?: string;
  status?: PickTaskStatus;
  assignedToId?: string;
  taskType?: PickTaskType;
}) {
  const q = new URLSearchParams();
  if (params?.loadSheetId) q.set("wavePickId", params.loadSheetId); // server uses wavePickId
  if (params?.status) q.set("status", params.status);
  if (params?.assignedToId) q.set("assignedToId", params.assignedToId);
  if (params?.taskType) q.set("taskType", params.taskType);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return apiClient<{ tasks: PickTask[]; total: number }>(
    `/api/picking-tasks${qs}`
  ).then((res) => res.data);
}

export function createPickTask(data: {
  loadSheetId: string;
  sku: string;
  productName?: string;
  fromLocationCode: string;
  quantity: number;
  priority?: PickTask["priority"];
  assignedToId?: string;
  dueBy?: string;
  notes?: string;
}) {
  return apiClient<PickTask>("/api/picking-tasks", { method: "POST", data }).then(
    (res) => res.data
  );
}

export function assignPickTask(taskId: string, pickerId: string) {
  return apiClient<PickTask>(`/api/picking-tasks/${taskId}/assign`, {
    method: "POST",
    data: { assignedToId: pickerId },
  }).then((res) => res.data);
}

export function startPickTask(taskId: string) {
  return apiClient<PickTask>(`/api/picking-tasks/${taskId}/start`, {
    method: "POST",
  }).then((res) => res.data);
}

export function completePickTask(
  taskId: string,
  completedQty: number,
  notes?: string
) {
  return apiClient<PickTask>(`/api/picking-tasks/${taskId}/complete`, {
    method: "POST",
    data: { completedQuantity: completedQty, notes },
  }).then((res) => res.data);
}

export function shortPickTask(taskId: string, shortQty: number, reason: string) {
  return apiClient<PickTask>(`/api/picking-tasks/${taskId}/short`, {
    method: "POST",
    data: { shortQuantity: shortQty, reason },
  }).then((res) => res.data);
}

// ─── Trailer Optimisation ─────────────────────────────────────────────────────

export function runTrailerOptimisation(loadSheetId: string) {
  return apiClient<TrailerOptimisationResult>(
    `/api/load-planning/optimize`,
    { method: "POST", data: { loadSheetId } }
  ).then((res) => res.data);
}

export function applyOptimisationPlan(
  loadSheetId: string,
  plan: TrailerOptimisationResult
) {
  return apiClient<{ applied: number }>(
    `/api/loadsheets/${loadSheetId}/apply-optimisation`,
    { method: "POST", data: { plan } }
  ).then((res) => res.data);
}

// ─── Plan B: Exports & Notifications ──────────────────────────────────────────

export function emailLoadSheet(
  loadSheetId: string,
  recipients: string[],
  includeDriverInstructions: boolean = true
) {
  return apiClient<{ success: boolean; sentTo: string[] }>(
    `/api/loadsheets/${loadSheetId}/email`,
    {
      method: "POST",
      data: { recipients, includeDriverInstructions },
    }
  ).then((res) => res.data);
}

export function getLoadSheetPdfUrl(loadSheetId: string) {
  // Returns a direct URL to the PDF for printing/sharing
  return `${apiClient.defaults.baseURL}/api/loadsheets/${loadSheetId}/pdf`;
}
