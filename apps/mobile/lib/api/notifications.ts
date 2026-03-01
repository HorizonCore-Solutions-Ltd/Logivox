import { apiClient } from "./client";

export type NotificationCategory =
  | "ORDER"
  | "INVENTORY"
  | "RETURN"
  | "QUALITY"
  | "CAPA"
  | "COMPLIANCE"
  | "SHIPPING"
  | "SYSTEM"
  | "ALERT";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  read: boolean;
  actionUrl?: string; // deep link, e.g. "/returns/RMA-001"
  data?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

// GET /api/notifications
export async function getNotifications(params?: {
  unreadOnly?: boolean;
  category?: NotificationCategory;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await apiClient.get("/api/notifications", { params });
  return data as { items: AppNotification[]; total: number; unreadCount: number };
}

// GET /api/notifications/unread-count
export async function getUnreadCount() {
  const { data } = await apiClient.get("/api/notifications/unread-count");
  return data as { count: number };
}

// PUT /api/notifications/:id/read
export async function markRead(id: string) {
  const { data } = await apiClient.put(`/api/notifications/${id}/read`);
  return data as AppNotification;
}

// PUT /api/notifications/mark-all-read
export async function markAllRead() {
  const { data } = await apiClient.put("/api/notifications/mark-all-read");
  return data as { marked: number };
}

// DELETE /api/notifications/:id
export async function deleteNotification(id: string) {
  await apiClient.delete(`/api/notifications/${id}`);
}

// POST /api/notifications/register-token — register Expo push token with server
export async function registerPushToken(token: string, platform: "ios" | "android") {
  const { data } = await apiClient.post("/api/notifications/register-token", { token, platform });
  return data as { success: boolean };
}

// GET /api/alerts — real-time operational alerts (low stock, overdue tasks, etc.)
export async function getAlerts(params?: { severity?: string; role?: string }) {
  const { data } = await apiClient.get("/api/alerts", { params });
  return data as Array<{
    id: string;
    message: string;
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
    category: string;
    createdAt: string;
  }>;
}
