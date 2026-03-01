import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  QrCode,
  X,
  ChevronRight,
  Plus,
  Minus,
  ClipboardCheck,
  Truck,
  CheckCircle2,
  Camera,
} from "lucide-react-native";
import {
  getOpenASNs,
  receiveItem,
  completeReceiving,
  type ASN,
  type ASNItem,
  type ReceiveItemPayload,
} from "@/lib/api/receiving";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "#2563EB",
  PARTIAL: "#D97706",
  RECEIVED: "#059669",
  CLOSED: "#64748B",
  CANCELLED: "#94A3B8",
};

export default function ReceivingScreen() {
  const queryClient = useQueryClient();
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const {
    data: asns = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["asns"],
    queryFn: () => getOpenASNs(),
    staleTime: 1000 * 60,
  });

  const receiveMutation = useMutation({
    mutationFn: (payload: ReceiveItemPayload) => receiveItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asns"] });
      setActiveItemId(null);
    },
    onError: () => Alert.alert("Error", "Failed to receive item. Try again."),
  });

  const completeMutation = useMutation({
    mutationFn: (asnId: string) => completeReceiving(asnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asns"] });
      setSelectedASN(null);
      setQuantities({});
      Alert.alert("Done!", "ASN completed — all goods received.");
    },
    onError: () => Alert.alert("Error", "Failed to complete receiving."),
  });

  const openASN = (asn: ASN) => {
    setSelectedASN(asn);
    const initial: Record<string, number> = {};
    asn.items.forEach((item) => {
      initial[item.id] = item.expectedQuantity - item.receivedQuantity;
    });
    setQuantities(initial);
  };

  const handleBarcodeScan = ({ data: barcodeData }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setShowScanner(false);

    if (selectedASN) {
      const match = selectedASN.items.find(
        (i) => i.barcode === barcodeData || i.sku === barcodeData,
      );
      if (match) {
        setActiveItemId(match.id);
        Alert.alert("Item scanned", `Matched: ${match.name}`);
      } else {
        Alert.alert("No match", `Barcode "${barcodeData}" not in this ASN`);
      }
    }
    setScanningItemId(null);
    setTimeout(() => {
      scannedRef.current = false;
    }, 2000);
  };

  const adjustQty = (itemId: string, delta: number, max: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(max, (prev[itemId] ?? 0) + delta)),
    }));
  };

  const receiveItemLine = (item: ASNItem) => {
    if (!selectedASN) return;
    const qty = quantities[item.id] ?? 0;
    if (qty <= 0) {
      Alert.alert("Invalid", "Quantity must be greater than 0.");
      return;
    }
    receiveMutation.mutate({
      asnId: selectedASN.id,
      itemId: item.id,
      receivedQuantity: qty,
      locationId: item.locationId ?? "DEFAULT",
    });
  };

  const submitComplete = () => {
    if (!selectedASN) return;
    Alert.alert(
      "Complete ASN",
      `Mark ASN ${selectedASN.asnNumber} as fully received?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: () => completeMutation.mutate(selectedASN.id),
        },
      ],
    );
  };

  const startScan = async (itemId: string) => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanningItemId(itemId);
    scannedRef.current = false;
    setShowScanner(true);
  };

  const renderASN = ({ item }: { item: ASN }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openASN(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.poNumber}>{item.asnNumber}</Text>
          <Text style={styles.supplierName} numberOfLines={1}>
            {item.supplierName}
          </Text>
        </View>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: `${STATUS_COLOR[item.status] ?? "#94A3B8"}22` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLOR[item.status] ?? "#94A3B8" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <View style={{ flex: 1 }}>
          <View style={styles.lineCountBadge}>
            <Package color="#64748B" size={13} />
            <Text style={styles.lineCountText}>
              {item.receivedItems}/{item.totalItems} items
            </Text>
          </View>
        </View>

        {item.status !== "CLOSED" && item.status !== "CANCELLED" && (
          <TouchableOpacity
            style={styles.quickScanBtn}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedASN(item);
              setTimeout(() => {
                startScan("ANY");
              }, 200);
            }}
          >
            <QrCode color="#fff" size={14} />
            <Text style={styles.quickScanText}>Scan</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#2563EB"
          size="large"
        />
      ) : (
        <FlatList
          data={asns}
          keyExtractor={(o) => o.id}
          renderItem={renderASN}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#2563EB"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Truck color="#CBD5E1" size={48} />
              <Text style={styles.emptyTitle}>No open ASNs</Text>
            </View>
          }
        />
      )}

      {/* Receive ASN sheet */}
      <Modal
        visible={!!selectedASN}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedASN(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              {selectedASN && (
                <>
                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetPoNumber}>
                        {selectedASN.asnNumber}
                      </Text>
                      <Text style={styles.sheetSupplier}>
                        {selectedASN.supplierName}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: `${STATUS_COLOR[selectedASN.status] ?? "#94A3B8"}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              STATUS_COLOR[selectedASN.status] ?? "#94A3B8",
                          },
                        ]}
                      >
                        {selectedASN.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>
                    Receive items ({selectedASN.receivedItems}/
                    {selectedASN.totalItems})
                  </Text>

                  <ScrollView
                    style={styles.lineItems}
                    showsVerticalScrollIndicator={false}
                  >
                    {selectedASN.items.map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.lineCard,
                          activeItemId === item.id && styles.lineCardActive,
                        ]}
                      >
                        <View style={styles.lineInfo}>
                          <Text style={styles.lineName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text style={styles.lineSku}>
                            {item.sku} · Expected: {item.expectedQuantity} ·
                            Received: {item.receivedQuantity}
                          </Text>
                        </View>
                        <View style={styles.lineActions}>
                          <TouchableOpacity
                            style={styles.scanBtn}
                            onPress={() => startScan(item.id)}
                          >
                            <QrCode color="#2563EB" size={16} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() =>
                              adjustQty(item.id, -1, item.expectedQuantity)
                            }
                          >
                            <Minus color="#475569" size={16} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>
                            {quantities[item.id] ?? 0}
                          </Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() =>
                              adjustQty(item.id, 1, item.expectedQuantity)
                            }
                          >
                            <Plus color="#475569" size={16} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.receiveItemBtn,
                              item.status === "RECEIVED" && { opacity: 0.4 },
                            ]}
                            onPress={() => receiveItemLine(item)}
                            disabled={
                              item.status === "RECEIVED" ||
                              receiveMutation.isPending
                            }
                          >
                            {receiveMutation.isPending &&
                            activeItemId === item.id ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <CheckCircle2 color="#fff" size={14} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      completeMutation.isPending && { opacity: 0.6 },
                    ]}
                    onPress={submitComplete}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <ClipboardCheck color="#fff" size={20} />
                    )}
                    <Text style={styles.submitBtnText}>Complete ASN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedASN(null)}
                  >
                    <Text style={styles.closeBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode scanner */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "ean8",
                "code128",
                "code39",
                "upc_e",
                "upc_a",
              ],
            }}
            onBarcodeScanned={handleBarcodeScan}
          />
          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.scanHint}>Point at item barcode</Text>
          </View>
          <TouchableOpacity
            style={styles.closeScannerBtn}
            onPress={() => setShowScanner(false)}
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  filterTabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  filterTabActive: { backgroundColor: "#2563EB" },
  filterTabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  filterTabTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  poNumber: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  supplierName: { fontSize: 13, color: "#475569", marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lineCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lineCountText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  expectedDate: { flex: 1, fontSize: 12, color: "#94A3B8" },
  quickScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickScanText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748B" },
  // Sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sheetPoNumber: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  sheetSupplier: { fontSize: 14, color: "#64748B", marginTop: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  lineItems: { maxHeight: 320, marginBottom: 16 },
  lineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  lineCardActive: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  lineSku: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  lineActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  receiveItemBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    minWidth: 28,
    textAlign: "center",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 16, fontWeight: "700", color: "#334155" },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: { width: 260, height: 260, position: "relative" },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
    borderWidth: 3,
  },
  tl: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  tr: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  br: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  scanHint: {
    color: "#fff",
    marginTop: 24,
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.9,
  },
  closeScannerBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    borderRadius: 50,
  },
});
