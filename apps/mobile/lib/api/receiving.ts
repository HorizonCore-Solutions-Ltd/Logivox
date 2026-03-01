import { apiClient } from "./client";

export interface ASN {
  id: string;
  asnNumber: string;
  supplierName: string;
  expectedDate: string;
  status: string;
  totalItems: number;
  receivedItems: number;
  items: ASNItem[];
}

export interface ASNItem {
  id: string;
  sku: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  locationId?: string;
  barcode?: string;
  status: "PENDING" | "PARTIAL" | "RECEIVED" | "REJECTED";
}

export interface ReceiveItemPayload {
  asnId: string;
  itemId: string;
  receivedQuantity: number;
  locationId: string;
  lotNumber?: string;
  expiryDate?: string;
  condition?: "GOOD" | "DAMAGED" | "REJECTED";
  notes?: string;
  photoUrls?: string[];
}

// GET /api/receiving/asns (open ASNs awaiting receipt)
export async function getOpenASNs(warehouseId?: string) {
  const { data } = await apiClient.get("/api/receiving/asns", {
    params: { status: "OPEN", warehouseId },
  });
  return data as ASN[];
}

// GET /api/receiving/asns?barcode=xxx (scan ASN barcode)
export async function scanASN(barcode: string): Promise<ASN | null> {
  const { data } = await apiClient.get("/api/receiving/asns", {
    params: { barcode, limit: 1 },
  });
  const list = (data as { asns?: ASN[] }).asns ?? (data as ASN[]);
  return Array.isArray(list) ? (list[0] ?? null) : null;
}

// POST /api/receiving/items/create — receive a single line item
export async function receiveItem(payload: ReceiveItemPayload) {
  const { data } = await apiClient.post("/api/receiving/items", payload);
  return data;
}

// PUT /api/receiving/:id/complete — finalize receipt
export async function completeReceiving(asnId: string) {
  const { data } = await apiClient.put(`/api/receiving/asns/${asnId}/complete`);
  return data;
}

// POST /api/receiving/asns/:id/discrepancy — report discrepancy
export async function reportDiscrepancy(
  asnId: string,
  itemId: string,
  expectedQty: number,
  receivedQty: number,
  reason: string,
) {
  const { data } = await apiClient.post(
    `/api/receiving/asns/${asnId}/discrepancy`,
    { itemId, expectedQty, receivedQty, reason },
  );
  return data;
}
