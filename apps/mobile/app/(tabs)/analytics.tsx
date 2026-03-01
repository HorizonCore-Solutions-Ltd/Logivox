import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  getRoleDashboard,
  getWarehouseMetrics,
  getInventoryAnalytics,
  getLaborPerformance,
  type KPICard,
  type WarehouseMetrics,
} from "../../lib/api/analytics";
import { useAuthStore } from "../../lib/store/auth.store";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_W = Dimensions.get("window").width;

function KPITile({ kpi }: { kpi: KPICard }) {
  const trendIcon =
    kpi.trend === "UP"
      ? "trending-up"
      : kpi.trend === "DOWN"
        ? "trending-down"
        : "remove";
  const trendColor =
    kpi.trend === "UP"
      ? "#10b981"
      : kpi.trend === "DOWN"
        ? "#ef4444"
        : "#6b7280";
  return (
    <View style={styles.kpiTile}>
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={styles.kpiValue}>
        {kpi.value}
        {kpi.unit ? <Text style={styles.kpiUnit}>{kpi.unit}</Text> : null}
      </Text>
      {kpi.change !== undefined && (
        <View style={styles.kpiTrend}>
          <Ionicons name={trendIcon as any} size={12} color={trendColor} />
          <Text style={[styles.kpiChangeText, { color: trendColor }]}>
            {Math.abs(kpi.change)}%
          </Text>
        </View>
      )}
    </View>
  );
}

function MetricRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value.toFixed(1)}
        {unit ? ` ${unit}` : ""}
      </Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const role = user?.role;
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  const {
    data: dashboard,
    isLoading: dashLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["roleDashboard", role, period],
    queryFn: () => getRoleDashboard(role),
  });

  const { data: warehouseMetrics } = useQuery({
    queryKey: ["warehouseMetrics"],
    queryFn: () => getWarehouseMetrics(),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ["inventoryAnalytics"],
    queryFn: getInventoryAnalytics,
  });

  const { data: labor } = useQuery({
    queryKey: ["laborPerformance", period],
    queryFn: () => getLaborPerformance({ period }),
  });

  const kpis: KPICard[] = (dashboard as any)?.kpis ?? [];
  const wh = warehouseMetrics as WarehouseMetrics | null;
  const inv = inventoryData as any;
  const laborData = (labor as any)?.workers ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {(["day", "week", "month"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodBtnText,
                period === p && styles.periodBtnTextActive,
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Role KPI Cards */}
      <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
      {dashLoading ? (
        <ActivityIndicator style={{ marginVertical: 20 }} color="#3b82f6" />
      ) : (
        <View style={styles.kpiGrid}>
          {kpis.map((k, i) => (
            <KPITile key={i} kpi={k} />
          ))}
          {kpis.length === 0 && (
            <Text style={styles.noDataText}>
              No KPI data available for this period.
            </Text>
          )}
        </View>
      )}

      {/* Warehouse Operations */}
      {wh && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Operations</Text>
          <MetricRow label="Pick Rate" value={wh.pickRate} unit="units/hr" />
          <MetricRow label="Pick Accuracy" value={wh.pickAccuracy} unit="%" />
          <MetricRow label="Utilization" value={wh.utilizationRate} unit="%" />
          <MetricRow label="Active Workers" value={wh.activeWorkers} />
          <MetricRow label="Orders Today" value={wh.ordersToday} />
          <MetricRow label="Lines Picked Today" value={wh.linesPickedToday} />
        </View>
      )}

      {/* Inventory Summary */}
      {inv && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <MetricRow label="Total SKUs" value={inv.totalSKUs} />
          <MetricRow label="Turnover Rate" value={inv.turnoverRate} />
          <MetricRow label="Low Stock SKUs" value={inv.lowStockCount} />
          <MetricRow label="Dead Stock SKUs" value={inv.deadStockCount} />
          {inv.topMovers?.length > 0 && (
            <>
              <Text style={styles.subHeading}>Top Movers</Text>
              {inv.topMovers.slice(0, 5).map((m: any) => (
                <View key={m.sku} style={styles.moverRow}>
                  <Text style={styles.moverSku}>{m.sku}</Text>
                  <Text style={styles.moverName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.moverVelocity}>{m.velocity}/day</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* Labor Performance */}
      {laborData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Labor Performance</Text>
          {laborData.slice(0, 10).map((w: any) => (
            <View key={w.id} style={styles.laborRow}>
              <View style={styles.laborAvatar}>
                <Text style={styles.laborInitial}>
                  {w.name?.charAt(0) ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.laborName}>{w.name}</Text>
                <Text style={styles.laborRole}>{w.role}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.laborPicks}>{w.picksToday} picks</Text>
                <Text style={styles.laborAccuracy}>
                  {w.accuracy?.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const TILE_W = (SCREEN_W - 36) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  periodRow: {
    flexDirection: "row",
    margin: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    padding: 3,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  periodBtnActive: { backgroundColor: "#fff" },
  periodBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  periodBtnTextActive: { color: "#111827" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  kpiTile: {
    width: TILE_W,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "600",
  },
  kpiValue: { fontSize: 24, fontWeight: "700", color: "#111827" },
  kpiUnit: { fontSize: 12, color: "#6b7280", fontWeight: "400" },
  kpiTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  kpiChangeText: { fontSize: 11, fontWeight: "600" },
  noDataText: { fontSize: 13, color: "#9ca3af", paddingHorizontal: 4 },
  section: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  metricLabel: { fontSize: 13, color: "#374151" },
  metricValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  subHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 6,
  },
  moverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 6,
  },
  moverSku: { fontSize: 11, color: "#3b82f6", fontWeight: "700", width: 70 },
  moverName: { flex: 1, fontSize: 12, color: "#374151" },
  moverVelocity: { fontSize: 12, fontWeight: "600", color: "#10b981" },
  laborRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    gap: 10,
  },
  laborAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  laborInitial: { color: "#fff", fontSize: 16, fontWeight: "700" },
  laborName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  laborRole: { fontSize: 11, color: "#6b7280" },
  laborPicks: { fontSize: 12, fontWeight: "700", color: "#111827" },
  laborAccuracy: { fontSize: 11, color: "#10b981" },
});
