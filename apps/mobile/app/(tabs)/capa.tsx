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
  getCAPAItems,
  createCAPAItem,
  closeCAPAItem,
  updateCAPAItem,
  type CAPAItem,
} from "../../lib/api/capa";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  PENDING_REVIEW: "#8b5cf6",
  CLOSED: "#10b981",
  OVERDUE: "#ef4444",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#991b1b",
};

export default function CAPAScreen() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"CORRECTIVE" | "PREVENTIVE">("CORRECTIVE");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");

  const { data, isLoading } = useQuery({
    queryKey: ["capa", filterStatus],
    queryFn: () => getCAPAItems({ status: filterStatus }),
  });

  const createMutation = useMutation({
    mutationFn: () => createCAPAItem({ title, description, type, priority }),
    onSuccess: () => {
      setShowCreate(false);
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["capa"] });
    },
    onError: () => Alert.alert("Error", "Failed to create CAPA item."),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      closeCAPAItem(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["capa"] }),
    onError: () => Alert.alert("Error", "Failed to close CAPA item."),
  });

  const items: CAPAItem[] =
    (data as any)?.items ?? (Array.isArray(data) ? data : []);
  const statuses = [
    "OPEN",
    "IN_PROGRESS",
    "PENDING_REVIEW",
    "CLOSED",
    "OVERDUE",
  ];
  const types: Array<"CORRECTIVE" | "PREVENTIVE"> = [
    "CORRECTIVE",
    "PREVENTIVE",
  ];
  const priorities: Array<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        <TouchableOpacity
          style={[styles.chip, !filterStatus && styles.chipActive]}
          onPress={() => setFilterStatus(undefined)}
        >
          <Text
            style={[styles.chipText, !filterStatus && styles.chipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, filterStatus === s && styles.chipActive]}
            onPress={() => setFilterStatus(filterStatus === s ? undefined : s)}
          >
            <Text
              style={[
                styles.chipText,
                filterStatus === s && styles.chipTextActive,
              ]}
            >
              {s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.header}>
        <Text style={styles.title}>CAPA Items ({items.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New CAPA</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="construct-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No CAPA items found.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.ref} numberOfLines={1}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {item.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.detail}>{item.type}</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      borderColor: PRIORITY_COLORS[item.priority] ?? "#6b7280",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: PRIORITY_COLORS[item.priority] ?? "#6b7280" },
                    ]}
                  >
                    {item.priority}
                  </Text>
                </View>
              </View>
              {item.ownerName ? (
                <Text style={styles.detail}>Owner: {item.ownerName}</Text>
              ) : null}
              {item.dueDate ? (
                <Text style={styles.detail}>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              ) : null}
              {item.status !== "CLOSED" && (
                <TouchableOpacity
                  style={[
                    styles.btn,
                    { backgroundColor: "#10b981", marginTop: 10 },
                  ]}
                  onPress={() =>
                    closeMutation.mutate({
                      id: item.id,
                      notes: "Action completed and verified.",
                    })
                  }
                >
                  <Text style={styles.btnText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New CAPA Item</Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of the issue"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Root cause, details..."
              multiline
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.toggleRow}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, type === t && styles.toggleActive]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[styles.toggleText, type === t && { color: "#fff" }]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.toggleRow}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.toggleBtn,
                    priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      priority === p && { color: "#fff" },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                  <Text style={styles.btnText}>Create</Text>
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
  ref: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e40af",
    flex: 1,
    marginRight: 8,
  },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  priorityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: { fontSize: 10, fontWeight: "700" },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
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
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 4,
    color: "#111827",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  toggleActive: { backgroundColor: "#3b82f6" },
  toggleText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
