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
  getCycleCounts,
  createCycleCount,
  startCycleCount,
  recordCount,
  submitCycleCount,
  type CycleCount,
  type CycleCountLine,
} from "../../lib/api/cycleCount";
import { Ionicons } from "@expo/vector-icons";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#6b7280",
  IN_PROGRESS: "#f59e0b",
  PENDING_REVIEW: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

function CountLineRow({
  line,
  onRecord,
}: {
  line: CycleCountLine;
  onRecord: (lineId: string, qty: number) => void;
}) {
  const [qty, setQty] = useState(line.countedQty?.toString() ?? "");
  const hasVariance = line.countedQty !== undefined && line.countedQty !== line.expectedQty;
  return (
    <View style={[styles.lineRow, hasVariance && styles.lineVariance]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.lineSku}>{line.sku}</Text>
        <Text style={styles.lineLocation}>{line.location}</Text>
        <Text style={styles.lineExpected}>Expected: {line.expectedQty}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          style={styles.qtyInput}
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
          placeholder="Count"
        />
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => {
            const n = parseInt(qty, 10);
            if (isNaN(n)) {
              Alert.alert("Invalid", "Enter a valid number.");
              return;
            }
            onRecord(line.id, n);
          }}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CycleCountScreen() {
  const queryClient = useQueryClient();
  const [selectedCount, setSelectedCount] = useState<CycleCount | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<CycleCount["type"]>("PARTIAL");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["cycleCounts", filterStatus],
    queryFn: () => getCycleCounts({ status: filterStatus }),
  });

  const createMutation = useMutation({
    mutationFn: () => createCycleCount({ type: newType }),
    onSuccess: () => {
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
    },
    onError: () => Alert.alert("Error", "Failed to create cycle count."),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startCycleCount(id),
    onSuccess: (updated) => {
      setSelectedCount(updated as CycleCount);
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
    },
    onError: () => Alert.alert("Error", "Failed to start count."),
  });

  const recordMutation = useMutation({
    mutationFn: ({ cycleCountId, lineId, qty }: { cycleCountId: string; lineId: string; qty: number }) =>
      recordCount(cycleCountId, lineId, { countedQty: qty }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycleCounts"] }),
    onError: () => Alert.alert("Error", "Failed to record count."),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitCycleCount(id, "Submitted via mobile"),
    onSuccess: () => {
      setSelectedCount(null);
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
    },
    onError: () => Alert.alert("Error", "Failed to submit."),
  });

  const counts: CycleCount[] = (data as any)?.items ?? (Array.isArray(data) ? data : []);
  const statuses = ["SCHEDULED", "IN_PROGRESS", "PENDING_REVIEW", "COMPLETED"];
  const types: Array<CycleCount["type"]> = ["FULL", "PARTIAL", "LOCATION", "ABC"];

  return (
    <View style={styles.container}>
      {/* Selected count detail view */}
      {selectedCount ? (
        <View style={{ flex: 1 }}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedCount(null)}>
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedCount.reference}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: STATUS_COLORS[selectedCount.status] ?? "#6b7280" },
              ]}
            >
              <Text style={styles.badgeText}>{selectedCount.status.replace("_", " ")}</Text>
            </View>
          </View>
          <Text style={styles.detailMeta}>
            {selectedCount.countedLines}/{selectedCount.totalLines} lines counted ·{" "}
            {selectedCount.varianceCount} variances
          </Text>
          {selectedCount.status === "SCHEDULED" && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#3b82f6", margin: 12, alignSelf: "stretch" }]}
              onPress={() => startMutation.mutate(selectedCount.id)}
            >
              <Text style={styles.btnText}>Start Count</Text>
            </TouchableOpacity>
          )}
          {selectedCount.status === "IN_PROGRESS" && selectedCount.lines ? (
            <>
              <FlatList
                data={selectedCount.lines}
                keyExtractor={(l) => l.id}
                contentContainerStyle={{ padding: 12 }}
                renderItem={({ item }) => (
                  <CountLineRow
                    line={item}
                    onRecord={(lineId, qty) =>
                      recordMutation.mutate({
                        cycleCountId: selectedCount.id,
                        lineId,
                        qty,
                      })
                    }
                  />
                )}
              />
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#10b981", margin: 12, alignSelf: "stretch" }]}
                onPress={() => submitMutation.mutate(selectedCount.id)}
              >
                <Text style={styles.btnText}>Submit for Review</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : (
        <>
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
                  {s.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.header}>
            <Text style={styles.title}>Cycle Counts ({counts.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>New Count</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
          ) : counts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No cycle counts found.</Text>
            </View>
          ) : (
            <FlatList
              data={counts}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setSelectedCount(item)}
                >
                  <View style={styles.cardRow}>
                    <Text style={styles.ref}>{item.reference}</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280" },
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
                    </View>
                  </View>
                  <Text style={styles.detail}>
                    Type: {item.type} · {item.countedLines}/{item.totalLines} lines
                  </Text>
                  {item.varianceCount > 0 && (
                    <Text style={[styles.detail, { color: "#f59e0b" }]}>
                      {item.varianceCount} variance(s)
                    </Text>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#6b7280"
                    style={{ alignSelf: "flex-end", marginTop: 4 }}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Cycle Count</Text>
            <Text style={styles.inputLabel}>Count Type</Text>
            <View style={styles.toggleRow}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, newType === t && styles.toggleActive]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.toggleText, newType === t && { color: "#fff" }]}>{t}</Text>
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
  filterStrip: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#e5e7eb" },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#3b82f6", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ref: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  detailTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
  detailMeta: { fontSize: 12, color: "#6b7280", paddingHorizontal: 16, paddingVertical: 8 },
  lineRow: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  lineVariance: { borderLeftWidth: 3, borderColor: "#f59e0b" },
  lineSku: { fontSize: 13, fontWeight: "700", color: "#1e40af" },
  lineLocation: { fontSize: 12, color: "#6b7280" },
  lineExpected: { fontSize: 12, color: "#374151" },
  qtyInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 6, width: 60, fontSize: 14, textAlign: "center", color: "#111827" },
  recordBtn: { backgroundColor: "#3b82f6", padding: 8, borderRadius: 6 },
  btn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 6, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  inputLabel: { fontSize: 12, color: "#374151", fontWeight: "600", marginBottom: 8 },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: "#e5e7eb" },
  toggleActive: { backgroundColor: "#3b82f6" },
  toggleText: { fontSize: 13, color: "#374151", fontWeight: "600" },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
