import { apiClient } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SlottingRecommendation {
  id: string;
  sku: string;
  productName: string;
  currentLocationCode?: string;
  recommendedLocationCode: string;
  currentZone?: string;
  recommendedZone?: string;
  velocityClass: "A" | "B" | "C" | "D";
  reason: string;
  estimatedTimeSavingSeconds?: number;
  confidence?: number; // 0-100
  status: "PENDING" | "APPROVED" | "APPLIED" | "REJECTED";
  createdAt: string;
}

export interface SlottingRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  criteria: Record<string, unknown>;
}

export interface SlottingOptimisationResult {
  recommendationsGenerated: number;
  estimatedTotalTimeSavingSeconds: number;
  warehouseId: string;
  runAt: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getSlottingRecommendations(params?: {
  warehouseId?: string;
  status?: string;
  velocityClass?: string;
}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v != null),
    ) as Record<string, string>,
  ).toString();
  return apiClient<{
    recommendations: SlottingRecommendation[];
    total: number;
  }>(`/api/slotting/recommendations${qs ? `?${qs}` : ""}`);
}

export function applyRecommendation(id: string) {
  return apiClient<SlottingRecommendation>(
    `/api/slotting/recommendations/${id}`,
    {
      method: "PATCH",
      data: { status: "APPLIED" },
    },
  );
}

export function rejectRecommendation(id: string, reason?: string) {
  return apiClient<SlottingRecommendation>(
    `/api/slotting/recommendations/${id}`,
    {
      method: "PATCH",
      data: { status: "REJECTED", reason },
    },
  );
}

export function runSlottingOptimisation(warehouseId: string) {
  return apiClient<SlottingOptimisationResult>("/api/slotting/optimize", {
    method: "POST",
    data: { warehouseId },
  });
}

export function getSlottingRules() {
  return apiClient<{ rules: SlottingRule[] }>("/api/slotting/rules");
}
