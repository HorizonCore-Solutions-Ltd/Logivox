import { apiClient } from "./client";

export interface Shipment {
  id: string;
  shipmentNumber: string;
  status:
    | "PENDING"
    | "PACKING"
    | "PACKED"
    | "DISPATCHED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "RETURNED";
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  carrierId?: string;
  carrierName?: string;
  trackingNumber?: string;
  serviceType?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  packages: number;
  labelUrl?: string;
  createdAt: string;
}

export interface PackTask {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  packedCount: number;
  priority: string;
  status: "PENDING" | "IN_PROGRESS" | "PACKED";
  assignedTo?: string;
}

// GET /api/shipments
export async function getShipments(params?: {
  status?: string;
  from?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/shipments", { params });
  return data as {
    shipments: Shipment[];
    summary: { pending: number; inTransit: number; deliveredToday: number };
  };
}

// GET /api/packing — packing tasks
export async function getPackingTasks(params?: {
  status?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get("/api/packing", { params });
  return data as {
    tasks: PackTask[];
    summary: { pending: number; inProgress: number; packed: number };
  };
}

// POST /api/shipments/:orderId/label — generate shipping label
export async function generateLabel(
  orderId: string,
  carrierId: string,
  serviceType: string,
) {
  const { data } = await apiClient.post(`/api/shipments/${orderId}/label`, {
    carrierId,
    serviceType,
  });
  return data as { trackingNumber: string; labelUrl: string };
}

// PUT /api/shipments/:id/dispatch — mark as dispatched
export async function dispatchShipment(id: string, trackingNumber?: string) {
  const { data } = await apiClient.put(`/api/shipments/${id}/dispatch`, {
    trackingNumber,
  });
  return data;
}

// PUT /api/packing/:taskId/complete — complete a packing task
export async function completePackingTask(
  taskId: string,
  packageCount: number,
  weight?: number,
) {
  const { data } = await apiClient.put(`/api/packing/${taskId}/complete`, {
    packageCount,
    weight,
  });
  return data;
}

// GET /api/carriers
export async function getCarriers() {
  const { data } = await apiClient.get("/api/carriers");
  return data as Array<{
    id: string;
    name: string;
    code: string;
    services: string[];
  }>;
}
