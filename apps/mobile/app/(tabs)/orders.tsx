import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  ClipboardList,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Zap,
} from "lucide-react-native";
import { getSalesOrders, completeOrderPicking, type PickingOrder } from "@/lib/api/orders";

// ── Priority & Status colours ─────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "#DC2626", URGENT: "#D97706", HIGH: "#F59E0B",
  NORMAL: "#2563EB", LOW: "#64748B",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#94A3B8", APPROVED: "#2563EB", PICKING: "#D97706",
  PICKED: "#7C3AED", PACKING: "#F59E0B", PACKED: "#059669",
  SHIPPED: "#0891B2", DELIVERED: "#059669", CANCELLED: "#DC2626",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<PickingOrder | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["orders", search, statusFilter],
    queryFn: () =>
      getSalesOrders({
        search: search || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        limit: 50,
      }),
    staleTime: 1000 * 30,
  });

  const startMutation = useMutation({
    mutationFn: (_orderId: string) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrder(null);
    },
    onError: () => Alert.alert("Error", "Could not start picking. Try again."),
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: string) => completeOrderPicking(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrder(null);
      Alert.alert("Done!", "Order marked as picked.");
    },
    onError: () => Alert.alert("Error", "Could not complete order. Try again."),
  });

  const orders: PickingOrder[] = data?.orders ?? [];

  const STATUS_TABS = ["ALL", "APPROVED", "PICKING", "PICKED", "PACKING"];

  const renderOrder = ({ item }: { item: PickingOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => setSelectedOrder(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderNumRow}>
          <Text style={styles.orderNum}>{item.soNumber}</Text>
          <View style={[styles.statusChip, { backgroundColor: `${STATUS_COLOR[item.status] ?? "#94A3B8"}15` }]}>
            <Text style={[styles.statusChipText, { color: STATUS_COLOR[item.status] ?? "#94A3B8" }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[item.priority ?? "NORMAL"] ?? "#6B7280" }]} />
      </View>

      <Text style={styles.customerName} numberOfLines={1}>
        {item.customerName ?? item.id}
      </Text>

      <View style={styles.orderMeta}>
        <View style={styles.metaItem}>
          <Package color="#94A3B8" size={13} />
          <Text style={styles.metaText}>{item.totalItems ?? 0} lines</Text>
        </View>
        {item.shipDate && (
          <View style={styles.metaItem}>
            <Clock color="#94A3B8" size={13} />
            <Text style={styles.metaText}>
              Ship {new Date(item.shipDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        <ChevronRight color="#CBD5E1" size={16} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search color="#94A3B8" size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search orders…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X color="#94A3B8" size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabs}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === tab && styles.filterTabActive]}
            onPress={() => setStatusFilter(tab)}
          >
            <Text style={[styles.filterTabText, statusFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Orders list */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#2563EB" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ClipboardList color="#CBD5E1" size={48} />
              <Text style={styles.emptyTitle}>No orders found</Text>
            </View>
          }
        />
      )}

      {/* Order detail / action sheet */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.handle} />
            {selectedOrder && (
              <>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailOrderNum}>{selectedOrder.soNumber}</Text>
                    <Text style={styles.detailCustomer}>
                      {selectedOrder.customerName}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: `${STATUS_COLOR[selectedOrder.status]}15` }]}>
                    <Text style={[styles.statusChipText, { color: STATUS_COLOR[selectedOrder.status] }]}>
                      {selectedOrder.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <InfoRow label="Lines" value={String(selectedOrder.totalItems ?? 0)} />
                  <InfoRow label="Priority" value={selectedOrder.priority ?? "NORMAL"} />
                  {selectedOrder.shipDate && (
                    <InfoRow label="Ship Date" value={new Date(selectedOrder.shipDate).toLocaleDateString()} />
                  )}
                </View>

                {/* Actions based on status */}
                <View style={styles.actionButtons}>
                  {selectedOrder.status === "APPROVED" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#D97706" }]}
                      onPress={() => startMutation.mutate(selectedOrder.id)}
                      disabled={startMutation.isPending}
                    >
                      {startMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Play color="#fff" size={18} />
                      )}
                      <Text style={styles.actionBtnText}>Start Picking</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "PICKING" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#059669" }]}
                      onPress={() => completeMutation.mutate(selectedOrder.id)}
                      disabled={completeMutation.isPending}
                    >
                      {completeMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <CheckCircle2 color="#fff" size={18} />
                      )}
                      <Text style={styles.actionBtnText}>Complete Picking</Text>
                    </TouchableOpacity>
                  )}
                  {!["APPROVED", "PICKING"].includes(selectedOrder.status) && (
                    <View style={styles.statusInfoBox}>
                      <AlertCircle color="#94A3B8" size={18} />
                      <Text style={styles.statusInfoText}>
                        Order is {selectedOrder.status.toLowerCase()} — no actions available
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  searchBar: { padding: 16, paddingBottom: 8 },
  searchInput: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  statsStrip: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingBottom: 8 },
  stripItem: { alignItems: "center" },
  stripValue: { fontSize: 22, fontWeight: "800" },
  stripLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  filterTabs: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  filterTabActive: { backgroundColor: "#2563EB" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterTabTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  orderCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderNumRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderNum: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  customerName: { fontSize: 13, color: "#475569", marginBottom: 10 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#94A3B8" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B" },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "80%" },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  detailOrderNum: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  detailCustomer: { fontSize: 14, color: "#64748B", marginTop: 4 },
  infoGrid: { gap: 12, marginBottom: 20 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 14, color: "#64748B" },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  actionButtons: { gap: 10, marginBottom: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statusInfoBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14 },
  statusInfoText: { color: "#94A3B8", fontSize: 14 },
  closeBtn: { backgroundColor: "#F1F5F9", borderRadius: 14, padding: 14, alignItems: "center" },
  closeBtnText: { fontSize: 16, fontWeight: "700", color: "#334155" },
});
