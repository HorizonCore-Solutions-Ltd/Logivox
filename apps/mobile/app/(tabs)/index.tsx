import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth.store";
import { apiClient } from "@/lib/api/client";
import { getRoleConfig, type TabName } from "@/lib/config/roleAccess";

// ── Per-role quick action definitions ─────────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

interface QuickAction {
  id: string;
  label: string;
  icon: IoniconName;
  route: string;
  color: string;
}

const QUICK_ACTION_DEFS: Record<string, QuickAction> = {
  startWave: {
    id: "startWave",
    label: "Start Wave",
    icon: "layers-outline",
    route: "/(tabs)/picking",
    color: "#f59e0b",
  },
  scanItem: {
    id: "scanItem",
    label: "Scan Item",
    icon: "scan-outline",
    route: "/(tabs)/inventory",
    color: "#3b82f6",
  },
  reportShortPick: {
    id: "reportShortPick",
    label: "Short Pick",
    icon: "alert-circle-outline",
    route: "/(tabs)/picking",
    color: "#ef4444",
  },
  viewTasks: {
    id: "viewTasks",
    label: "My Tasks",
    icon: "list-outline",
    route: "/(tabs)/picking",
    color: "#6366f1",
  },
  scanASN: {
    id: "scanASN",
    label: "Scan ASN",
    icon: "qr-code-outline",
    route: "/(tabs)/receiving",
    color: "#10b981",
  },
  receiveASN: {
    id: "receiveASN",
    label: "Receive ASN",
    icon: "download-outline",
    route: "/(tabs)/receiving",
    color: "#8b5cf6",
  },
  reportDiscrepancy: {
    id: "reportDiscrepancy",
    label: "Discrepancy",
    icon: "warning-outline",
    route: "/(tabs)/receiving",
    color: "#f97316",
  },
  viewASNs: {
    id: "viewASNs",
    label: "View ASNs",
    icon: "clipboard-outline",
    route: "/(tabs)/receiving",
    color: "#0891b2",
  },
  startCycleCount: {
    id: "startCycleCount",
    label: "Cycle Count",
    icon: "swap-horizontal-outline",
    route: "/(tabs)/cyclecount",
    color: "#d97706",
  },
  adjustStock: {
    id: "adjustStock",
    label: "Adjust Stock",
    icon: "create-outline",
    route: "/(tabs)/inventory",
    color: "#6b7280",
  },
  viewLowStock: {
    id: "viewLowStock",
    label: "Low Stock",
    icon: "trending-down-outline",
    route: "/(tabs)/inventory",
    color: "#ef4444",
  },
  createReturn: {
    id: "createReturn",
    label: "New Return",
    icon: "return-up-back-outline",
    route: "/(tabs)/returns",
    color: "#ef4444",
  },
  approveReturn: {
    id: "approveReturn",
    label: "Approve Return",
    icon: "checkmark-circle-outline",
    route: "/(tabs)/returns",
    color: "#10b981",
  },
  receiveReturn: {
    id: "receiveReturn",
    label: "Receive Return",
    icon: "download-outline",
    route: "/(tabs)/returns",
    color: "#3b82f6",
  },
  viewReturns: {
    id: "viewReturns",
    label: "View Returns",
    icon: "archive-outline",
    route: "/(tabs)/returns",
    color: "#8b5cf6",
  },
  startInspection: {
    id: "startInspection",
    label: "New Inspection",
    icon: "shield-outline",
    route: "/(tabs)/quality",
    color: "#10b981",
  },
  viewInspections: {
    id: "viewInspections",
    label: "Inspections",
    icon: "search-outline",
    route: "/(tabs)/quality",
    color: "#3b82f6",
  },
  raiseCAPA: {
    id: "raiseCAPA",
    label: "Raise CAPA",
    icon: "construct-outline",
    route: "/(tabs)/capa",
    color: "#f97316",
  },
  createCAPA: {
    id: "createCAPA",
    label: "New CAPA",
    icon: "add-circle-outline",
    route: "/(tabs)/capa",
    color: "#f97316",
  },
  reviewCAPA: {
    id: "reviewCAPA",
    label: "Review CAPA",
    icon: "eye-outline",
    route: "/(tabs)/capa",
    color: "#8b5cf6",
  },
  viewCompliance: {
    id: "viewCompliance",
    label: "Compliance",
    icon: "document-text-outline",
    route: "/(tabs)/compliance",
    color: "#7c3aed",
  },
  completeTask: {
    id: "completeTask",
    label: "Complete Task",
    icon: "checkmark-done-outline",
    route: "/(tabs)/compliance",
    color: "#10b981",
  },
  viewAuditLog: {
    id: "viewAuditLog",
    label: "Audit Log",
    icon: "time-outline",
    route: "/(tabs)/compliance",
    color: "#6b7280",
  },
  viewInvoices: {
    id: "viewInvoices",
    label: "Invoices",
    icon: "cash-outline",
    route: "/(tabs)/invoices",
    color: "#059669",
  },
  approveInvoice: {
    id: "approveInvoice",
    label: "Approve Invoice",
    icon: "checkmark-circle-outline",
    route: "/(tabs)/invoices",
    color: "#10b981",
  },
  viewOverdue: {
    id: "viewOverdue",
    label: "Overdue",
    icon: "alert-outline",
    route: "/(tabs)/invoices",
    color: "#ef4444",
  },
  exportReport: {
    id: "exportReport",
    label: "Export Report",
    icon: "share-outline",
    route: "/(tabs)/analytics",
    color: "#3b82f6",
  },
  viewPackingTasks: {
    id: "viewPackingTasks",
    label: "Packing Tasks",
    icon: "cube-outline",
    route: "/(tabs)/shipping",
    color: "#0ea5e9",
  },
  generateLabel: {
    id: "generateLabel",
    label: "Print Label",
    icon: "print-outline",
    route: "/(tabs)/shipping",
    color: "#3b82f6",
  },
  dispatchShipment: {
    id: "dispatchShipment",
    label: "Dispatch",
    icon: "send-outline",
    route: "/(tabs)/shipping",
    color: "#10b981",
  },
  viewOrders: {
    id: "viewOrders",
    label: "Orders",
    icon: "receipt-outline",
    route: "/(tabs)/orders",
    color: "#6366f1",
  },
  createOrder: {
    id: "createOrder",
    label: "New Order",
    icon: "add-circle-outline",
    route: "/(tabs)/orders",
    color: "#3b82f6",
  },
  viewSuppliers: {
    id: "viewSuppliers",
    label: "Suppliers",
    icon: "business-outline",
    route: "/(tabs)/suppliers",
    color: "#0891b2",
  },
  createPO: {
    id: "createPO",
    label: "Create PO",
    icon: "document-outline",
    route: "/(tabs)/suppliers",
    color: "#6366f1",
  },
  viewScorecard: {
    id: "viewScorecard",
    label: "Scorecard",
    icon: "bar-chart-outline",
    route: "/(tabs)/suppliers",
    color: "#f59e0b",
  },
  viewAnalytics: {
    id: "viewAnalytics",
    label: "Analytics",
    icon: "stats-chart-outline",
    route: "/(tabs)/analytics",
    color: "#3b82f6",
  },
  viewAlerts: {
    id: "viewAlerts",
    label: "Alerts",
    icon: "notifications-outline",
    route: "/(tabs)/more",
    color: "#ef4444",
  },
  manageUsers: {
    id: "manageUsers",
    label: "Users",
    icon: "people-outline",
    route: "/(tabs)/more",
    color: "#8b5cf6",
  },
  systemSettings: {
    id: "systemSettings",
    label: "Settings",
    icon: "settings-outline",
    route: "/(tabs)/profile",
    color: "#6b7280",
  },
  viewLaborPerformance: {
    id: "viewLaborPerformance",
    label: "Labor KPIs",
    icon: "people-outline",
    route: "/(tabs)/analytics",
    color: "#6366f1",
  },
  viewCustomers: {
    id: "viewCustomers",
    label: "Customers",
    icon: "person-outline",
    route: "/(tabs)/orders",
    color: "#10b981",
  },
};

