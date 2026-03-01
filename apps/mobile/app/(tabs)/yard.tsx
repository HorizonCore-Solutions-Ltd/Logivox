import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGateLog,
  getShunterTasks,
  createGateEntry,
  checkOutGateEntry,
  acceptShunterTask,
  completeShunterTask,
  type GateEntry,
  type ShunterTask,
} from "../../lib/api/yard";
import { Ionicons } from "@expo/vector-icons";

type Tab = "gatelog" | "shunter";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CHECKED_IN: "#3b82f6",
  ON_SITE: "#10b981",
  CHECKED_OUT: "#6b7280",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  NORMAL: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

function GateEntryCard({
  item,
  onCheckOut,
}: {
  item: GateEntry;
  onCheckOut: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name={
              item.direction === "INBOUND"
                ? "arrow-down-circle"
                : "arrow-up-circle"
            }
            size={20}
            color={item.direction === "INBOUND" ? "#3b82f6" : "#f59e0b"}
          />
          <Text style={styles.ref}>{item.vehicleNumber}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
        </View>
      </View>
      {item.trailerNumber ? (
        <Text style={styles.detail}>Trailer: {item.trailerNumber}</Text>
      ) : null}
      {item.driverName ? (
        <Text style={styles.detail}>Driver: {item.driverName}</Text>
      ) : null}
      {item.carrierName ? (
        <Text style={styles.detail}>Carrier: {item.carrierName}</Text>
      ) : null}
      {item.appointmentNumber ? (
        <Text style={styles.detail}>Appt: {item.appointmentNumber}</Text>
      ) : null}
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
      {item.status === "ON_SITE" ? (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: "#6b7280", marginTop: 8 },
          ]}
          onPress={() => onCheckOut(item.id)}
        >
          <Ionicons name="exit-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Check Out</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ShunterCard({
  item,
  onAccept,
  onComplete,
}: {
  item: ShunterTask;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{item.trailerNumber}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: PRIORITY_COLORS[item.priority] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{item.priority}</Text>
        </View>
      </View>
      <View style={styles.routeRow}>
        <Text style={styles.routeText}>{item.fromLocationName ?? "Yard"}</Text>
        <Ionicons name="arrow-forward" size={16} color="#6b7280" />
        <Text style={styles.routeText}>{item.toLocationName ?? "Dock"}</Text>
      </View>
      {item.notes ? (
        <View
          style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: "#fef3c7",
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 13, color: "#92400e" }}>
            📝 {item.notes}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280",
            alignSelf: "flex-start",
            marginTop: 4,
          },
        ]}
      >
        <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
      </View>
      <View style={styles.cardActions}>
        {item.status === "PENDING" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#3b82f6" }]}
            onPress={() => onAccept(item.id)}
          >
            <Ionicons name="hand-right-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
        ) : null}
        {item.status === "IN_PROGRESS" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
            onPress={() => onComplete(item.id)}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Complete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function YardScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("gatelog");
  const [dirFilter, setDirFilter] = useState<
    "INBOUND" | "OUTBOUND" | undefined
  >(undefined);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [form, setForm] = useState({
    direction: "INBOUND" as "INBOUND" | "OUTBOUND",
    vehicleNumber: "",
    trailerNumber: "",
    driverName: "",
    carrierName: "",
  });

  const { data: gateData, isLoading: gateLoading } = useQuery({
    queryKey: ["gateLog", dirFilter],
    queryFn: () => getGateLog(dirFilter),
    enabled: tab === "gatelog",
  });

  const { data: shunterData, isLoading: shunterLoading } = useQuery({
    queryKey: ["shunterTasks"],
    queryFn: () => getShunterTasks(),
    enabled: tab === "shunter",
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => checkOutGateEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gateLog"] }),
    onError: () => Alert.alert("Error", "Failed to check out vehicle."),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptShunterTask(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shunterTasks"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeShunterTask(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shunterTasks"] }),
    onError: () => Alert.alert("Error", "Failed to complete task."),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGateEntry({
        direction: form.direction,
        vehicleNumber: form.vehicleNumber,
        trailerNumber: form.trailerNumber || undefined,
        driverName: form.driverName || undefined,
        carrierName: form.carrierName || undefined,
      }),
    onSuccess: () => {
      setShowNewEntry(false);
      setForm({
        direction: "INBOUND",
        vehicleNumber: "",
        trailerNumber: "",
        driverName: "",
        carrierName: "",
      });
      queryClient.invalidateQueries({ queryKey: ["gateLog"] });
    },
    onError: () => Alert.alert("Error", "Failed to create gate entry."),
  });

  const summary = (gateData as any)?.summary;
  const gateEntries: GateEntry[] = (gateData as any)?.entries ?? [];
  const shunterTasks: ShunterTask[] = (shunterData as any)?.tasks ?? [];

  return (
    <View style={styles.container}>
      {/* Summary strip */}
      {summary ? (
        <View style={styles.summaryRow}>
          {[
            { label: "On Site", value: summary.onSite, color: "#10b981" },
            { label: "Inbound", value: summary.inboundToday, color: "#3b82f6" },
            {
              label: "Outbound",
              value: summary.outboundToday,
              color: "#f59e0b",
            },
            {
              label: "Pending",
              value: summary.pendingCheckIn,
              color: "#ef4444",
            },
          ].map((s) => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["gatelog", "shunter"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "gatelog" ? "Gate Log" : "Shunter Tasks"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "gatelog" ? (
        <>
          {/* Direction filter */}
          <View style={styles.filterRow}>
            {([undefined, "INBOUND", "OUTBOUND"] as const).map((d) => (
              <TouchableOpacity
                key={d ?? "ALL"}
                style={[styles.chip, dirFilter === d && styles.chipActive]}
                onPress={() => setDirFilter(d)}
              >
                <Text
                  style={[
                    styles.chipText,
                    dirFilter === d && styles.chipTextActive,
                  ]}
                >
                  {d ?? "All"}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: "#1e3a5f", marginLeft: "auto" },
              ]}
              onPress={() => setShowNewEntry(true)}
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={[styles.chipText, { color: "#fff" }]}>New</Text>
            </TouchableOpacity>
          </View>
          {gateLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
          ) : (
            <FlatList
              data={gateEntries}
              keyExtractor={(e) => e.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <GateEntryCard
                  item={item}
                  onCheckOut={(id) => checkOutMutation.mutate(id)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="car-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    No gate entries in last 24 hrs.
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : shunterLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={shunterTasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <ShunterCard
              item={item}
              onAccept={(id) => acceptMutation.mutate(id)}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="swap-horizontal-outline"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No shunter tasks pending.</Text>
            </View>
          }
        />
      )}

      {/* New Gate Entry Modal */}
      <Modal visible={showNewEntry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Gate Entry</Text>
            <View style={styles.dirToggle}>
              {(["INBOUND", "OUTBOUND"] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dirBtn,
                    form.direction === d && styles.dirBtnActive,
                  ]}
                  onPress={() => setForm((f) => ({ ...f, direction: d }))}
                >
                  <Text
                    style={[
                      styles.dirBtnText,
                      form.direction === d && { color: "#fff" },
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {[
              {
                key: "vehicleNumber" as const,
                label: "Vehicle Number *",
                placeholder: "e.g. AB12 CDE",
              },
              {
                key: "trailerNumber" as const,
                label: "Trailer Number",
                placeholder: "e.g. TRL-001",
              },
              {
                key: "driverName" as const,
                label: "Driver Name",
                placeholder: "e.g. John Smith",
              },
              {
                key: "carrierName" as const,
                label: "Carrier",
                placeholder: "e.g. DHL",
              },
            ].map((f) => (
              <View key={f.key}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={(v) =>
                    setForm((prev) => ({ ...prev, [f.key]: v }))
                  }
                  placeholder={f.placeholder}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#6b7280" }]}
                onPress={() => setShowNewEntry(false)}
              >
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#1e3a5f" }]}
                onPress={() => {
                  if (!form.vehicleNumber.trim()) {
                    Alert.alert("Required", "Vehicle number is required.");
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#2563eb" },
  tabBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  tabBtnTextActive: { color: "#2563eb" },
  filterRow: { flexDirection: "row", padding: 8, gap: 6, alignItems: "center" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ref: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  detail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  timestamp: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  routeText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  dirToggle: { flexDirection: "row", gap: 8, marginBottom: 16 },
  dirBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dirBtnActive: { backgroundColor: "#1e3a5f", borderColor: "#1e3a5f" },
  dirBtnText: { fontWeight: "700", color: "#374151" },
  inputLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f8fafc",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
});
