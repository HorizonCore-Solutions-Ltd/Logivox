import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyRun,
  startRun,
  confirmStopArrival,
  completeDelivery,
  failDelivery,
  getStopItems,
  reportIncident,
  type DeliveryRun,
  type DeliveryStop,
  type DeliveryItem,
  type IncidentReport,
  type IncidentType,
} from "../../lib/api/delivery";
import { useAuthStore } from "../../lib/store/auth.store";

const { width } = Dimensions.get("window");

const STOP_COLORS: Record<string, string> = {
  PENDING: "#6b7280",
  ARRIVED: "#3b82f6",
  DELIVERED: "#10b981",
  FAILED: "#ef4444",
  OFF_ROUTE: "#f59e0b",
};

export default function DeliveryScreen() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [modalType, setModalType] = useState<
    "ITEMS" | "POD" | "FAIL" | "INCIDENT" | null
  >(null);
  const [today] = useState(new Date().toISOString().split("T")[0]);

  // POD State
  const [recipientName, setRecipientName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [podNotes, setPodNotes] = useState("");

  // Incident State
  const [incidentType, setIncidentType] = useState<IncidentType>("OTHER");
  const [incidentDesc, setIncidentDesc] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["delivery-run", today],
    queryFn: () => getMyRun(today),
    refetchInterval: 60000,
  });

  const run = data?.run;
  const stops = (data as any)?.stops ?? [];

  const completedStops = stops.filter(
    (s: DeliveryStop) => s.status === "DELIVERED" || s.status === "FAILED",
  ).length;
  const progress = stops.length > 0 ? completedStops / stops.length : 0;

  const startRunMut = useMutation({
    mutationFn: (id: string) => startRun(id),
    onSuccess: () => {
      Alert.alert("Run Started", "Drive safe! 🚛");
      qc.invalidateQueries({ queryKey: ["delivery-run"] });
    },
  });

  const arriveMut = useMutation({
    mutationFn: (id: string) => confirmStopArrival(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-run"] });
    },
  });

  const completeMut = useMutation({
    mutationFn: (args: { id: string; pod: any }) =>
      completeDelivery(args.id, args.pod),
    onSuccess: () => {
      setModalType(null);
      setSelectedStop(null);
      resetPod();
      Alert.alert("Delivered", "Proof of Delivery recorded ✅");
      qc.invalidateQueries({ queryKey: ["delivery-run"] });
    },
    onError: () => Alert.alert("Error", "Could not complete delivery"),
  });

  const failMut = useMutation({
    mutationFn: (args: { id: string; reason: string; photo?: string }) =>
      failDelivery(args.id, args.reason, args.photo),
    onSuccess: () => {
      setModalType(null);
      setSelectedStop(null);
      resetPod();
      Alert.alert("Recorded ❌", "Failure reason logged.");
      qc.invalidateQueries({ queryKey: ["delivery-run"] });
    },
  });

  const incidentMut = useMutation({
    mutationFn: async (report: IncidentReport) => reportIncident(report),
    onSuccess: () => {
      setModalType(null);
      setSelectedStop(null);
      setIncidentDesc("");
      setPhoto(null);
      Alert.alert("Incident Reported", "Dispatch has been notified via email.");
    },
  });

  const resetPod = () => {
    setRecipientName("");
    setPhoto(null);
    setPodNotes("");
  };

  const handleNavigate = (stop: DeliveryStop) => {
    // Basic geo navigation intent
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng =
      stop.latitude && stop.longitude
        ? `${stop.latitude},${stop.longitude}`
        : "";
    const label = stop.address;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    Linking.openURL(url!);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "No Camera Access",
        "Permission required to take POD photos.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhoto(result.assets[0].base64);
    }
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        <Text>Loading run...</Text>
      </View>
    );

  if (!run) {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={64} color="#ccc" />
        <Text style={{ marginTop: 16, color: "#666" }}>
          No delivery run assigned for today.
        </Text>
        <TouchableOpacity style={styles.btnMain} onPress={() => refetch()}>
          <Text style={styles.btnText}>Check Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStop = ({ item }: { item: DeliveryStop }) => {
    const isNext =
      item.status === "PENDING" &&
      stops.find((s: any) => s.status === "PENDING")?.id === item.id;
    const color = STOP_COLORS[item.status] ?? "#666";

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={() => {
          setSelectedStop(item);
          setModalType("ITEMS");
        }}
        activeOpacity={0.8}
      >
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.seqText}>{item.sequence}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.custName}>{item.customerName}</Text>
            <Text style={styles.addr}>{item.address}</Text>
            {item.specialInstructions ? (
              <Text style={styles.instr}>⚠️ {item.specialInstructions}</Text>
            ) : null}
            {/* Quick Contact Info Display */}
            {item.contactPhone && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="call-outline" size={12} color="#4b5563" />
                <Text style={{ fontSize: 12, color: "#4b5563", marginLeft: 4 }}>
                  {item.contactName ? `${item.contactName} • ` : ""}
                  {item.contactPhone}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.statusText, { color }]}>{item.status}</Text>
            <Text style={styles.time}>
              {item.arrivalTime ? item.arrivalTime.substring(11, 16) : "--:--"}
            </Text>
          </View>
        </View>

        {isNext && (
          <View style={styles.actions}>
            {item.contactPhone && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}
              >
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleNavigate(item)}
            >
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>Map</Text>
            </TouchableOpacity>
            {item.status === "PENDING" ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: "#3b82f6",
                    flex: 1,
                    justifyContent: "center",
                  },
                ]}
                onPress={() => arriveMut.mutate(item.id)}
              >
                <Text style={styles.actionText}>Arrive</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => {
                setSelectedStop(item);
                setModalType("INCIDENT");
              }}
            >
              <Ionicons name="warning-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Run #{run.runNumber}</Text>
          <Text style={styles.subTitle}>{new Date().toDateString()}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              setSelectedStop(null);
              setModalType("INCIDENT");
            }}
            style={styles.incidentBtn}
          >
            <Ionicons name="warning-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {run.status === "SCHEDULED" && (
        <TouchableOpacity
          style={styles.startBanner}
          onPress={() => startRunMut.mutate(run.id)}
        >
          <Text style={styles.startText}>▶ START RUN</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={stops}
        keyExtractor={(item) => item.id}
        renderItem={renderStop}
        contentContainerStyle={styles.list}
      />

      {/* Stop Detail / POD Modal */}
      <StopModal
        visible={!!modalType}
        stop={selectedStop}
        type={modalType}
        onClose={() => {
          setModalType(null);
          setSelectedStop(null);
          resetPod();
          setIncidentDesc("");
          setPhoto(null);
        }}
        onTypeChange={setModalType}
        podState={{ recipientName, photo, podNotes }}
        setPodState={{ setRecipientName, setPhoto, setPodNotes }}
        incidentState={{ incidentType, incidentDesc }}
        setIncidentState={{ setIncidentType, setIncidentDesc }}
        onComplete={() =>
          selectedStop &&
          completeMut.mutate({
            id: selectedStop.id,
            pod: { recipientName, photo, notes: podNotes },
          })
        }
        onFail={(reason: string) =>
          selectedStop &&
          failMut.mutate({
            id: selectedStop.id,
            reason,
            photo: photo ?? undefined,
          })
        }
        onReport={() =>
          incidentMut.mutate({
            runId: run.id,
            stopId: selectedStop?.id,
            type: incidentType,
            description: incidentDesc,
            photos: photo ? [photo] : [],
            reportedAt: new Date().toISOString(),
          })
        }
        onPhoto={takePhoto}
      />
    </View>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StopModal({
  visible,
  stop,
  type,
  onClose,
  onTypeChange,
  podState,
  setPodState,
  incidentState,
  setIncidentState,
  onComplete,
  onFail,
  onReport,
  onPhoto,
}: any) {
  const { data: itemsData } = useQuery({
    queryKey: ["stop-items", stop?.id],
    queryFn: () => (stop ? getStopItems(stop.id) : null),
    enabled: !!stop && visible && type !== "INCIDENT",
  });

  const allItems: DeliveryItem[] = (itemsData as any)?.items ?? [];
  const deliveries = allItems.filter((i) => i.type === "DELIVERY" || !i.type);
  const collections = allItems.filter(
    (i) => i.type === "COLLECTION" || i.type === "RETURN",
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalCont}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {type === "ITEMS"
              ? "Stop Details"
              : type === "POD"
                ? "Proof of Delivery"
                : type === "FAIL"
                  ? "Delivery Failure"
                  : "Report Incident"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#666" />
          </TouchableOpacity>
        </View>

        {type === "ITEMS" && stop && (
          <View style={{ flex: 1 }}>
            <View style={styles.stopInfo}>
              <Text style={styles.custName}>{stop.customerName}</Text>
              <Text style={styles.addr}>{stop.address}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {deliveries.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    To Deliver ({deliveries.length})
                  </Text>
                </View>
              )}
              {deliveries.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{item.productName}</Text>
                    <Text style={styles.sku}>{item.sku}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.qty}>
                      {item.quantity} {item.unitLabel}s
                    </Text>
                    {item.trailerSection && (
                      <View style={styles.locBadge}>
                        <Text style={styles.locText}>
                          {item.trailerSection} • L{item.trailerLayer} •{" "}
                          {item.trailerPosition}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {collections.length > 0 && (
                <View
                  style={[
                    styles.sectionHeader,
                    { marginTop: 16, backgroundColor: "#fff7ed" },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: "#c2410c" }]}>
                    To Collect ({collections.length})
                  </Text>
                </View>
              )}
              {collections.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    { borderLeftWidth: 3, borderLeftColor: "#f97316" },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{item.productName}</Text>
                    <Text style={styles.sku}>{item.sku}</Text>
                    {item.destinationLabel && (
                      <Text style={styles.destination}>
                        Destination: {item.destinationLabel}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.qty}>
                      {item.quantity} {item.unitLabel}s
                    </Text>
                    <View
                      style={[styles.locBadge, { backgroundColor: "#ffedd5" }]}
                    >
                      <Text style={[styles.locText, { color: "#c2410c" }]}>
                        COLLECT
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {stop.status !== "DELIVERED" && stop.status !== "FAILED" && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => onTypeChange("FAIL")}
                >
                  <Text style={styles.modalBtnText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#10b981", flex: 2 },
                  ]}
                  onPress={() => onTypeChange("POD")}
                >
                  <Text style={styles.modalBtnText}>Complete Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {type === "POD" && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {collections.length > 0 && (
              <View
                style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: "#fff7ed",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: "bold", color: "#c2410c" }}>
                  Reminder:
                </Text>
                <Text style={{ color: "#9a3412" }}>
                  Ensure {collections.reduce((acc, c) => acc + c.quantity, 0)}{" "}
                  items are collected before departure.
                </Text>
              </View>
            )}
            <Text style={styles.label}>Recipient Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Received by..."
              value={podState.recipientName}
              onChangeText={setPodState.setRecipientName}
            />

            <Text style={styles.label}>Signature (Tap to Sign)</Text>
            <TouchableOpacity
              style={styles.sigBox}
              onPress={() =>
                Alert.alert("Signature", "Simulated signature capture.")
              }
            >
              <Text style={{ color: "#999" }}>Tap to capture signature</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Photo Proof</Text>
            <TouchableOpacity style={styles.photoBox} onPress={onPhoto}>
              {podState.photo ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${podState.photo}` }}
                  style={{ width: "100%", height: "100%", borderRadius: 8 }}
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    Take Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="Left at reception / neighbor..."
              value={podState.podNotes}
              onChangeText={setPodState.setPodNotes}
            />

            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#10b981", marginTop: 20 },
              ]}
              onPress={onComplete}
            >
              <Text style={styles.modalBtnText}>Confirm Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#ccc", marginTop: 12 },
              ]}
              onPress={() => onTypeChange("ITEMS")}
            >
              <Text style={[styles.modalBtnText, { color: "#333" }]}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {type === "FAIL" && (
          <View style={{ padding: 20 }}>
            <Text style={styles.label}>Reason for Failure</Text>
            {[
              "Customer Not In",
              "Premises Closed",
              "Refused Goods",
              "Wrong Address",
              "Damaged Goods",
            ].map((r) => (
              <TouchableOpacity
                key={r}
                style={styles.reasonBtn}
                onPress={() => onFail(r)}
              >
                <Text style={styles.reasonText}>{r}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#ccc", marginTop: 12 },
              ]}
              onPress={() => onTypeChange("ITEMS")}
            >
              <Text style={[styles.modalBtnText, { color: "#333" }]}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {type === "INCIDENT" && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.label}>Incident Type</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {["DAMAGE", "DELAY", "BREAKDOWN", "ACCIDENT", "OTHER"].map(
                (t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.reasonBtn,
                      {
                        backgroundColor:
                          incidentState.incidentType === t ? "#f97316" : "#fff",
                      },
                    ]}
                    onPress={() => setIncidentState.setIncidentType(t)}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color:
                            incidentState.incidentType === t ? "#fff" : "#111",
                        },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              placeholder="Describe what happened..."
              value={incidentState.incidentDesc}
              onChangeText={setIncidentState.setIncidentDesc}
            />

            <Text style={styles.label}>Photo Evidence</Text>
            <TouchableOpacity style={styles.photoBox} onPress={onPhoto}>
              {podState.photo ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${podState.photo}` }}
                  style={{ width: "100%", height: "100%", borderRadius: 8 }}
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color="#666" />
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    Take Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: "#f97316", marginTop: 20 },
              ]}
              onPress={onReport}
            >
              <Text style={styles.modalBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const Platform = { select: (o: any) => o.ios };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#111" },
  subTitle: { fontSize: 14, color: "#666" },
  refreshBtn: { padding: 8 },
  incidentBtn: { padding: 8, backgroundColor: "#f97316", borderRadius: 8 },
  btnMain: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  startBanner: {
    backgroundColor: "#10b981",
    padding: 12,
    alignItems: "center",
  },
  startText: { color: "#fff", fontWeight: "bold", letterSpacing: 1 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row" },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  seqText: { color: "#fff", fontWeight: "bold" },
  custName: { fontSize: 16, fontWeight: "600", color: "#111" },
  addr: { fontSize: 13, color: "#666", marginTop: 2 },
  instr: { fontSize: 12, color: "#f59e0b", marginTop: 4, fontWeight: "500" },
  statusText: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  time: { fontSize: 12, color: "#9ca3af" },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    justifyContent: "flex-end",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#6b7280",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Modal
  modalCont: {
    flex: 1,
    backgroundColor: "#f9fafb",
    marginTop: 50,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  stopInfo: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  prodName: { fontSize: 15, fontWeight: "500" },
  sku: { fontSize: 12, color: "#999" },
  qty: { fontSize: 15, fontWeight: "600", color: "#2563EB" },
  locBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  locText: { fontSize: 10, color: "#0369a1", fontWeight: "500" },
  modalActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  modalBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // POD Form
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sigBox: {
    height: 100,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  photoBox: {
    height: 160,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonBtn: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: "45%",
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  destination: {
    fontSize: 12,
    color: "#c2410c",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionHeader: {
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1d4ed8" },
});