function greeting(name?: string, role?: string) {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${tod}, ${name?.split(" ")[0] ?? "there"}`;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const roleConfig = getRoleConfig(role);

  const [dashData, setDashData] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<
    Array<{ id: string; message: string; severity: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [inventoryRes, ordersRes, alertsRes] = await Promise.allSettled([
        apiClient.get("/inventory?limit=1"),
        apiClient.get("/sales-orders?limit=1"),
        apiClient.get("/alerts?limit=5"),
      ]);

      const inv =
        inventoryRes.status === "fulfilled" ? inventoryRes.value.data : {};
      const ord = ordersRes.status === "fulfilled" ? ordersRes.value.data : {};
      const alrt =
        alertsRes.status === "fulfilled"
          ? (alertsRes.value.data?.alerts ?? alertsRes.value.data ?? [])
          : [];

      setDashData({
        totalSKUs: inv?.pagination?.total ?? inv?.totalItems ?? 0,
        lowStockAlerts: inv?.lowStockCount ?? 0,
        picksToday: ord?.stats?.completedToday ?? 0,
        ordersToday: ord?.stats?.total ?? 0,
        ordersPending: ord?.stats?.pending ?? 0,
      });
      setAlerts(Array.isArray(alrt) ? alrt.slice(0, 4) : []);
    } catch {
      // non-critical — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const quickActions = roleConfig.quickActions
    .map((id) => QUICK_ACTION_DEFS[id])
    .filter(Boolean)
    .slice(0, 4);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting(user?.name, role)}</Text>
            <Text style={styles.roleLabel}>{roleConfig.label}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) ?? "?"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionTile,
                { backgroundColor: action.color + "18" },
              ]}
              onPress={() => router.push(action.route as never)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.color + "25" },
                ]}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role KPI summary */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          {dashData.totalSKUs !== undefined && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/(tabs)/inventory" as never)}
            >
              <Ionicons name="cube-outline" size={20} color="#3b82f6" />
              <Text style={styles.statValue}>
                {dashData.totalSKUs.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total SKUs</Text>
              {dashData.lowStockAlerts > 0 && (
                <Text style={styles.statWarning}>
                  {dashData.lowStockAlerts} low stock
                </Text>
              )}
            </TouchableOpacity>
          )}
          {dashData.ordersToday !== undefined && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/(tabs)/orders" as never)}
            >
              <Ionicons name="receipt-outline" size={20} color="#6366f1" />
              <Text style={styles.statValue}>
                {dashData.ordersToday.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Orders Today</Text>
              {dashData.ordersPending > 0 && (
                <Text style={styles.statSub}>
                  {dashData.ordersPending} pending
                </Text>
              )}
            </TouchableOpacity>
          )}
          {dashData.picksToday !== undefined && dashData.picksToday > 0 && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push("/(tabs)/picking" as never)}
            >
              <Ionicons name="layers-outline" size={20} color="#f59e0b" />
              <Text style={styles.statValue}>{dashData.picksToday}</Text>
              <Text style={styles.statLabel}>Picks Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Alerts */}
        {alerts.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <View style={styles.alertsList}>
              {alerts.map((alert) => {
                const dotColor =
                  alert.severity === "CRITICAL" || alert.severity === "HIGH"
                    ? "#ef4444"
                    : alert.severity === "WARNING" ||
                        alert.severity === "MEDIUM"
                      ? "#f59e0b"
                      : "#6b7280";
                return (
                  <View key={alert.id} style={styles.alertRow}>
                    <View
                      style={[styles.alertDot, { backgroundColor: dotColor }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertMsg} numberOfLines={2}>
                        {alert.message}
                      </Text>
                      <Text style={styles.alertTime}>
                        {new Date(alert.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.allClear}>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#10b981"
            />
            <Text style={styles.allClearText}>
              No active alerts — all clear
            </Text>
          </View>
        )}

        {/* Sync time */}
        <View style={styles.syncRow}>
          <Ionicons name="time-outline" size={13} color="#94a3b8" />
          <Text style={styles.syncText}>
            Updated{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  roleLabel: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  actionTile: {
    width: "47%",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 12, fontWeight: "700", flex: 1 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "28%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  statSub: { fontSize: 11, color: "#94a3b8", marginTop: 3 },
  statWarning: {
    fontSize: 11,
    color: "#f59e0b",
    marginTop: 3,
    fontWeight: "600",
  },
  alertsList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 10,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  alertMsg: { fontSize: 13, color: "#1e293b", fontWeight: "500" },
  alertTime: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  allClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  allClearText: { color: "#059669", fontWeight: "600", fontSize: 13 },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 16,
  },
  syncText: { fontSize: 11, color: "#cbd5e1" },
});
