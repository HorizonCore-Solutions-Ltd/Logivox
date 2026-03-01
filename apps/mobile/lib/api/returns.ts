import { apiClient } from "./client";

export interface ReturnRequest {
  id: string;
  rmaNumber: string;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "INSPECTING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  reason: string;
  condition?: "NEW" | "GOOD" | "DAMAGED" | "DEFECTIVE";
  customerId: string;
  customerName?: string;
  orderId?: string;
  orderNumber?: string;
  totalItems: number;
  refundAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines?: ReturnLine[];
}

export interface ReturnLine {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  reason: string;
  condition?: string;
  inspectionNotes?: string;
  disposition?: "RESTOCK" | "SCRAP" | "REPAIR" | "RETURN_TO_VENDOR";
}

export interface CreateReturnPayload {
  customerId: string;
  orderId?: string;
  reason: string;
  notes?: string;
  lines: Omit<ReturnLine, "id">[];
}

// GET /api/returns — list returns
export async function getReturns(params?: {
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}) {
  const { data } = await apiClient.get("/api/returns", { params });
  return data as {
    returns: ReturnRequest[];
    pagination: { total: number; page: number; totalPages: number };
    summary: { pending: number; approved: number; received: number; refundValue: number };
  };
}

// GET /api/returns/:id
export async function getReturn(id: string): Promise<ReturnRequest> {
  const { data } = await apiClient.get<ReturnRequest>(`/api/returns/${id}`);
  return data;
}

// POST /api/returns — create RMA
export async function createReturn(payload: CreateReturnPayload) {
  const { data } = await apiClient.post("/api/returns", payload);
  return data as ReturnRequest;
}

// PUT /api/returns/:id/approve
export async function approveReturn(id: string, notes?: string) {
  const { data } = await apiClient.put(`/api/returns/${id}/approve`, { notes });
  return data;
}

// PUT /api/returns/:id/receive — mark items as physically received
export async function receiveReturn(id: string, lines: { lineId: string; quantityReceived: number; condition: string }[]) {
  const { data } = await apiClient.put(`/api/returns/${id}/receive`, { lines });
  return data;
}

// PUT /api/returns/:id/inspect — record inspection result per line
export async function inspectReturn(id: string, lines: { lineId: string; condition: string; disposition: string; notes?: string }[]) {
  const { data } = await apiClient.put(`/api/returns/${id}/inspect`, { lines });
  return data;
}

// PUT /api/returns/:id/complete
export async function completeReturn(id: string) {
  const { data } = await apiClient.put(`/api/returns/${id}/complete`);
  return data;
}

// GET /api/return-reasons
export async function getReturnReasons() {
  const { data } = await apiClient.get("/api/return-reasons");
  return data as Array<{ id: string; name: string; category: string }>;
}
