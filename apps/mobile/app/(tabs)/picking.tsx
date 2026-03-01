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
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPickingQueue,
  pickItem,
  reportShortPick,
  type PickingOrder,
  type PickingItem,
} from "../../lib/api/orders";
import { getPickerMetrics } from "../../lib/api/analytics";
import { VoiceCommandButton } from "../../components/VoiceCommand";
import { Ionicons } from "@expo/vector-icons";

type PickTask = PickingItem & { orderId: string; orderNumber: string };

function KPIBar({
  picks,
  accuracy,
  streak,
}: {
  picks: number;
  accuracy: number;
  streak: number;
}) {
  return (
    <View style={styles.kpiBar}>
      <View style={styles.kpiItem}>
        <Text style={styles.kpiValue}>{picks}</Text>
        <Text style={styles.kpiLabel}>Picks Today</Text>
      </View>
      <View style={styles.kpiSep} />
      <View style={styles.kpiItem}>
        <Text style={[styles.kpiValue, accuracy < 98 && { color: "#f59e0b" }]}>
          {accuracy.toFixed(1)}%
        </Text>
        <Text style={styles.kpiLabel}>Accuracy</Text>
      </View>
      <View style={styles.kpiSep} />
      <View style={styles.kpiItem}>
        <Text style={styles.kpiValue}>{streak}d</Text>
        <Text style={styles.kpiLabel}>Error-free Streak</Text>
      </View>
    </View>
  );
}

function TaskCard({
  task,
  onConfirm,
  onShort,
}: {
  task: PickTask;
  onConfirm: (task: PickTask) => void;
  onShort: (task: PickTask) => void;
}) {
  const statusColor: Record<string, string> = {
    PENDING: "#6b7280",
    ASSIGNED: "#3b82f6",
    PARTIAL: "#f59e0b",
    PICKED: "#10b981",
    SHORT: "#ef4444",
    SKIPPED: "#9ca3af",
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.sku}>{task.sku}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: statusColor[task.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{task.status.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{task.name}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.detail}>
          <Ionicons name="location-outline" size={12} /> {task.locationCode} ({task.zone})
        </Text>
        <Text style={styles.detail}>
          Qty: <Text style={{ fontWeight: "700" }}>{task.orderedQuantity}</Text>
        </Text>
      </View>
      {task.orderNumber ? (
        <Text style={styles.detail}>Order: {task.orderNumber}</Text>
      ) : null}
      {task.status !== "PICKED" && task.status !== "SHORT" ? (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
            onPress={() => onConfirm(task)}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => onShort(task)}
          >
            <Ionicons name="alert-circle-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Short Pick</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function PickingScreen() {
  const queryClient = useQueryClient();
  const [shortTask, setShortTask] = useState<PickTask | null>(null);
  const [shortQty, setShortQty] = useState("");
  const [shortReason, setShortReason] = useState("");

  const { data: metricsData } = useQuery({
    queryKey: ["pickerMetrics"],
    queryFn: getPickerMetrics,
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["pickingQueue"],
    queryFn: () => getPickingQueue(),
  });

  const confirmMutation = useMutation({
    mutationFn: (task: PickTask) =>
      pickItem({ orderId: task.orderId, itemId: task.id, quantity: task.orderedQuantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pickingQueue"] }),
    onError: () => Alert.alert("Error", "Failed to confirm pick. Please try again."),
  });

  const shortMutation = useMutation({
    mutationFn: ({
      task,
      qty,
      reason,
    }: {
      task: PickTask;
      qty: number;
      reason: string;
    }) => reportShortPick(task.orderId, task.id, qty, reason),
    onSuccess: () => {
      setShortTask(null);
      setShortQty("");
      setShortReason("");
      queryClient.invalidateQueries({ queryKey: ["pickingQueue"] });
    },
    onError: () => Alert.alert("Error", "Failed to report short pick."),
  });

  const orders: PickingOrder[] =
    (tasksData as any)?.orders ?? (Array.isArray(tasksData) ? (tasksData as PickingOrder[]) : []);
  const tasks: PickTask[] = orders.flatMap((o) =>
    (o.items ?? []).map((item) => ({ ...item, orderId: o.id, orderNumber: o.soNumber }))
  );
  const metrics = metricsData as {
    picksToday: number;
    accuracy: number;
    streak?: number;
  } | null;

  const handleShortSubmit = () => {
    if (!shortTask) return;
    const qty = parseInt(shortQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert("Invalid", "Enter a valid picked quantity.");
      return;
    }
    shortMutation.mutate({ task: shortTask, qty, reason: shortReason });
  };

  return (
    <View style={styles.container}>
      {/* KPI Bar */}
      {metrics ? (
        <KPIBar
          picks={metrics.picksToday}
          accuracy={metrics.accuracy}
          streak={metrics.streak ?? 0}
        />
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>My Picking Tasks</Text>
        <VoiceCommandButton screen="picking" />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color="#10b981" />
          <Text style={styles.emptyText}>No tasks assigned — check back soon!</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onConfirm={(t) => confirmMutation.mutate(t)}
              onShort={(t) => setShortTask(t)}
            />
          )}
        />
      )}

      {/* Short Pick Modal */}
      <Modal visible={!!shortTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Short Pick</Text>
            {shortTask ? (
              <Text style={styles.modalSubtitle}>
                {shortTask.sku} — {shortTask.name}
              </Text>
            ) : null}
            <Text style={styles.inputLabel}>Qty actually picked</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={shortQty}
              onChangeText={setShortQty}
              placeholder="e.g. 3"
            />
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: "top" }]}
              value={shortReason}
              onChangeText={setShortReason}
              placeholder="Out of stock, damaged, etc."
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#6b7280" }]}
                onPress={() => setShortTask(null)}
              >
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
                onPress={handleShortSubmit}
                disabled={shortMutation.isPending}
              >
                {shortMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>Submit</Text>
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
  kpiBar: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  kpiItem: { alignItems: "center" },
  kpiValue: { color: "#fff", fontSize: 20, fontWeight: "700" },
  kpiLabel: { color: "#93c5fd", fontSize: 11, marginTop: 2 },
  kpiSep: { width: 1, height: 32, backgroundColor: "#334155" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sku: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  cardSubtitle: { fontSize: 13, color: "#374151", marginBottom: 6 },
  detail: { fontSize: 12, color: "#6b7280" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 14 },
  inputLabel: { fontSize: 12, color: "#374151", fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
    color: "#111827",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
});
