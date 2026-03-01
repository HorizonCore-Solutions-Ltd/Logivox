import { apiClient } from "./client";

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  status: "ACTIVE" | "INACTIVE" | "ON_HOLD" | "BLACKLISTED";
  score?: number; // 0-100
  leadTimeDays?: number;
  currency?: string;
  paymentTerms?: string;
}

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  onTimeDeliveryRate: number;
  qualityAcceptanceRate: number;
  invoiceAccuracyRate: number;
  responsiveness: number;
  totalOrders: number;
  onTimeOrders: number;
  lateOrders: number;
  rejectedItems: number;
  trend: "IMPROVING" | "DECLINING" | "STABLE";
  period: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  status:
    | "DRAFT"
    | "SENT"
    | "CONFIRMED"
    | "PARTIALLY_RECEIVED"
    | "FULLY_RECEIVED"
    | "CANCELLED";
  totalAmount: number;
  currency: string;
  expectedDate?: string;
  createdAt: string;
  lineCount: number;
}

// GET /api/suppliers — list suppliers
export async function getSuppliers(params?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/suppliers", { params });
  return data as { suppliers: Supplier[]; pagination: { total: number } };
}

// GET /api/suppliers/:id/scorecard
export async function getSupplierScorecard(
  supplierId: string,
): Promise<SupplierScorecard> {
  const { data } = await apiClient.get(
    `/api/suppliers/${supplierId}/scorecard`,
  );
  return data;
}

// GET /api/purchase-orders
export async function getPurchaseOrders(params?: {
  supplierId?: string;
  status?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/purchase-orders", { params });
  return data as {
    purchaseOrders: PurchaseOrder[];
    summary: { open: number; overdue: number; totalValue: number };
  };
}

// POST /api/purchase-orders — create PO
export async function createPurchaseOrder(payload: {
  supplierId: string;
  expectedDate: string;
  lines: Array<{ productId: string; quantity: number; unitCost: number }>;
  notes?: string;
}) {
  const { data } = await apiClient.post("/api/purchase-orders", payload);
  return data as PurchaseOrder;
}
