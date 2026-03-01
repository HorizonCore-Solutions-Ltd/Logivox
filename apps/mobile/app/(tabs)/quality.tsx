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
  getQCInspections,
  startInspection,
  completeInspection,
  holdInspection,
  type QCInspection,
} from "../../lib/api/quality";
import { Play, CheckCircle, XCircle, Ban, ShieldCheck } from "lucide-react-native";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  IN_PROGRESS: "#f59e0b",
  PASSED: "#10b981",
  FAILED: "#ef4444",
  ON_HOLD: "#8b5cf6",
};

function InspectionCard({
  item,
  onStart,
  onPass,
  onFail,
  onHold,
}: {
  item: QCInspection;
  onStart: (id: string) => void;
  onPass: (id: string) => void;
  onFail: (id: string) => void;
  onHold: (id: string) => void;
}) {
  const color = STATUS_COLORS[item.status] ?? "#6b7280";
  const passedC = item.checklistItems?.filter((c) => c.result === "PASS").length ?? 0;
  const total = item.checklistItems?.length ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{item.inspectionNumber}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{item.productName ?? item.productId}</Text>
      <Text style={styles.detail}>Type: {item.type}</Text>
      {item.checklistItems?.length ? (
        <Text style={styles.detail}>
          Checklist: {passedC}/{total} passed
        </Text>
      ) : null}
      {item.scheduledDate ? (
        <Text style={styles.detail}>
          Scheduled {new Date(item.scheduledDate).toLocaleDateString()}
        </Text>
      ) : null}
      <View style={styles.cardActions}>
        {item.status === "SCHEDULED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3b82f6" }]}
            onPress={() => onStart(item.id)}
          >
            <Play size={16} color="#fff" />
            <Text style={styles.btnText}>Start</Text>
          </TouchableOpacity>
        )}
        {item.status === "IN_PROGRESS" && (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#10b981", flex: 1 }]}
              onPress={() => onPass(item.id)}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.btnText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#ef4444", flex: 1 }]}
              onPress={() => onFail(item.id)}
            >
              <XCircle size={16} color="#fff" />
              <Text style={styles.btnText}>Fail</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#8b5cf6", flex: 0.8 }]}
              onPress={() => onHold(item.id)}
            >
              <Ban size={16} color="#fff" />
              <Text style={styles.btnText}>Hold</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function QualityScreen() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["qcInspections", filterStatus],
    queryFn: () => getQCInspections({ status: filterStatus }),
  });

  const startMutation = useMutation({
    mutationFn: startInspection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qcInspections"] }),
    onError: () => Alert.alert("Error", "Failed to start inspection."),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result: "PASS" | "FAIL" }) =>
      completeInspection(id, { result, checklistItems: [], defectsFound: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qcInspections"] }),
    onError: () => Alert.alert("Error", "Failed to complete inspection."),
  });

  const holdMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      holdInspection(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qcInspections"] }),
    onError: () => Alert.alert("Error", "Failed to put inspection on hold."),
  });

  const inspection: QCInspection[] =
    (data as any)?.inspections ?? (Array.isArray(data) ? data : []);

  const summary = (data as any)?.summary;
  const statuses = ["PENDING", "IN_PROGRESS", "PASSED", "FAILED", "ON_HOLD"];

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      {summary && (
        <View style={styles.summaryBar}>
          <View style={styles.sumItem}>
            <Text style={styles.sumValue}>{summary.total ?? 0}</Text>
            <Text style={styles.sumLabel}>Total</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: "#10b981" }]}>
              {Math.round((summary.passRate ?? 0) * 100)}%
            </Text>
            <Text style={styles.sumLabel}>Pass Rate</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: "#8b5cf6" }]}>{summary.onHold ?? 0}</Text>
            <Text style={styles.sumLabel}>On Hold</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={[styles.sumValue, { color: "#ef4444" }]}>{summary.failed ?? 0}</Text>
            <Text style={styles.sumLabel}>Failed</Text>
          </View>
        </View>
      )}

      {/* Filter */}
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

      <Text style={styles.screenTitle}>QC Inspections ({inspection.length})</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : inspection.length === 0 ? (
        <View style={styles.empty}>
          <ShieldCheck size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No inspections found.</Text>
        </View>
      ) : (
        <FlatList
          data={inspection}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <InspectionCard
              item={item}
              onStart={(id) => startMutation.mutate(id)}
              onPass={(id) => completeMutation.mutate({ id, result: "PASS" })}
              onFail={(id) => completeMutation.mutate({ id, result: "FAIL" })}
              onHold={(id) => holdMutation.mutate({ id, reason: "Flagged for review" })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  sumItem: { alignItems: "center" },
  sumValue: { color: "#fff", fontSize: 20, fontWeight: "700" },
  sumLabel: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  filterStrip: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", gap: 6 },
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
  screenTitle: { fontSize: 16, fontWeight: "700", color: "#111827", paddingHorizontal: 16, marginBottom: 4 },
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
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ref: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  cardSubtitle: { fontSize: 13, color: "#374151", marginBottom: 4 },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
