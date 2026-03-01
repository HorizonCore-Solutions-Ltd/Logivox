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
  getReturns,
  getReturnReasons,
  createReturn,
  approveReturn,
  receiveReturn,
  inspectReturn,
  type ReturnRequest,
} from "../../lib/api/returns";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  APPROVED: "#3b82f6",
  REJECTED: "#ef4444",
  RECEIVED: "#8b5cf6",
  INSPECTING: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#374151",
};

function ReturnCard({
  item,
  onAction,
}: {
  item: ReturnRequest;
  onAction: (action: string, id: string) => void;
}) {
  const color = STATUS_COLORS[item.status] ?? "#6b7280";
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{item.rmaNumber}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{item.customerName ?? `Order ${item.orderId}`}</Text>
      <Text style={styles.detail}>
        {item.lines?.length ?? 0} line(s) · {item.reason}
      </Text>
      <Text style={styles.detail}>
        Requested {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View style={styles.cardActions}>
        {item.status === "PENDING" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#10b981" }]}
            onPress={() => onAction("approve", item.id)}
          >
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
        )}
        {item.status === "APPROVED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3b82f6" }]}
            onPress={() => onAction("receive", item.id)}
          >
            <Text style={styles.btnText}>Receive</Text>
          </TouchableOpacity>
        )}
        {item.status === "RECEIVED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#f59e0b" }]}
            onPress={() => onAction("inspect", item.id)}
          >
            <Text style={styles.btnText}>Inspect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ReturnsScreen() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["returns", filterStatus],
    queryFn: () => getReturns({ status: filterStatus }),
  });

  const { data: reasons } = useQuery({
    queryKey: ["returnReasons"],
    queryFn: getReturnReasons,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createReturn({ customerId: "UNKNOWN", reason: newReason, orderId: newOrderId, lines: [] }),
    onSuccess: () => {
      setShowCreate(false);
      setNewOrderId("");
      setNewReason("");
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    },
    onError: () => Alert.alert("Error", "Failed to create return request."),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, id }: { action: string; id: string }) => {
      if (action === "approve") return approveReturn(id);
      if (action === "receive") return receiveReturn(id, []);
      return inspectReturn(id, []);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["returns"] }),
    onError: () => Alert.alert("Error", "Action failed. Please try again."),
  });

  const items: ReturnRequest[] =
    (returnsData as any)?.returns ?? (returnsData as any)?.items ?? [];

  const statuses = ["PENDING", "APPROVED", "RECEIVED", "INSPECTING", "COMPLETED", "REJECTED"];

  return (
    <View style={styles.container}>
      {/* Filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        <TouchableOpacity
          style={[styles.chip, !filterStatus && styles.chipActive]}
          onPress={() => setFilterStatus(undefined)}
        >
          <Text style={[styles.chipText, !filterStatus && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, filterStatus === s && styles.chipActive]}
            onPress={() => setFilterStatus(filterStatus === s ? undefined : s)}
          >
            <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.header}>
        <Text style={styles.title}>Returns ({items.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New Return</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="return-up-back-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No returns found.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <ReturnCard
              item={item}
              onAction={(action, id) => actionMutation.mutate({ action, id })}
            />
          )}
        />
      )}

      {/* Create Return Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Return Request</Text>
            <Text style={styles.inputLabel}>Order ID</Text>
            <TextInput
              style={styles.input}
              value={newOrderId}
              onChangeText={setNewOrderId}
              placeholder="ORD-00123"
            />
            <Text style={styles.inputLabel}>Return Reason</Text>
            {reasons ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(reasons as Array<{ id: string; name: string }>).map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.chip,
                      { marginBottom: 0, marginRight: 6 },
                      newReason === r.name && styles.chipActive,
                    ]}
                    onPress={() => setNewReason(r.name)}
                  >
                    <Text style={[styles.chipText, newReason === r.name && styles.chipTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                style={styles.input}
                value={newReason}
                onChangeText={setNewReason}
                placeholder="Damaged, Wrong item, etc."
              />
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#6b7280" }]}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#3b82f6" }]}
                onPress={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Submit</Text>
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
  filterStrip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginBottom: 4,
  },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
  ref: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  cardSubtitle: { fontSize: 13, color: "#374151", marginBottom: 4 },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 4,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
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
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 12 },
});
