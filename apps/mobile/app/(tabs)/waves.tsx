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
  getWaves,
  releaseWave,
  cancelWave,
  getWaveAutomationRules,
  triggerWaveRule,
  type Wave,
  type WaveAutomationRule,
} from "../../lib/api/waves";
import { Ionicons } from "@expo/vector-icons";

type Tab = "waves" | "rules";
type StatusFilter = "ALL" | "DRAFT" | "PLANNED" | "RELEASED" | "IN_PROGRESS";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  PLANNED: "#3b82f6",
  RELEASED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  NORMAL: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
  CRITICAL: "#dc2626",
};

function WaveCard({
  wave,
  onRelease,
  onCancel,
}: {
  wave: Wave;
  onRelease: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const progress =
    wave.totalLines > 0
      ? Math.round((wave.completedLines / wave.totalLines) * 100)
      : 0;
  const barColor =
    wave.status === "COMPLETED"
      ? "#10b981"
      : wave.status === "IN_PROGRESS"
        ? "#f59e0b"
        : "#3b82f6";

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{wave.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[wave.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{wave.status.replace("_", " ")}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View
          style={[
            styles.tag,
            { backgroundColor: PRIORITY_COLORS[wave.priority] + "22" },
          ]}
        >
          <Text
            style={[styles.tagText, { color: PRIORITY_COLORS[wave.priority] }]}
          >
            {wave.priority}
          </Text>
        </View>
        <Text style={styles.detail}>{wave.waveType.replace("_", " ")}</Text>
        <Text style={styles.detail}>{wave.strategy.replace("_", " ")}</Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          <Text style={styles.statVal}>{wave.totalOrders}</Text> orders
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.statVal}>{wave.totalLines}</Text> lines
        </Text>
        <Text style={styles.stat}>
          <Text style={styles.statVal}>{wave.assignedPickerCount}</Text> pickers
        </Text>
      </View>
      {wave.targetTrailerNumber ? (
        <Text style={[styles.detail, { marginTop: 4 }]}>
          <Ionicons name="car-outline" size={14} color="#6b7280" /> Trailer:{" "}
          {wave.targetTrailerNumber}
          {wave.exceedsTrailerCapacity && (
            <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
              {" "}
              (Exceeds Capacity!)
            </Text>
          )}
        </Text>
      ) : null}
      {wave.totalLines > 0 ? (
        <>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {wave.completedLines}/{wave.totalLines} lines
            </Text>
            <Text style={[styles.progressLabel, { color: barColor }]}>
              {progress}%
            </Text>
          </View>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.trackFill,
                { width: `${progress}%` as any, backgroundColor: barColor },
              ]}
            />
          </View>
        </>
      ) : null}
      {wave.pickDeadline ? (
        <Text style={styles.detail}>
          Deadline: {new Date(wave.pickDeadline).toLocaleString()}
        </Text>
      ) : null}
      <View style={styles.cardActions}>
        {wave.status === "PLANNED" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#8b5cf6" }]}
            onPress={() => onRelease(wave.id)}
          >
            <Ionicons name="play-circle-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Release</Text>
          </TouchableOpacity>
        ) : null}
        {wave.status !== "COMPLETED" && wave.status !== "CANCELLED" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
            onPress={() =>
              Alert.alert("Cancel Wave", "Cancel this wave?", [
                { text: "No" },
                {
                  text: "Yes",
                  style: "destructive",
                  onPress: () => onCancel(wave.id),
                },
              ])
            }
          >
            <Ionicons name="close-circle-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function RuleCard({
  rule,
  onTrigger,
}: {
  rule: WaveAutomationRule;
  onTrigger: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.ref}>{rule.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: rule.isActive ? "#10b981" : "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>
            {rule.isActive ? "ACTIVE" : "OFF"}
          </Text>
        </View>
      </View>
      <Text style={styles.detail}>Trigger: {rule.triggerType}</Text>
      {rule.lastTriggeredAt ? (
        <Text style={styles.detail}>
          Last triggered: {new Date(rule.lastTriggeredAt).toLocaleString()}
        </Text>
      ) : null}
      {rule.isActive ? (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: "#8b5cf6", marginTop: 10 },
          ]}
          onPress={() => onTrigger(rule.id)}
        >
          <Ionicons name="flash-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Trigger Now</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function WavesScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("waves");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: wavesData, isLoading: wavesLoading } = useQuery({
    queryKey: ["waves", statusFilter],
    queryFn: () =>
      getWaves({ status: statusFilter === "ALL" ? undefined : statusFilter }),
    enabled: tab === "waves",
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["waveRules"],
    queryFn: getWaveAutomationRules,
    enabled: tab === "rules",
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => releaseWave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waves"] }),
    onError: () => Alert.alert("Error", "Failed to release wave."),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelWave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waves"] }),
    onError: () => Alert.alert("Error", "Failed to cancel wave."),
  });

  const triggerMutation = useMutation({
    mutationFn: (id: string) => triggerWaveRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waves"] });
      Alert.alert("Success", "Wave rule triggered — new wave created.");
    },
    onError: () => Alert.alert("Error", "Trigger failed."),
  });

  const waves: Wave[] = (wavesData as any)?.waves ?? [];
  const rules: WaveAutomationRule[] = (rulesData as any)?.rules ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(["waves", "rules"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "waves" ? "Waves" : "Automation Rules"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "waves" ? (
        <>
          <View style={styles.filterRow}>
            {(
              [
                "ALL",
                "DRAFT",
                "PLANNED",
                "RELEASED",
                "IN_PROGRESS",
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
                  {f.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {wavesLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
          ) : (
            <FlatList
              data={waves}
              keyExtractor={(w) => w.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <WaveCard
                  wave={item}
                  onRelease={(id) => releaseMutation.mutate(id)}
                  onCancel={(id) => cancelMutation.mutate(id)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="layers-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No waves found.</Text>
                </View>
              }
            />
          )}
        </>
      ) : rulesLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <RuleCard
              rule={item}
              onTrigger={(id) => triggerMutation.mutate(id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flash-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                No automation rules configured.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
    marginBottom: 6,
  },
  ref: { fontSize: 15, fontWeight: "700", color: "#1e293b", flexShrink: 1 },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: "700" },
  detail: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 16, marginVertical: 6 },
  stat: { fontSize: 12, color: "#6b7280" },
  statVal: { fontWeight: "700", color: "#1e293b" },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressLabel: { fontSize: 12, color: "#6b7280" },
  trackBg: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 6,
  },
  trackFill: { height: 6, borderRadius: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
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
});
