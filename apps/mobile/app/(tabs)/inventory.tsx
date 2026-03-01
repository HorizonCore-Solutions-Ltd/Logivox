import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ScanLine,
  Package,
  AlertTriangle,
  X,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
} from "lucide-react-native";
import { getInventoryItems, type InventoryItem } from "@/lib/api/inventory";

// ── Component ─────────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["inventory", debouncedSearch],
    queryFn: () => getInventoryItems({ search: debouncedSearch, limit: 50 }),
    staleTime: 1000 * 60,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera access is required to scan barcodes.",
          [{ text: "OK" }],
        );
        return;
      }
    }
    setScanned(false);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = useCallback(
    ({ data: barcode }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      setScannerOpen(false);
      setSearch(barcode);
      setDebouncedSearch(barcode);
    },
    [scanned],
  );

  const stockStatusColor = (item: InventoryItem) => {
    if (item.quantity <= 0) return "#DC2626";
    if (item.quantity <= (item.reorderPoint ?? 0)) return "#D97706";
    return "#059669";
  };

  const stockStatusLabel = (item: InventoryItem) => {
    if (item.quantity <= 0) return "Out of Stock";
    if (item.quantity <= (item.reorderPoint ?? 0)) return "Low Stock";
    return "In Stock";
  };

  const items: InventoryItem[] = data?.items ?? [];
  const total = data?.pagination?.total ?? 0;

const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.qtyBadge,
            { backgroundColor: `${stockStatusColor(item)}15` },
          ]}
        >
          <Text style={[styles.qtyText, { color: stockStatusColor(item) }]}>
            {item.quantity}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: stockStatusColor(item) },
              ]}
            />
            <Text
              style={[styles.statusLabel, { color: stockStatusColor(item) }]}
            >
              {stockStatusLabel(item)}
            </Text>
            {item.location && (
              <Text style={styles.locationText}>· {item.location.code ?? item.location.zone}</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* Quick Actions */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <TouchableOpacity 
           onPress={(e) => { e.stopPropagation(); /* TODO: Open Label Modal */ Alert.alert("Print Label", `Printing label for ${item.sku}`); }}
           style={{padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8}}
        >
          <Package color="#475569" size={18} />
        </TouchableOpacity>
        <TouchableOpacity 
           onPress={(e) => { e.stopPropagation(); /* TODO: Open Adjust Modal */ Alert.alert("Adjust Stock", `Adjusting ${item.sku}`); }}
           style={{padding: 8, backgroundColor: '#eff6ff', borderRadius: 8}}
        >
          <TrendingDown color="#2563EB" size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Search + scan bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search color="#94A3B8" size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search by name, SKU or barcode…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setDebouncedSearch("");
              }}
            >
              <X color="#94A3B8" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
          <ScanLine color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Count */}
      {!isLoading && (
        <Text style={styles.countText}>
          {total.toLocaleString()} item{total !== 1 ? "s" : ""}
          {debouncedSearch ? ` for "${debouncedSearch}"` : ""}
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Package color="#CBD5E1" size={48} />
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term or scan a barcode
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Barcode scanner modal */}
      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr", "pdf417", "ean13", "ean8", "code128",
                "code39", "itf14", "upc_a", "upc_e",
              ],
            }}
          />
          {/* Viewfinder overlay */}
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanHint}>
              Point camera at barcode or QR code
            </Text>
          </View>
          <TouchableOpacity
            style={styles.scanClose}
            onPress={() => setScannerOpen(false)}
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Item detail modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            {selectedItem && (
              <>
                <Text style={styles.detailName}>{selectedItem.name}</Text>
                <Text style={styles.detailSku}>SKU: {selectedItem.sku}</Text>

                <View style={styles.detailGrid}>
                  <DetailRow label="Quantity" value={String(selectedItem.quantity)} />
                  <DetailRow label="Location" value={selectedItem.location ? selectedItem.location.code : "—"} />
                  <DetailRow
                    label="Reorder Point"
                    value={selectedItem.reorderPoint != null ? String(selectedItem.reorderPoint) : "—"}
                  />
                  <DetailRow
                    label="Unit Cost"
                    value={
                      selectedItem.unitCost != null
                        ? `$${Number(selectedItem.unitCost).toFixed(2)}`
                        : "—"
                    }
                  />
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: `${stockStatusColor(selectedItem)}20`,
                    },
                  ]}
                >
                  {selectedItem.quantity <= (selectedItem.reorderPoint ?? 0) ? (
                    <TrendingDown color={stockStatusColor(selectedItem)} size={16} />
                  ) : (
                    <CheckCircle2 color={stockStatusColor(selectedItem)} size={16} />
                  )}
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: stockStatusColor(selectedItem) },
                    ]}
                  >
                    {stockStatusLabel(selectedItem)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeDetailBtn}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.closeDetailText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  searchBar: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  scanBtn: { backgroundColor: "#2563EB", borderRadius: 12, padding: 12, justifyContent: "center", alignItems: "center" },
  countText: { fontSize: 12, color: "#94A3B8", paddingHorizontal: 16, paddingBottom: 4 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    justifyContent: "space-between",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  qtyBadge: { width: 52, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 18, fontWeight: "800" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  itemSku: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: "600" },
  locationText: { fontSize: 11, color: "#94A3B8" },
  separator: { height: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B" },
  emptySubtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center", paddingHorizontal: 32 },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  scanFrame: { width: 260, height: 260, position: "relative" },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#fff", borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: "#fff", fontSize: 14, marginTop: 24, textAlign: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanClose: { position: "absolute", top: 56, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  // Detail modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  detailHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  detailName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  detailSku: { fontSize: 13, color: "#94A3B8", marginTop: 4, marginBottom: 20 },
  detailGrid: { gap: 12, marginBottom: 20 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 14, color: "#64748B" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, marginBottom: 20 },
  statusPillText: { fontSize: 14, fontWeight: "700" },
  closeDetailBtn: { backgroundColor: "#F1F5F9", borderRadius: 14, padding: 14, alignItems: "center" },
  closeDetailText: { fontSize: 16, fontWeight: "700", color: "#334155" },
  // Detail row for item alert
  alertDot: { width: 8, height: 8, borderRadius: 4 },
});
