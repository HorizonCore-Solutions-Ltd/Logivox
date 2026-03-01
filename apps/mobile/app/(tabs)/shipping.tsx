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
  getShipments,
  getPackingTasks,
  generateLabel,
  dispatchShipment,
  completePackingTask,
  type Shipment,
  type PackTask,
} from "../../lib/api/shipping";
import { 
  Printer, 
  Truck, 
  MapPin, 
  PackageCheck, 
  Package, 
  Box, 
  Plane 
} from "lucide-react-native";

const SHIP_STATUS_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  PACKING: "#f59e0b",
  PACKED: "#3b82f6",
  DISPATCHED: "#10b981",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
};

export default function ShippingScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pack" | "ship">("pack");

  const { data: packData, isLoading: packLoading } = useQuery({
    queryKey: ["packingTasks"],
    queryFn: () => getPackingTasks(),
    enabled: tab === "pack",
  });

  const { data: shipData, isLoading: shipLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => getShipments(),
    enabled: tab === "ship",
  });

  const packMutation = useMutation({
    mutationFn: (id: string) => completePackingTask(id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packingTasks"] }),
    onError: () => Alert.alert("Error", "Failed to complete packing task."),
  });

  const labelMutation = useMutation({
    mutationFn: (id: string) => generateLabel(id, "default", "STANDARD"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      Alert.alert("Success", "Shipping label generated.");
    },
    onError: () => Alert.alert("Error", "Failed to generate label."),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => dispatchShipment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] }),
    onError: () => Alert.alert("Error", "Failed to dispatch shipment."),
  });

  const packTasks: PackTask[] =
    (packData as any)?.items ?? (Array.isArray(packData) ? packData : []);
  const shipments: Shipment[] =
    (shipData as any)?.items ?? (Array.isArray(shipData) ? shipData : []);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(["pack", "ship"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "pack" ? "Packing Tasks" : "Shipments"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "pack" ? (
        packLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
        ) : packTasks.length === 0 ? (
          <View style={styles.empty}>
            <Box size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No packing tasks.</Text>
          </View>
        ) : (
          <FlatList
            data={packTasks}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.ref}>{item.orderId}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: item.status === "PACKED" ? "#10b981" : "#f59e0b" },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.detail}>Assigned: {item.assignedTo ?? "Unassigned"}</Text>
                <Text style={styles.detail}>Items: {item.itemCount}</Text>
                {item.status !== "PACKED" && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#10b981", marginTop: 10 }]}
                    onPress={() => packMutation.mutate(item.id)}
                    disabled={packMutation.isPending}
                  >
                    <PackageCheck size={16} color="#ffffff" />
                    <Text style={styles.btnText}>Mark Packed</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )
      ) : shipLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={shipments}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const color = SHIP_STATUS_COLORS[item.status] ?? "#6b7280";
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.ref}>{item.shipmentNumber}</Text>
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.detail}>Carrier: {item.carrierName}</Text>
                {item.trackingNumber ? (
                  <Text style={styles.detail}>Tracking: {item.trackingNumber}</Text>
                ) : null}
                {item.estimatedDelivery ? (
                  <Text style={styles.detail}>
                    ETA: {new Date(item.estimatedDelivery).toLocaleDateString()}
                  </Text>
                ) : null}
                <View style={[styles.cardActions, {flexWrap: 'wrap'}]}>
                  {item.status === "PACKED" && !item.labelUrl && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#3b82f6" }]}
                      onPress={() => labelMutation.mutate(item.id)}
                    >
                      <Printer size={16} color="#fff" />
                      <Text style={styles.btnText}>Print Label</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === "PACKED" && item.labelUrl && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#10b981" }]}
                      onPress={() => dispatchMutation.mutate(item.id)}
                    >
                      <Truck size={16} color="#fff" />
                      <Text style={styles.btnText}>Dispatch</Text>
                    </TouchableOpacity>
                  )}
                  {item.trackingNumber && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#64748b" }]}
                      onPress={() => Alert.alert("Tracking", `Opening tracker for ${item.trackingNumber}`)}
                    >
                      <MapPin size={16} color="#fff" />
                      <Text style={styles.btnText}>Track</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Plane size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No shipments found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderColor: "#3b82f6" },
  tabBtnText: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  tabBtnTextActive: { color: "#3b82f6" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ref: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 14, color: "#9ca3af" },
});
