import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getComplianceTasks,
  getComplianceScore,
  completeComplianceTask,
  getAuditLogs,
  type ComplianceTask,
} from "../../lib/api/compliance";
import { Ionicons } from "@expo/vector-icons";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <View style={[styles.scoreRingWrapper, { borderColor: color }]}>
      <Text style={[styles.scoreValue, { color }]}>{score}%</Text>
      <Text style={styles.scoreLabel}>Compliance</Text>
    </View>
  );
}

export default function ComplianceScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"tasks" | "audit">("tasks");

  const { data: scoreData } = useQuery({
    queryKey: ["complianceScore"],
    queryFn: getComplianceScore,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["complianceTasks"],
    queryFn: () => getComplianceTasks(),
    enabled: tab === "tasks",
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => getAuditLogs(),
    enabled: tab === "audit",
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      completeComplianceTask(id, { notes: "Completed via mobile app" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceTasks"] });
      queryClient.invalidateQueries({ queryKey: ["complianceScore"] });
    },
    onError: () => Alert.alert("Error", "Failed to complete task."),
  });

  const score =
    (scoreData as any)?.overall ?? (scoreData as any)?.score ?? null;
  const tasks: ComplianceTask[] =
    (tasksData as any)?.tasks ?? (Array.isArray(tasksData) ? tasksData : []);
  const logs =
    (auditData as any)?.items ?? (Array.isArray(auditData) ? auditData : []);

  return (
    <View style={styles.container}>
      {/* Score Header */}
      <View style={styles.scoreHeader}>
        {score !== null ? (
          <ScoreRing score={Math.round(score)} />
        ) : (
          <View style={{ width: 80 }} />
        )}
        <View style={styles.scoreMeta}>
          <Text style={styles.scorePeriod}>Current Period</Text>
          {(scoreData as any)?.tasksDue !== undefined && (
            <Text style={styles.scoreDetail}>
              Tasks due: {(scoreData as any).tasksDue}
            </Text>
          )}
          {(scoreData as any)?.overdueCount !== undefined && (
            <Text style={[styles.scoreDetail, { color: "#ef4444" }]}>
              Overdue: {(scoreData as any).overdueCount}
            </Text>
          )}
        </View>
      </View>

      {/* Tab Switch */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "tasks" && styles.tabBtnActive]}
          onPress={() => setTab("tasks")}
        >
          <Text
            style={[
              styles.tabBtnText,
              tab === "tasks" && styles.tabBtnTextActive,
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "audit" && styles.tabBtnActive]}
          onPress={() => setTab("audit")}
        >
          <Text
            style={[
              styles.tabBtnText,
              tab === "audit" && styles.tabBtnTextActive,
            ]}
          >
            Audit Log
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "tasks" ? (
        tasksLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={48}
              color="#d1d5db"
            />
            <Text style={styles.emptyText}>All tasks complete!</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const overdue =
                item.dueDate &&
                new Date(item.dueDate) < new Date() &&
                item.status !== "COMPLETED";
              return (
                <View
                  style={[
                    styles.card,
                    overdue ? styles.cardOverdue : undefined,
                  ]}
                >
                  <View style={styles.cardRow}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {overdue && (
                      <Ionicons
                        name="warning-outline"
                        size={16}
                        color="#ef4444"
                      />
                    )}
                  </View>
                  <Text style={styles.detail}>{item.type}</Text>
                  {item.dueDate ? (
                    <Text
                      style={[
                        styles.detail,
                        overdue ? { color: "#ef4444" } : undefined,
                      ]}
                    >
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {item.status !== "COMPLETED" && (
                    <TouchableOpacity
                      style={[styles.completeBtn]}
                      onPress={() => completeMutation.mutate(item.id)}
                      disabled={completeMutation.isPending}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.completeBtnText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )
      ) : auditLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l: any) => l.id ?? l.createdAt}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.logRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color="#6b7280"
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.logAction}>
                  {item.action ?? item.event}
                </Text>
                <Text style={styles.logMeta}>
                  {item.performedBy ?? item.user} ·{" "}
                  {new Date(item.createdAt ?? item.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No audit logs found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scoreHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  scoreRingWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: { fontSize: 18, fontWeight: "700" },
  scoreLabel: { color: "#94a3b8", fontSize: 9 },
  scoreMeta: { flex: 1 },
  scorePeriod: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  scoreDetail: { color: "#94a3b8", fontSize: 12 },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderColor: "#3b82f6" },
  tabBtnText: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  tabBtnTextActive: { color: "#3b82f6" },
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
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 4,
  },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  completeBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  logRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logAction: { fontSize: 13, color: "#111827", fontWeight: "600" },
  logMeta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
