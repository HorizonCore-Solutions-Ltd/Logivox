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
  getAssemblyOrders,
  getAssemblyOrder,
  startAssemblyOrder,
  completeAssemblyOrder,
  pickBOMComponent,
  type AssemblyOrder,
  type BOMLine,
} from "../../lib/api/assembly";
import { Ionicons } from "@expo/vector-icons";

type StatusFilter = "ALL" | "PLANNED" | "PICKING" | "ASSEMBLING";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  PLANNED: "#3b82f6",
  PICKING: "#f59e0b",
  ASSEMBLING: "#8b5cf6",
  QC_HOLD: "#f97316",
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

const BOM_STATUS_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  ALLOCATED: "#3b82f6",
  PICKED: "#10b981",
  CONSUMED: "#10b981",
  SHORT: "#ef4444",
};

function BOMLineCard({
  line,
  orderId,
  onPick,
}: {
  line: BOMLine;
  orderId: string;
  onPick: (orderId: string, lineId: string, qty: number) => void;
}) {
  const canPick = line.status === "ALLOCATED" && line.availableQuantity > 0;
  return (
    <View style={styles.bomLine}>
      <View style={styles.cardRow}>
        <Text style={styles.bomSku}>{line.componentSku}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: BOM_STATUS_COLORS[line.status] ?? "#6b7280" },
          ]}
        >
          <Text style={styles.badgeText}>{line.status}</Text>
        </View>
      </View>
      <Text style={styles.bomName}>{line.componentName}</Text>
      {line.componentLocationCode ? (
        <Text style={styles.detail}>
          <Ionicons name="location-outline" size={12} />{" "}
          {line.componentLocationCode}
        </Text>
      ) : null}
      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          Required: <Text style={styles.statVal}>{line.requiredQuantity}</Text>
        </Text>
        <Text style={styles.stat}>
          Available:{" "}
          <Text
            style={[
              styles.statVal,
              {
                color:
                  line.availableQuantity < line.requiredQuantity
                    ? "#ef4444"
                    : "#10b981",
              },
            ]}
          >
            {line.availableQuantity}
          </Text>
        </Text>
        <Text style={styles.stat}>
          Picked: <Text style={styles.statVal}>{line.pickedQuantity}</Text>
        </Text>
      </View>
      {canPick ? (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: "#f59e0b", marginTop: 8 },
          ]}
          onPress={() =>
            onPick(
              orderId,
              line.id,
              line.requiredQuantity - line.pickedQuantity,
            )
          }
        >
          <Ionicons name="scan-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>
            Pick {line.requiredQuantity - line.pickedQuantity}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onStart,
  onComplete,
  onPick,
}: {
  order: AssemblyOrder & { bomLines?: BOMLine[] };
  isExpanded: boolean;
  onToggle: () => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onPick: (orderId: string, lineId: string, qty: number) => void;
}) {
  const progress =
    order.quantity > 0
      ? Math.round((order.completedQuantity / order.quantity) * 100)
      : 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onToggle}>
        <View style={styles.cardRow}>
          <Text style={styles.ref}>{order.orderNumber}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: STATUS_COLORS[order.status] ?? "#6b7280" },
            ]}
          >
            <Text style={styles.badgeText}>
              {order.status.replace("_", " ")}
            </Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {order.assemblyItemName}
          </Text>
          <View
            style={[
              styles.tag,
              { backgroundColor: PRIORITY_COLORS[order.priority] + "22" },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                { color: PRIORITY_COLORS[order.priority] },
              ]}
            >
              {order.priority}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            SKU: <Text style={styles.statVal}>{order.assemblyItemSku}</Text>
          </Text>
          <Text style={styles.stat}>
            Qty:{" "}
            <Text style={styles.statVal}>
              {order.completedQuantity}/{order.quantity}
            </Text>
          </Text>
        </View>
        {order.dueDate ? (
          <Text style={styles.detail}>
            Due: {new Date(order.dueDate).toLocaleDateString()}
          </Text>
        ) : null}
        <View style={styles.trackBg}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${progress}%` as any,
                backgroundColor: progress === 100 ? "#10b981" : "#3b82f6",
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        {order.status === "PLANNED" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]}
            onPress={() => onStart(order.id)}
          >
            <Ionicons name="play-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Start</Text>
          </TouchableOpacity>
        ) : null}
        {order.status === "PICKING" || order.status === "ASSEMBLING" ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
            onPress={() =>
              Alert.alert(
                "Complete Order",
                `Complete assembly of ${order.assemblyItemSku}?`,
                [
                  { text: "Cancel" },
                  { text: "Complete", onPress: () => onComplete(order.id) },
                ],
              )
            }
          >
            <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Complete</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#e2e8f0" }]}
          onPress={onToggle}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "list-outline"}
            size={14}
            color="#374151"
          />
          <Text style={[styles.actionBtnText, { color: "#374151" }]}>BOM</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && order.bomLines ? (
        <View style={styles.bomSection}>
          <Text style={styles.bomSectionTitle}>Bill of Materials</Text>
          {order.bomLines.map((line) => (
            <BOMLineCard
              key={line.id}
              line={line}
              orderId={order.id}
              onPick={onPick}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function AssemblyScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedOrderData, setExpandedOrderData] = useState<
    Record<string, AssemblyOrder & { bomLines?: BOMLine[] }>
  >({});

  const { data, isLoading } = useQuery({
    queryKey: ["assemblyOrders", statusFilter],
    queryFn: () =>
      getAssemblyOrders({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const expandQuery = useQuery({
    queryKey: ["assemblyOrder", expandedId],
    queryFn: () => getAssemblyOrder(expandedId!),
    enabled: !!expandedId,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startAssemblyOrder(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assemblyOrders"] }),
    onError: () => Alert.alert("Error", "Failed to start order."),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAssemblyOrder(id, 1),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assemblyOrders"] }),
    onError: () => Alert.alert("Error", "Failed to complete order."),
  });

  const pickMutation = useMutation({
    mutationFn: ({
      orderId,
      lineId,
      qty,
    }: {
      orderId: string;
      lineId: string;
      qty: number;
    }) => pickBOMComponent(orderId, lineId, qty),
    onSuccess: () => {
      if (expandedId)
        queryClient.invalidateQueries({
          queryKey: ["assemblyOrder", expandedId],
        });
    },
    onError: () => Alert.alert("Error", "Failed to record pick."),
  });

  const orders: AssemblyOrder[] = (data as any)?.orders ?? [];

  const enrichedOrders = orders.map((o) => {
    if (expandedId === o.id && expandQuery.data) {
      return expandQuery.data as unknown as AssemblyOrder & {
        bomLines?: BOMLine[];
      };
    }
    return o;
  });

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(["ALL", "PLANNED", "PICKING", "ASSEMBLING"] as StatusFilter[]).map(
          (f) => (
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
          ),
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={enrichedOrders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              isExpanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id))
              }
              onStart={(id) => startMutation.mutate(id)}
              onComplete={(id) => completeMutation.mutate(id)}
              onPick={(orderId, lineId, qty) =>
                pickMutation.mutate({ orderId, lineId, qty })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="construct-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No assembly orders found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
  ref: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  productName: { fontSize: 13, color: "#475569", flex: 1 },
  detail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 14, marginVertical: 4 },
  stat: { fontSize: 12, color: "#6b7280" },
  statVal: { fontWeight: "700", color: "#1e293b" },
  trackBg: {
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    marginTop: 8,
  },
  trackFill: { height: 5, borderRadius: 3 },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  bomSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  bomSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  bomLine: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  bomSku: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  bomName: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
