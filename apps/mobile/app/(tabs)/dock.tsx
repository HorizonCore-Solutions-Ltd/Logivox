import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDockAppointments,
  getStagingZones,
  getDockStatus,
  checkInAppointment,
  markLoadReady,
  type DockAppointment,
  type StagingZone,
} from "../../lib/api/dock";
import { Ionicons } from "@expo/vector-icons";

type Tab = "appointments" | "staging";

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#6b7280",
  CONFIRMED: "#3b82f6",
  CHECKED_IN: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  LOADING: "#f97316",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
  NO_SHOW: "#dc2626",
};

const STAGING_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#10b981",
  ALLOCATED: "#3b82f6",
  LOADING: "#f59e0b",
  READY: "#8b5cf6",
  CLEARED: "#6b7280",
};

const TYPE_ICONS: Record<string, string> = {
  INBOUND: "arrow-down-circle-outline",
  OUTBOUND: "arrow-up-circle-outline",
  CROSS_DOCK: "swap-horizontal-outline",
  MAINTENANCE: "construct-outline",
  OTHER: "ellipsis-horizontal-outline",
};

function AppointmentCard({
  item,
  onCheckIn,
}: {
  item: DockAppointment;
  onCheckIn: (id: string) => void;
}) {
  const start = new Date(item.scheduledStart).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(item.scheduledEnd).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons
            name={(TYPE_ICONS[item.appointmentType] ?? "ellipsis-horizontal-outline") as any}
            size={18}
            color="#3b82f6"
          />
          <Text style={styles.ref}>{item.appointmentNumber}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: APPOINTMENT_STATUS_COLORS[item.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.detail}>
        {start} – {end}
      </Text>
      {item.carrierName ? (
        <Text style={styles.detail}>Carrier: {item.carrierName}</Text>
      ) : null}
      {item.driverName ? (
        <Text style={styles.detail}>Driver: {item.driverName}</Text>
      ) : null}
      {item.vehicleNumber ? (
        <Text style={styles.detail}>Vehicle: {item.vehicleNumber}</Text>
      ) : null}
      {item.trailerNumber ? (
        <Text style={styles.detail}>Trailer: {item.trailerNumber}</Text>
      ) : null}
      {item.dockDoor ? (
        <Text style={styles.detail}>
          <Text style={{ fontWeight: "700" }}>Door {item.dockDoor}</Text>
        </Text>
      ) : null}
      {item.expectedPallets ? (
        <Text style={styles.detail}>Expected pallets: {item.expectedPallets}</Text>
      ) : null}
      {(item.status === "SCHEDULED" || item.status === "CONFIRMED") &&
      item.appointmentType === "OUTBOUND" ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#3b82f6", marginTop: 10 }]}
          onPress={() => onCheckIn(item.id)}
        >
          <Ionicons name="enter-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Check In Driver</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StagingZoneCard({
  zone,
  onMarkReady,
}: {
  zone: StagingZone;
  onMarkReady: (zoneId: string, shipmentId: string) => void;
}) {
  const pct = zone.utilizationPct ?? Math.round((zone.currentItems / zone.capacity) * 100);
  const barColor =
    pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#10b981";
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{zone.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STAGING_STATUS_COLORS[zone.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{zone.status}</Text>
        </View>
      </View>
      <Text style={styles.detail}>
        Zone: {zone.zone} · Type: {zone.type}
      </Text>
      {zone.shipmentNumber ? (
        <Text style={styles.detail}>Shipment: {zone.shipmentNumber}</Text>
      ) : null}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {zone.currentItems}/{zone.capacity} items
        </Text>
        <Text style={[styles.progressLabel, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={styles.trackBg}>
        <View
          style={[styles.trackFill, { width: `${pct}%` as any, backgroundColor: barColor }]}
        />
      </View>
      {zone.status === "LOADING" && zone.shipmentId ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#8b5cf6", marginTop: 10 }]}
          onPress={() => onMarkReady(zone.id, zone.shipmentId!)}
        >
          <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Mark Load Ready</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function DockScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("appointments");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ["dockStatus"],
    queryFn: getDockStatus,
  });

  const { data: appointmentsData, isLoading: apptLoading } = useQuery({
    queryKey: ["dockAppointments", typeFilter],
    queryFn: () => getDockAppointments({ appointmentType: typeFilter ?? undefined }),
    enabled: tab === "appointments",
  });

  const { data: stagingData, isLoading: stagingLoading } = useQuery({
    queryKey: ["stagingZones"],
    queryFn: getStagingZones,
    enabled: tab === "staging",
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInAppointment(id, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dockAppointments"] }),
    onError: () => Alert.alert("Error", "Check-in failed."),
  });

  const markReadyMutation = useMutation({
    mutationFn: ({ shipmentId }: { zoneId: string; shipmentId: string }) =>
      markLoadReady(shipmentId, "MOBILE_USER"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stagingZones"] }),
    onError: () => Alert.alert("Error", "Failed to mark load ready."),
  });

  const dockStatus = statusData as any;
  const appointments: DockAppointment[] =
    (appointmentsData as any)?.appointments ?? [];
  const zones: StagingZone[] = (stagingData as any)?.zones ?? [];

  return (
    <View style={styles.container}>
      {/* Dock status strip */}
      {dockStatus ? (
        <View style={styles.statusStrip}>
          {[
            { label: "Doors Active", value: `${dockStatus.activeDoors}/${dockStatus.totalDoors}`, color: "#10b981" },
            { label: "Today", value: dockStatus.appointmentsToday, color: "#3b82f6" },
            { label: "Pending", value: dockStatus.pendingCheckIn, color: "#f59e0b" },
          ].map((s) => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["appointments", "staging"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "appointments" ? "Dock Appointments" : "Staging Zones"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "appointments" ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ padding: 8, gap: 6, flexDirection: "row" }}>
            {[null, "OUTBOUND", "INBOUND", "CROSS_DOCK"].map((f) => (
              <TouchableOpacity
                key={f ?? "ALL"}
                style={[styles.chip, typeFilter === f && styles.chipActive]}
                onPress={() => setTypeFilter(f)}
              >
                <Text style={[styles.chipText, typeFilter === f && styles.chipTextActive]}>
                  {f ?? "All"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {apptLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
          ) : (
            <FlatList
              data={appointments}
              keyExtractor={(a) => a.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <AppointmentCard
                  item={item}
                  onCheckIn={(id) => checkInMutation.mutate(id)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No appointments today.</Text>
                </View>
              }
            />
          )}
        </>
      ) : stagingLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(z) => z.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <StagingZoneCard
              zone={item}
              onMarkReady={(zoneId, shipmentId) =>
                markReadyMutation.mutate({ zoneId, shipmentId })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="layers-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No staging zones configured.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  statusStrip: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 12, paddingHorizontal: 8 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  tabRow: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#2563eb" },
  tabBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  tabBtnTextActive: { color: "#2563eb" },
  filterScroll: { maxHeight: 48 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  ref: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  detail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  progressLabel: { fontSize: 12, color: "#6b7280" },
  trackBg: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 4 },
  trackFill: { height: 6, borderRadius: 3 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 7 },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
