import { apiClient } from "./client";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string;
  taxRate?: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  salesOrderId?: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  paymentTerms?: string;
  signatureDataUrl?: string;
  photoAttachments?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  pdfUrl?: string;
  signedAt?: string;
  createdAt: string;
}

export interface SendInvoicePayload {
  method: "EMAIL" | "WHATSAPP" | "LINK";
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
}

// POST /api/invoices/mobile/create — create invoice from mobile (with signature + photos)
export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(
    "/api/invoices/mobile/create",
    payload,
  );
  return data;
}

// GET /api/invoices/mobile — list invoices for current user's org
export async function getInvoices(params?: {
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/invoices/mobile", { params });
  return data as {
    invoices: Invoice[];
    pagination: { page: number; total: number; totalPages: number };
    totals: { outstanding: number; paid: number; overdue: number };
  };
}

// GET /api/invoices/:id
export async function getInvoice(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<Invoice>(`/api/invoices/mobile/${id}`);
  return data;
}

// PUT /api/invoices/:id/send
export async function sendInvoice(
  id: string,
  payload: SendInvoicePayload,
): Promise<{ sent: boolean; deliveryId?: string }> {
  const { data } = await apiClient.put(
    `/api/invoices/mobile/${id}/send`,
    payload,
  );
  return data;
}

// GET /api/invoices/:id/pdf — returns PDF bytes as base64
export async function getInvoicePdf(
  id: string,
): Promise<{ base64: string; filename: string }> {
  const { data } = await apiClient.get(`/api/invoices/mobile/${id}/pdf`);
  return data;
}

// POST /api/invoices/:id/signature — attach delivery signature
export async function attachSignature(
  id: string,
  signatureDataUrl: string,
  signerName: string,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(
    `/api/invoices/mobile/${id}/signature`,
    { signatureDataUrl, signerName },
  );
  return data;
}

// POST /api/invoices/:id/mark-paid
export async function markInvoicePaid(
  id: string,
  paymentMethod: string,
  reference?: string,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(
    `/api/invoices/mobile/${id}/mark-paid`,
    { paymentMethod, reference },
  );
  return data;
}

// GET /api/customers (mobile-optimised list)
export async function getCustomers(search?: string) {
  const { data } = await apiClient.get("/api/customers", {
    params: { search, limit: 50 },
  });
  return data as Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }>;
}
