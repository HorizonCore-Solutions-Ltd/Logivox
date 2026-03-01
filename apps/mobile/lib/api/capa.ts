import { apiClient } from "./client";

export interface CAPAItem {
  id: string;
  capaNumber: string;
  type: "CORRECTIVE" | "PREVENTIVE";
  status: "OPEN" | "IN_PROGRESS" | "PENDING_REVIEW" | "CLOSED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  closedDate?: string;
  sourceType?: string;
  sourceId?: string;
  verificationRequired: boolean;
  verifiedAt?: string;
  createdAt: string;
}

// GET /api/capa — list CAPA items
export async function getCAPAItems(params?: {
  status?: string;
  type?: string;
  assignedToMe?: boolean;
  priority?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/capa", { params });
  return data as {
    items: CAPAItem[];
    summary: {
      open: number;
      inProgress: number;
      overdue: number;
      closedThisMonth: number;
    };
  };
}

// GET /api/capa/:id
export async function getCAPAItem(id: string): Promise<CAPAItem> {
  const { data } = await apiClient.get(`/api/capa/${id}`);
  return data;
}

// POST /api/capa — create CAPA
export async function createCAPAItem(payload: {
  type: "CORRECTIVE" | "PREVENTIVE";
  priority: string;
  title: string;
  description: string;
  dueDate?: string;
  ownerId?: string;
}) {
  const { data } = await apiClient.post("/api/capa", payload);
  return data as CAPAItem;
}

// PUT /api/capa/:id — update CAPA
export async function updateCAPAItem(id: string, payload: Partial<CAPAItem>) {
  const { data } = await apiClient.put(`/api/capa/${id}`, payload);
  return data as CAPAItem;
}

// PUT /api/capa/:id/close — close CAPA with resolution notes
export async function closeCAPAItem(
  id: string,
  resolution: string,
  verificationNotes?: string,
) {
  const { data } = await apiClient.put(`/api/capa/${id}/close`, {
    resolution,
    verificationNotes,
  });
  return data;
}
