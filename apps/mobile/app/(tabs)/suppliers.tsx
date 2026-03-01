import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  getSuppliers,
  getSupplierScorecard,
  getPurchaseOrders,
  type Supplier,
  type SupplierScorecard,
  type PurchaseOrder,
} from "../../lib/api/suppliers";
import { Ionicons } from "@expo/vector-icons";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={styles.scoreBarRow}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color }]}>{value}%</Text>
      </View>
      <View style={styles.trackBg}>
        <View
          style={[
            styles.trackFill,
            { width: `${value}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function ScorecardView({ supplierId }: { supplierId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["supplierScorecard", supplierId],
    queryFn: () => getSupplierScorecard(supplierId),
  });
  const card = data as SupplierScorecard | null;
  if (isLoading) return <ActivityIndicator color="#3b82f6" />;
  if (!card) return <Text style={styles.emptyText}>No scorecard data.</Text>;
  return (
    <View style={styles.scorecardSection}>
      <Text style={styles.sectionTitle}>Supplier Scorecard</Text>
      <ScoreBar label="On-Time Delivery" value={card.onTimeDeliveryRate} />
      <ScoreBar label="Quality Score" value={card.qualityAcceptanceRate} />
      <ScoreBar label="Fill Rate" value={card.invoiceAccuracyRate} />
      <ScoreBar label="Overall" value={card.overallScore} />
    </View>
  );
}

export default function SuppliersScreen() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );
  const [tab, setTab] = useState<"suppliers" | "pos">("suppliers");

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
    enabled: tab === "suppliers",
  });

  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => getPurchaseOrders(),
    enabled: tab === "pos",
  });

  const suppliers: Supplier[] =
    (suppliersData as any)?.suppliers ??
    (Array.isArray(suppliersData) ? suppliersData : []);
  const orders: PurchaseOrder[] =
    (posData as any)?.orders ?? (Array.isArray(posData) ? posData : []);

  const PO_STATUS_COLORS: Record<string, string> = {
    DRAFT: "#6b7280",
    SUBMITTED: "#3b82f6",
    ACKNOWLEDGED: "#8b5cf6",
    SHIPPED: "#f59e0b",
    RECEIVED: "#10b981",
    CANCELLED: "#ef4444",
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(["suppliers", "pos"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => {
              setTab(t);
              setSelectedSupplierId(null);
            }}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "suppliers" ? "Suppliers" : "Purchase Orders"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "suppliers" ? (
        suppliersLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
        ) : (
          <FlatList
            data={suppliers}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  setSelectedSupplierId(
                    selectedSupplierId === item.id ? null : item.id,
                  )
                }
              >
                <View style={styles.cardRow}>
                  <View>
                    <Text style={styles.ref}>{item.name}</Text>
                    <Text style={styles.detail}>{item.country}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            item.status === "ACTIVE" ? "#10b981" : "#6b7280",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                    <Text style={styles.detail}>{item.leadTimeDays}d lead</Text>
                  </View>
                </View>
                {item.email ? (
                  <Text style={styles.detail}>{item.email}</Text>
                ) : null}
                <Ionicons
                  name={
                    selectedSupplierId === item.id
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={16}
                  color="#6b7280"
                  style={{ alignSelf: "flex-end", marginTop: 4 }}
                />
                {selectedSupplierId === item.id && (
                  <ScorecardView supplierId={item.id} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="business-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No suppliers found.</Text>
              </View>
            }
          />
        )
      ) : posLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.ref}>{item.poNumber}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        PO_STATUS_COLORS[item.status] ?? "#6b7280",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.detail}>
                Supplier: {item.supplierName ?? item.supplierId}
              </Text>
              <Text style={styles.detail}>
                Total: {item.currency} {item.totalAmount?.toFixed(2) ?? "—"}
              </Text>
              {item.expectedDate ? (
                <Text style={styles.detail}>
                  Expected: {new Date(item.expectedDate).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>No purchase orders found.</Text>
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
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  ref: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  detail: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, color: "#9ca3af" },
  scorecardSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  scoreBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  scoreBarLabel: { fontSize: 12, color: "#374151" },
  scoreBarValue: { fontSize: 12, fontWeight: "700" },
  trackBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3 },
  trackFill: { height: 6, borderRadius: 3 },
});
