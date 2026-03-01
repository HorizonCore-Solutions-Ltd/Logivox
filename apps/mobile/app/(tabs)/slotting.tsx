import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSlottingRecommendations,
  applyRecommendation,
  rejectRecommendation,
  runSlottingOptimisation,
  type SlottingRecommendation,
} from "../../lib/api/slotting";
import { Ionicons } from "@expo/vector-icons";

type StatusFilter = "PENDING" | "APPROVED" | "APPLIED" | "REJECTED" | "ALL";

const VELOCITY_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#3b82f6",
  APPLIED: "#10b981",
  REJECTED: "#6b7280",
};

function RecommendationCard({
  item,
  onApply,
  onReject,
}: {
  item: SlottingRecommendation;
  onApply: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const timeSaving =
    item.estimatedTimeSavingSeconds != null
      ? item.estimatedTimeSavingSeconds >= 60
        ? `${Math.round(item.estimatedTimeSavingSeconds / 60)}m`
        : `${item.estimatedTimeSavingSeconds}s`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={[
              styles.velocityBadge,
              { backgroundColor: VELOCITY_COLORS[item.velocityClass] + "22" },
            ]}
          >
            <Text
              style={[
                styles.velocityText,
                { color: VELOCITY_COLORS[item.velocityClass] },
              ]}
            >
              {item.velocityClass}
            </Text>
          </View>
          <Text style={styles.ref}>{item.sku}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[item.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.productName}>{item.productName}</Text>
      <View style={styles.moveRow}>
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>From</Text>
          <Text style={styles.locationCode}>
            {item.currentLocationCode ?? "Unslotted"}
          </Text>
          {item.currentZone ? (
            <Text style={styles.locationZone}>{item.currentZone}</Text>
          ) : null}
        </View>
        <Ionicons name="arrow-forward" size={22} color="#3b82f6" />
        <View style={[styles.locationBox, { backgroundColor: "#eff6ff" }]}>
          <Text style={styles.locationLabel}>To</Text>
          <Text style={[styles.locationCode, { color: "#1d4ed8" }]}>
            {item.recommendedLocationCode}
          </Text>
          {item.recommendedZone ? (
            <Text style={styles.locationZone}>{item.recommendedZone}</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.reason}>{item.reason}</Text>
      <View style={styles.metaRow}>
        {timeSaving ? (
          <Text style={styles.saving}>
            <Ionicons name="time-outline" size={12} color="#10b981" /> Saves ~
            {timeSaving}
          </Text>
        ) : null}
        {item.confidence != null ? (
          <Text style={styles.saving}>Confidence: {item.confidence}%</Text>
        ) : null}
      </View>
      {item.status === "PENDING" || item.status === "APPROVED" ? (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
            onPress={() => onApply(item.id)}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#6b7280" }]}
            onPress={() => onReject(item.id)}
          >
            <Ionicons name="close" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function SlottingScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [isRunning, setIsRunning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["slottingRecommendations", statusFilter],
    queryFn: () =>
      getSlottingRecommendations({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const applyMutation = useMutation({
    mutationFn: (id: string) => applyRecommendation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["slottingRecommendations"] }),
    onError: () => Alert.alert("Error", "Failed to apply recommendation."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectRecommendation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["slottingRecommendations"] }),
    onError: () => Alert.alert("Error", "Failed to reject recommendation."),
  });

  const runOptimisation = async () => {
    setIsRunning(true);
    try {
      const result = await runSlottingOptimisation("default");
      queryClient.invalidateQueries({ queryKey: ["slottingRecommendations"] });
      Alert.alert(
        "Optimisation Complete",
        `${(result as any)?.recommendationsGenerated ?? 0} recommendations generated.`,
      );
    } catch {
      Alert.alert("Error", "Optimisation failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const recommendations: SlottingRecommendation[] =
    (data as any)?.recommendations ?? [];
  const total: number = (data as any)?.total ?? 0;

  return (
    <View style={styles.container}>
      {/* Header with run optimisation */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Slotting Optimisation</Text>
          <Text style={styles.headerSub}>{total} total recommendations</Text>
        </View>
        <TouchableOpacity
          style={[styles.runBtn, isRunning && { backgroundColor: "#6b7280" }]}
          onPress={runOptimisation}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={14} color="#fff" />
              <Text style={styles.runBtnText}>Run AI</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(
          [
            "PENDING",
            "APPROVED",
            "APPLIED",
            "REJECTED",
            "ALL",
          ] as StatusFilter[]
        ).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === f && styles.chipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <RecommendationCard
              item={item}
              onApply={(id) => applyMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="grid-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                No {statusFilter === "ALL" ? "" : statusFilter.toLowerCase()}{" "}
                recommendations.
              </Text>
              {statusFilter === "PENDING" ? (
                <Text style={styles.emptyHint}>
                  Run AI optimisation to generate new recommendations.
                </Text>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e3a5f",
    padding: 16,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  runBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", padding: 8, gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { fontSize: 11, color: "#374151", fontWeight: "600" },
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
    marginBottom: 4,
  },
  velocityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  velocityText: { fontSize: 12, fontWeight: "800" },
  ref: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  productName: { fontSize: 13, color: "#475569", marginBottom: 10 },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  locationBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  locationLabel: { fontSize: 10, color: "#6b7280", marginBottom: 2 },
  locationCode: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  locationZone: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  reason: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  saving: { fontSize: 12, color: "#10b981", fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  emptyHint: { fontSize: 12, color: "#d1d5db", textAlign: "center" },
});
