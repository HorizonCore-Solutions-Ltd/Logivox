import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  getLaborDashboard,
  getActiveWorkers,
  getFloorHeatmap,
  type ActiveWorker,
  type LaborDashboard,
  type HeatmapCell,
} from "../../lib/api/laborMgmt";
import { Ionicons } from "@expo/vector-icons";

type Tab = "workers" | "heatmap";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",
  BREAK: "#f59e0b",
  IDLE: "#6b7280",
  OFFLINE: "#ef4444",
};

const CONGESTION_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <View style={{ marginTop: 4 }}>
      <View style={styles.progressRow}>
        <Text style={[styles.effLabel, { color }]}>{value.toFixed(0)}% efficiency</Text>
      </View>
      <View style={styles.trackBg}>
        <View style={[styles.trackFill, { width: `${Math.min(value, 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function WorkerCard({ worker }: { worker: ActiveWorker }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.ref}>
            {worker.firstName} {worker.lastName}
          </Text>
          <Text style={styles.detail}>{worker.position ?? worker.department ?? "—"}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[worker.status] ?? "#6b7280" }]}>
          <Text style={styles.badgeText}>{worker.status}</Text>
        </View>
      </View>
      {worker.currentTask ? (
        <Text style={styles.detail}>
          <Ionicons name="list-outline" size={12} /> {worker.currentTask}
        </Text>
      ) : null}
      {worker.currentLocation ? (
        <Text style={styles.detail}>
          <Ionicons name="location-outline" size={12} /> {worker.currentLocation}
        </Text>
      ) : null}
      <View style={styles.statsRow}>
        {worker.unitsToday != null ? (
          <Text style={styles.stat}>
            <Text style={styles.statVal}>{worker.unitsToday}</Text> units
          </Text>
        ) : null}
        {worker.throughput != null ? (
          <Text style={styles.stat}>
            <Text style={styles.statVal}>{worker.throughput}</Text>/hr
          </Text>
        ) : null}
        {worker.overtime ? (
          <View style={styles.overtimeBadge}>
            <Text style={styles.overtimeText}>OT</Text>
          </View>
        ) : null}
      </View>
      {worker.efficiencyPct != null ? (
        <EfficiencyBar value={worker.efficiencyPct} />
      ) : null}
    </View>
  );
}

function HeatmapCard({ cell }: { cell: HeatmapCell }) {
  const color = CONGESTION_COLORS[cell.congestionLevel] ?? "#6b7280";
  return (
    <View style={[styles.heatCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{cell.zone}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{cell.congestionLevel}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          <Text style={styles.statVal}>{cell.workerCount}</Text> workers
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.statVal}>{cell.throughput}</Text> units/hr
        </Text>
        <Text style={styles.stat}>
          Activity: <Text style={[styles.statVal, { color }]}>{cell.activityScore}</Text>
        </Text>
      </View>
      <View style={styles.trackBg}>
        <View style={[styles.trackFill, { width: `${cell.activityScore}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function LaborScreen() {
  const [tab, setTab] = useState<Tab>("workers");
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ["laborDashboard"],
    queryFn: () => getLaborDashboard(),
  });

  const { data: workersData, isLoading: workersLoading, refetch: refetchWorkers } = useQuery({
    queryKey: ["activeWorkers"],
    queryFn: () => getActiveWorkers(),
    enabled: tab === "workers",
  });

  const { data: heatmapData, isLoading: heatLoading, refetch: refetchHeat } = useQuery({
    queryKey: ["floorHeatmap"],
    queryFn: () => getFloorHeatmap(),
    enabled: tab === "heatmap",
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDash(), tab === "workers" ? refetchWorkers() : refetchHeat()]);
    setRefreshing(false);
  };

  const dashboard = dashboardData as LaborDashboard | undefined;
  const workers: ActiveWorker[] = (workersData as any)?.workers ?? [];
  const cells: HeatmapCell[] = (heatmapData as any)?.cells ?? [];

  return (
    <View style={styles.container}>
      {/* Dashboard summary */}
      {dashboard ? (
        <View style={styles.kpiBar}>
          {[
            { label: "Active", value: dashboard.activeWorkers, total: dashboard.totalWorkers, color: "#10b981" },
            { label: "On Break", value: dashboard.onBreak, total: null, color: "#f59e0b" },
            { label: "Avg Eff.", value: `${dashboard.avgEfficiencyPct?.toFixed(0) ?? 0}%`, total: null, color: "#3b82f6" },
            { label: "Units", value: dashboard.totalUnitsToday, total: null, color: "#8b5cf6" },
          ].map((k) => (
            <View key={k.label} style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              {k.total != null ? (
                <Text style={styles.kpiLabel}>of {k.total}</Text>
              ) : null}
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
      ) : dashLoading ? (
        <View style={[styles.kpiBar, { justifyContent: "center" }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["workers", "heatmap"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "workers" ? "Workers" : "Floor Heatmap"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "workers" ? (
        workersLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
        ) : (
          <FlatList
            data={workers}
            keyExtractor={(w) => w.employeeId}
            contentContainerStyle={{ padding: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => <WorkerCard worker={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No workers clocked in.</Text>
              </View>
            }
          />
        )
      ) : heatLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={cells}
          keyExtractor={(c) => c.zone}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <HeatmapCard cell={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="grid-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No heatmap data available.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  kpiBar: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 14, paddingHorizontal: 8 },
  kpiItem: { flex: 1, alignItems: "center" },
  kpiValue: { fontSize: 20, fontWeight: "700", color: "#fff" },
  kpiLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  tabRow: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#2563eb" },
  tabBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  tabBtnTextActive: { color: "#2563eb" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  heatCard: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ref: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  detail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 14, marginTop: 6, alignItems: "center" },
  stat: { fontSize: 12, color: "#6b7280" },
  statVal: { fontWeight: "700", color: "#1e293b" },
  overtimeBadge: { backgroundColor: "#fde68a", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  overtimeText: { fontSize: 10, fontWeight: "700", color: "#92400e" },
  effLabel: { fontSize: 12, fontWeight: "600" },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  trackBg: { height: 5, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 4 },
  trackFill: { height: 5, borderRadius: 3 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
