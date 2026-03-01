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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  FileText,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
} from "lucide-react-native";
import {
  getInvoices,
  sendInvoice,
  markInvoicePaid,
  type Invoice,
  type SendInvoicePayload,
} from "@/lib/api/invoices";

// ── Status colours ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#94A3B8",
  SENT: "#2563EB",
  PAID: "#059669",
  OVERDUE: "#DC2626",
  CANCELLED: "#64748B",
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function InvoicesScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["invoices", search, statusFilter],
    queryFn: () =>
      getInvoices({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        limit: 50,
      }),
    staleTime: 1000 * 60,
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => sendInvoice(id, { method: "EMAIL" } as SendInvoicePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSelectedInvoice(null);
      Alert.alert("Sent!", "Invoice has been sent to the customer.");
    },
    onError: () => Alert.alert("Error", "Failed to send invoice. Try again."),
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => markInvoicePaid(id, "CASH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSelectedInvoice(null);
      Alert.alert("Updated", "Invoice marked as paid.");
    },
    onError: () => Alert.alert("Error", "Failed to update invoice."),
  });

  const invoices: Invoice[] = data?.invoices ?? [];
  const totals = data?.totals;

  const STATUS_TABS = ["ALL", "DRAFT", "SENT", "OVERDUE", "PAID", "CANCELLED"];

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const isOverdue =
      item.status !== "PAID" &&
      item.status !== "CANCELLED" &&
      item.dueDate &&
      new Date(item.dueDate) < new Date();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedInvoice(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: `${
                  STATUS_COLOR[isOverdue ? "OVERDUE" : item.status] ?? "#94A3B8"
                }18`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    STATUS_COLOR[isOverdue ? "OVERDUE" : item.status] ??
                    "#94A3B8",
                },
              ]}
            >
              {isOverdue ? "OVERDUE" : item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName} numberOfLines={1}>
          {item.customerName ?? item.customerId}
        </Text>

        <View style={styles.cardBottom}>
          <View style={styles.amountRow}>
            <DollarSign color="#059669" size={15} />
            <Text style={styles.amount}>
              {Number(item.total ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          {item.dueDate && (
            <View style={styles.dueDateRow}>
              <Clock color={isOverdue ? "#DC2626" : "#94A3B8"} size={13} />
              <Text
                style={[
                  styles.dueDateText,
                  { color: isOverdue ? "#DC2626" : "#94A3B8" },
                ]}
              >
                Due {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          <ChevronRight color="#CBD5E1" size={16} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search color="#94A3B8" size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search invoices…"
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

      {/* Summary strip */}
      {totals && (
        <View style={styles.summaryStrip}>
          <SummaryBlock label="Outstanding" value={`$${Number(totals.outstanding ?? 0).toLocaleString()}`} color="#DC2626" />
          <SummaryBlock label="Overdue" value={`$${Number(totals.overdue ?? 0).toLocaleString()}`} color="#D97706" />
          <SummaryBlock label="Paid" value={`$${Number(totals.paid ?? 0).toLocaleString()}`} color="#059669" />
        </View>
      )}

      {/* Status filter */}
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

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" size="large" />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(i) => i.id}
          renderItem={renderInvoice}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#2563EB" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FileText color="#CBD5E1" size={48} />
              <Text style={styles.emptyTitle}>No invoices found</Text>
            </View>
          }
        />
      )}

      {/* Invoice detail sheet */}
      <Modal
        visible={!!selectedInvoice}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selectedInvoice && (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetInvoiceNum}>{selectedInvoice.invoiceNumber}</Text>
                    <Text style={styles.sheetCustomer}>
                      {selectedInvoice.customerName ?? selectedInvoice.customerId}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: `${STATUS_COLOR[selectedInvoice.status]}18` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[selectedInvoice.status] }]}>
                      {selectedInvoice.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.amountLarge}>
                    ${Number(selectedInvoice.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </Text>
                  {selectedInvoice.dueDate && (
                    <Text style={styles.dueLine}>
                      Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                <View style={styles.detailRows}>
                  <DetailRow label="Invoice Date" value={selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : "—"} />
                  <DetailRow label="Subtotal" value={`$${Number(selectedInvoice.subtotal ?? 0).toFixed(2)}`} />
                  <DetailRow label="Tax" value={`$${Number(selectedInvoice.taxAmount ?? 0).toFixed(2)}`} />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {selectedInvoice.status === "DRAFT" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#2563EB" }]}
                      onPress={() => sendMutation.mutate(selectedInvoice.id)}
                      disabled={sendMutation.isPending}
                    >
                      {sendMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Send color="#fff" size={18} />
                      )}
                      <Text style={styles.actionBtnText}>Send Invoice</Text>
                    </TouchableOpacity>
                  )}
                  {["SENT", "OVERDUE"].includes(selectedInvoice.status) && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#059669" }]}
                      onPress={() => paidMutation.mutate(selectedInvoice.id)}
                      disabled={paidMutation.isPending}
                    >
                      {paidMutation.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <CheckCircle2 color="#fff" size={18} />
                      )}
                      <Text style={styles.actionBtnText}>Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                  {selectedInvoice.pdfUrl && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#7C3AED" }]}
                      onPress={() => Linking.openURL(selectedInvoice.pdfUrl!)}
                    >
                      <ExternalLink color="#fff" size={18} />
                      <Text style={styles.actionBtnText}>View PDF</Text>
                    </TouchableOpacity>
                  )}
                  {selectedInvoice.status === "PAID" && (
                    <View style={styles.paidConfirmation}>
                      <CheckCircle2 color="#059669" size={20} />
                      <Text style={styles.paidText}>Invoice fully paid</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedInvoice(null)}>
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

function SummaryBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryBlock}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  summaryStrip: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingBottom: 8 },
  summaryBlock: { alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", marginTop: 2 },
  filterTabs: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9" },
  filterTabActive: { backgroundColor: "#2563EB" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterTabTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  invoiceNum: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  customerName: { fontSize: 13, color: "#475569", marginBottom: 10 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  amount: { fontSize: 16, fontWeight: "800", color: "#059669" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  dueDateText: { fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B" },
  // Sheet
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "90%" },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  sheetInvoiceNum: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  sheetCustomer: { fontSize: 14, color: "#64748B", marginTop: 4 },
  amountCard: { backgroundColor: "#ECFDF5", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 20 },
  amountLabel: { fontSize: 13, color: "#059669", fontWeight: "600" },
  amountLarge: { fontSize: 32, fontWeight: "900", color: "#059669", marginTop: 4 },
  dueLine: { fontSize: 12, color: "#64748B", marginTop: 4 },
  detailRows: { gap: 10, marginBottom: 20 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 14, color: "#64748B" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  actions: { gap: 10, marginBottom: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  paidConfirmation: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ECFDF5", borderRadius: 12, padding: 14 },
  paidText: { color: "#059669", fontWeight: "700", fontSize: 15 },
  closeBtn: { backgroundColor: "#F1F5F9", borderRadius: 14, padding: 14, alignItems: "center" },
  closeBtnText: { fontSize: 16, fontWeight: "700", color: "#334155" },
});
