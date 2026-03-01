import { apiClient } from "./client";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  unitCost: number;
  unitPrice: number;
  locationId?: string;
  location?: { id: string; code: string; zone: string };
  warehouseId: string;
  barcode?: string;
  lotNumber?: string;
  expiryDate?: string;
  imageUrl?: string;
  status: string;
  updatedAt: string;
}

export interface InventoryListParams {
  search?: string;
  warehouseId?: string;
  locationId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface StockAdjustment {
  inventoryItemId: string;
  adjustmentType: "ADD" | "REMOVE" | "SET";
  quantity: number;
  reason: string;
  notes?: string;
  lotNumber?: string;
}

// GET /api/inventory
export async function getInventoryItems(params: InventoryListParams = {}) {
  const { data } = await apiClient.get("/api/inventory", { params });
  return data as {
    items: InventoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// GET /api/inventory/:id
export async function getInventoryItem(id: string) {
  const { data } = await apiClient.get<InventoryItem>(`/api/inventory/${id}`);
  return data;
}

// GET /api/inventory?barcode=xxx
export async function scanBarcode(barcode: string) {
  const { data } = await apiClient.get("/api/inventory", {
    params: { barcode, limit: 1 },
  });
  const items = (data as { items: InventoryItem[] }).items;
  return items[0] ?? null;
}

// POST /api/inventory/adjustments
export async function adjustStock(adjustment: StockAdjustment) {
  const { data } = await apiClient.post(
    "/api/inventory/adjustments",
    adjustment,
  );
  return data;
}

// GET /api/inventory/locations
export async function getLocations(warehouseId?: string) {
  const { data } = await apiClient.get("/api/inventory/locations", {
    params: warehouseId ? { warehouseId } : undefined,
  });
  return data as Array<{
    id: string;
    code: string;
    zone: string;
    aisle: string;
    bay: string;
    level: string;
    occupancy: number;
  }>;
}

// POST /api/inventory/:id/move
export async function moveInventory(
  id: string,
  toLocationId: string,
  quantity: number,
) {
  const { data } = await apiClient.post(`/api/inventory/${id}/move`, {
    toLocationId,
    quantity,
  });
  return data;
}

// GET /api/inventory/low-stock
export async function getLowStockItems(warehouseId?: string) {
  const { data } = await apiClient.get("/api/inventory", {
    params: { lowStock: true, warehouseId, limit: 50 },
  });
  return (data as { items: InventoryItem[] }).items;
}
