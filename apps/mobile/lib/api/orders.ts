import { apiClient } from "./client";

export interface PickingOrder {
  id: string;
  soNumber: string;
  customerName: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  status: string;
  dueDate?: string;
  shipDate?: string;
  warehouseId: string;
  totalItems: number;
  pickedItems: number;
  items: PickingItem[];
}

export interface PickingItem {
  id: string;
  lineNumber: number;
  inventoryItemId: string;
  sku: string;
  name: string;
  orderedQuantity: number;
  pickedQuantity: number;
  locationCode: string;
  zone: string;
  barcode?: string;
  status: "PENDING" | "PARTIAL" | "PICKED" | "SHORT" | "SKIPPED";
}

export interface PickItemPayload {
  orderId: string;
  itemId: string;
  quantity: number;
  locationId?: string;
  lotNumber?: string;
  serialNumber?: string;
}

// GET /api/orders/picking-queue
export async function getPickingQueue(warehouseId?: string) {
  const { data } = await apiClient.get("/api/orders/picking-queue", {
    params: warehouseId ? { warehouseId } : undefined,
  });
  return data as PickingOrder[];
}

// GET /api/sales-orders/:id with items
export async function getOrderDetail(orderId: string) {
  const { data } = await apiClient.get<PickingOrder>(
    `/api/sales-orders/${orderId}`,
  );
  return data;
}

// POST /api/orders/:id/pick-item
export async function pickItem(payload: PickItemPayload) {
  const { data } = await apiClient.post(
    `/api/orders/${payload.orderId}/pick-item`,
    {
      itemId: payload.itemId,
      quantity: payload.quantity,
      locationId: payload.locationId,
      lotNumber: payload.lotNumber,
      serialNumber: payload.serialNumber,
    },
  );
  return data;
}

// PUT /api/orders/:id/complete
export async function completeOrderPicking(orderId: string) {
  const { data } = await apiClient.put(`/api/orders/${orderId}/complete`);
  return data;
}

// POST /api/orders/:id/short-pick
export async function reportShortPick(
  orderId: string,
  itemId: string,
  shortQty: number,
  reason: string,
) {
  const { data } = await apiClient.post(`/api/orders/${orderId}/short-pick`, {
    itemId,
    shortQty,
    reason,
  });
  return data;
}

// GET /api/sales-orders (for receiving / lookup)
export async function getSalesOrders(params?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/sales-orders", { params });
  return data as { orders: PickingOrder[]; pagination: { total: number } };
}
