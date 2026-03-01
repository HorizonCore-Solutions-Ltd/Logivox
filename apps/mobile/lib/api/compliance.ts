import { apiClient } from "./client";

export interface ComplianceTask {
  id: string;
  taskNumber: string;
  type:
    | "AUDIT"
    | "CERTIFICATION"
    | "TRAINING"
    | "INSPECTION"
    | "REPORTING"
    | "REVIEW";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "WAIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description?: string;
  regulation?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: string;
  completedDate?: string;
  evidence?: string[];
  notes?: string;
  createdAt: string;
}

export interface ComplianceScore {
  overall: number;
  byCategory: Array<{
    category: string;
    score: number;
    total: number;
    passed: number;
  }>;
  trend: "UP" | "DOWN" | "STABLE";
  lastAuditDate?: string;
}

// GET /api/compliance — list compliance tasks
export async function getComplianceTasks(params?: {
  status?: string;
  type?: string;
  assignedToMe?: boolean;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/compliance", { params });
  return data as {
    tasks: ComplianceTask[];
    summary: {
      pending: number;
      overdue: number;
      completedThisMonth: number;
      complianceRate: number;
    };
  };
}

// GET /api/compliance/score
export async function getComplianceScore() {
  const { data } = await apiClient.get("/api/compliance/score");
  return data as ComplianceScore;
}

// PUT /api/compliance/:id/complete
export async function completeComplianceTask(
  id: string,
  payload: { notes?: string; evidenceUrls?: string[] },
) {
  const { data } = await apiClient.put(
    `/api/compliance/${id}/complete`,
    payload,
  );
  return data;
}

// GET /api/compliance/audit-logs
export async function getAuditLogs(params?: {
  limit?: number;
  from?: string;
  to?: string;
}) {
  const { data } = await apiClient.get("/api/compliance/audit-logs", {
    params,
  });
  return data as Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    userName: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
}
