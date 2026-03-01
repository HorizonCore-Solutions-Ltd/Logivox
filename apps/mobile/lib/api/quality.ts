import { apiClient } from "./client";

export interface QCInspection {
  id: string;
  inspectionNumber: string;
  type: "INBOUND" | "IN_PROCESS" | "OUTBOUND" | "AUDIT" | "RETURN";
  status: "SCHEDULED" | "IN_PROGRESS" | "PASSED" | "FAILED" | "ON_HOLD";
  productId?: string;
  productName?: string;
  sku?: string;
  lotNumber?: string;
  sampleSize: number;
  defectsFound: number;
  result?: "PASS" | "FAIL" | "CONDITIONAL_PASS";
  inspectorId?: string;
  inspectorName?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  checklistItems?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  criterion: string;
  result?: "PASS" | "FAIL" | "N/A";
  notes?: string;
  required: boolean;
}

// GET /api/qc-inspections — list inspections
export async function getQCInspections(params?: {
  status?: string;
  type?: string;
  assignedToMe?: boolean;
  from?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/qc-inspections", { params });
  return data as {
    inspections: QCInspection[];
    summary: {
      scheduled: number;
      inProgress: number;
      passed: number;
      failed: number;
      onHold: number;
      passRate: number;
    };
  };
}

// GET /api/qc-inspections/:id
export async function getQCInspection(id: string): Promise<QCInspection> {
  const { data } = await apiClient.get(`/api/qc-inspections/${id}`);
  return data;
}

// PUT /api/qc-inspections/:id/start
export async function startInspection(id: string) {
  const { data } = await apiClient.put(`/api/qc-inspections/${id}/start`);
  return data;
}

// PUT /api/qc-inspections/:id/complete — submit inspection result
export async function completeInspection(
  id: string,
  payload: {
    result: "PASS" | "FAIL" | "CONDITIONAL_PASS";
    checklistItems: {
      id: string;
      result: "PASS" | "FAIL" | "N/A";
      notes?: string;
    }[];
    defectsFound: number;
    notes?: string;
  },
) {
  const { data } = await apiClient.put(
    `/api/qc-inspections/${id}/complete`,
    payload,
  );
  return data;
}

// PUT /api/qc-inspections/:id/hold — put item on hold
export async function holdInspection(id: string, reason: string) {
  const { data } = await apiClient.put(`/api/qc-inspections/${id}/hold`, {
    reason,
  });
  return data;
}

// GET /api/inspection-templates — get quality checklists
export async function getInspectionTemplates() {
  const { data } = await apiClient.get("/api/inspection-templates");
  return data as Array<{
    id: string;
    name: string;
    type: string;
    checklistItems: ChecklistItem[];
  }>;
}
