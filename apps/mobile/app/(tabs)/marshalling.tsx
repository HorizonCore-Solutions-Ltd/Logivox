/**
 * Marshalling / Loading Team Screen
 *
 * Tabs:
 *  1. Bay Board    – live bay → trailer assignment, update bay status
 *  2. Load Sheets  – load sheet list → drill into lines + tipper recording
 *  3. Picks        – admin distributes picks; pickers mark complete / bring to bay
 *  4. Trailer Plan – AI loading-sequence optimisation
 */

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
  TextInput,
  Modal,
  Share,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/store/auth.store";
import {
  getDockBays,
  updateBayStatus,
  getLoadSheets,
  getLoadSheet,
  getLoadSheetLines,
  getLoadProgress,
  recordBoxAtBay,
  recordBoxLoaded,
  advanceLoadSheetStatus,
  getPickTasks,
  assignPickTask,
  completePickTask,
  shortPickTask,
  runTrailerOptimisation,
  applyOptimisationPlan,
  emailLoadSheet,
  getLoadSheetPdfUrl,
  type DockBay,
  type BayStatus,
  type LoadSheet,
  type LoadSheetLine,
  type PickTask,
  type TrailerOptimisationResult,
  type LoadSheetStatus,
  type TrailerSection,
} from "../../lib/api/marshalling";
import { createShunterTask } from "../../lib/api/yard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNIT_LABEL = (sheet?: LoadSheet | null) => sheet?.unitLabel ?? "Box";

// Trailer types for shunter request dropdown/selection
const TRAILER_TYPES = [
  "40ft Standard",
  "40ft High Cube",
  "20ft",
  "Curtainsider",
  "Reefer",
  "Double Decker",
];

const BAY_COLOURS: Record<BayStatus, string> = {
  EMPTY: "#6b7280",
  INCOMING: "#3b82f6",
  SPOTTED: "#8b5cf6",
  LOADING: "#f59e0b",
  SEALED: "#10b981",
  DEPARTING: "#f97316",
  OUT_OF_USE: "#ef4444",
};

const LS_COLOURS: Record<LoadSheetStatus, string> = {
  BUILDING: "#6b7280",
  READY: "#3b82f6",
  LOADING: "#f59e0b",
  LOADED: "#10b981",
  DISPATCHED: "#059669",
  CANCELLED: "#ef4444",
};

const PICK_COLOURS: Record<string, string> = {
  UNASSIGNED: "#6b7280",
  ASSIGNED: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  AT_BAY: "#8b5cf6",
  COMPLETED: "#10b981",
  SHORT_PICK: "#ef4444",
  CANCELLED: "#9ca3af",
};

const SECTION_COLOURS: Record<TrailerSection, string> = {
  FRONT: "#3b82f6",
  MID: "#8b5cf6",
  REAR: "#f59e0b",
  UNASSIGNED: "#9ca3af",
};

type MainTab = "bays" | "sheets" | "picks" | "plan";

// ─── Bay Board ────────────────────────────────────────────────────────────────

function BayCard({
  bay,
  onUpdateStatus,
}: {
  bay: DockBay;
  onUpdateStatus: (bay: DockBay) => void;
}) {
  const col = BAY_COLOURS[bay.status] ?? "#6b7280";
  return (
    <View style={[styles.card, { borderLeftColor: col, borderLeftWidth: 4 }]}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Door {bay.doorNumber}</Text>
          {bay.trailerNumber ? (
            <Text style={styles.sub}>🚛 {bay.trailerNumber}</Text>
          ) : (
            <Text style={[styles.sub, { color: "#9ca3af" }]}>No trailer</Text>
          )}
          {bay.carrierName ? (
            <Text style={styles.sub}>{bay.carrierName}</Text>
          ) : null}
          {bay.loadSheetNumber ? (
            <Text style={[styles.sub, { color: "#3b82f6" }]}>
              LS: {bay.loadSheetNumber}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: col + "22" }]}>
            <Text style={[styles.badgeText, { color: col }]}>{bay.status}</Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: col }]}
            onPress={() => onUpdateStatus(bay)}
          >
            <Text style={styles.btnText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
      {bay.spottedAt && (
        <Text style={styles.meta}>
          Spotted:{" "}
          {new Date(bay.spottedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </View>
  );
}

function BayBoard() {
  const qc = useQueryClient();
  const [selectedBay, setSelectedBay] = useState<DockBay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dock-bays"],
    queryFn: getDockBays,
    refetchInterval: 30000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BayStatus }) =>
      updateBayStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dock-bays"] });
      setModalVisible(false);
    },
    onError: () => Alert.alert("Error", "Could not update bay status"),
  });

  const bays: DockBay[] = (data as any)?.bays ?? [];

  const STATUS_ORDER: BayStatus[] = [
    "EMPTY",
    "INCOMING",
    "SPOTTED",
    "LOADING",
    "SEALED",
    "DEPARTING",
    "OUT_OF_USE",
  ];

  const shunterMut = useMutation({
    mutationFn: (data: {
      trailerNumber: string;
      toLocationName: string;
      fromLocationName: string;
      priority: "HIGH" | "URGENT";
      notes?: string;
    }) => createShunterTask({ ...data, taskType: "SPOT" }),
    onSuccess: () => {
      Alert.alert("Sent", "Shunter request created");
      setModalVisible(false);
    },
    onError: () => Alert.alert("Error", "Could not request shunter"),
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bays}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BayCard
            bay={item}
            onUpdateStatus={(b) => {
              setSelectedBay(b);
              setModalVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No bays configured</Text>
        }
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Update Door {selectedBay?.doorNumber}
            </Text>
            <Text style={styles.sub}>
              Trailer: {selectedBay?.trailerNumber ?? "—"}
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {STATUS_ORDER.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.btn,
                    { backgroundColor: BAY_COLOURS[s] },
                    selectedBay?.status === s && { opacity: 0.55 },
                  ]}
                  disabled={selectedBay?.status === s || updateMut.isPending}
                  onPress={() => {
                    if (s === "DEPARTING") {
                      Alert.alert(
                        "Safety Check",
                        "Confirm the following before releasing:\n\n• Wheel chocks removed\n• Dock plate retracted\n• Door closed\n• Paperwork signed",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Confirm & Release",
                            onPress: () =>
                              selectedBay &&
                              updateMut.mutate({
                                id: selectedBay.id,
                                status: s,
                              }),
                          },
                        ],
                      );
                    } else if (s === "OUT_OF_USE") {
                      Alert.prompt(
                        "Bay Out of Use",
                        "Enter reason for taking bay out of service:",
                        (reason) => {
                          if (reason) {
                            selectedBay &&
                              updateMut.mutate({
                                id: selectedBay.id,
                                status: s,
                              });
                          }
                        },
                      );
                    } else {
                      selectedBay &&
                        updateMut.mutate({ id: selectedBay.id, status: s });
                    }
                  }}
                >
                  <Text style={styles.btnText}>{s.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: "#0891b2", marginTop: 8 },
                ]}
                disabled={!selectedBay || shunterMut.isPending}
                onPress={() => {
                  if (!selectedBay) return;
                  if (selectedBay.status === "OUT_OF_USE") {
                    Alert.alert(
                      "Bay Out of Use",
                      "Cannot request shunter for broken bay",
                    );
                    return;
                  }

                  // Use Alert.prompt for trailer number, then action sheet for options
                  Alert.alert(
                    "Request Shunter",
                    `What trailer is needed at Door ${selectedBay.doorNumber}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Specific Trailer No.",
                        onPress: () => {
                          Alert.prompt(
                            "Specific Trailer",
                            "Enter the trailer number required:",
                            (trailer) => {
                              if (!trailer) return;
                              shunterMut.mutate({
                                trailerNumber: trailer,
                                toLocationName: `Door ${selectedBay.doorNumber}`,
                                fromLocationName: "Yard",
                                priority: "URGENT",
                                notes: "Specific trailer requested",
                              });
                            },
                          );
                        },
                      },
                      {
                        text: "Any Available Empty",
                        onPress: () => {
                          // Ask for size/type
                          Alert.alert(
                            "Trailer Type",
                            "Select required trailer size:",
                            TRAILER_TYPES.map((type) => ({
                              text: type,
                              onPress: () => {
                                shunterMut.mutate({
                                  trailerNumber: "ANY AVAILABLE",
                                  toLocationName: `Door ${selectedBay.doorNumber}`,
                                  fromLocationName: "Yard",
                                  priority: "HIGH",
                                  notes: `Requires ${type} trailer`,
                                });
                              },
                            })).concat([
                              {
                                text: "Cancel",
                                /* style */
                                onPress: () => {},
                              },
                            ]),
                          );
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={styles.btnText}>📢 Request Shunter Move</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#6b7280", marginTop: 8 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Load Sheet List ──────────────────────────────────────────────────────────

function LoadSheetRow({
  sheet,
  onOpen,
  onShare,
  onEmail,
}: {
  sheet: LoadSheet;
  onOpen: (id: string) => void;
  onShare: (id: string) => void;
  onEmail: (id: string) => void;
}) {
  const col = LS_COLOURS[sheet.status] ?? "#6b7280";
  const unit = UNIT_LABEL(sheet);
  const pct = sheet.completionPct ?? 0;
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: col, borderLeftWidth: 4 }]}
      onPress={() => onOpen(sheet.id)}
    >
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{sheet.loadSheetNumber}</Text>
          {sheet.carrierName && (
            <Text style={styles.sub}>{sheet.carrierName}</Text>
          )}
          {sheet.destinationBranch && (
            <Text style={styles.sub}>→ {sheet.destinationBranch}</Text>
          )}
          {sheet.trailerNumber && (
            <Text style={styles.sub}>🚛 {sheet.trailerNumber}</Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: col + "22" }]}>
            <Text style={[styles.badgeText, { color: col }]}>
              {sheet.status}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onShare(sheet.id);
              }}
            >
              <Ionicons name="share-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEmail(sheet.id);
              }}
            >
              <Ionicons name="mail-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` as any, backgroundColor: col },
          ]}
        />
      </View>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.meta}>
            {sheet.loadedBoxes}/{sheet.totalBoxes} {unit}s loaded
          </Text>
          {!!sheet.maxWeightCapacity && (
            <Text
              style={[
                styles.meta,
                {
                  color:
                    sheet.totalWeight > sheet.maxWeightCapacity
                      ? "#ef4444"
                      : "#64748b",
                },
              ]}
            >
              {sheet.totalWeight} / {sheet.maxWeightCapacity} kg{" "}
              {sheet.totalWeight > sheet.maxWeightCapacity
                ? "(Overweight)"
                : ""}
            </Text>
          )}
        </View>
        <Text style={styles.meta}>{pct.toFixed(0)}%</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Load Sheet Detail (lines + tipper record) ────────────────────────────────

function LoadSheetDetail({
  sheetId,
  onBack,
}: {
  sheetId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [recordModal, setRecordModal] = useState<LoadSheetLine | null>(null);
  const [sectionPick, setSectionPick] = useState<TrailerSection>("UNASSIGNED");
  const [layerInput, setLayerInput] = useState("1");
  const [posInput, setPosInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");

  const emailMut = useMutation({
    mutationFn: (recipients: string[]) => emailLoadSheet(sheetId, recipients),
    onSuccess: () => {
      Alert.alert("Success", "Load sheet emailed successfully");
      setEmailModalVisible(false);
      setEmailRecipients("");
    },
    onError: () => Alert.alert("Error", "Failed to email load sheet"),
  });

  const handleShare = async () => {
    try {
      const url = getLoadSheetPdfUrl(sheetId);
      // On iOS, 'url' opens rich share sheet. On Android, 'message' contains the link.
      await Share.share({
        message: `Load Sheet PDF: ${url}`,
        url: url,
      });
    } catch (e) {
      Alert.alert("Error", "Could not share load sheet");
    }
  };

  const { data: sheet } = useQuery({
    queryKey: ["load-sheet", sheetId],
    queryFn: () => getLoadSheet(sheetId),
  });
  const { data: linesData } = useQuery({
    queryKey: ["load-lines", sheetId],
    queryFn: () => getLoadSheetLines(sheetId),
  });
  const { data: prog } = useQuery({
    queryKey: ["load-progress", sheetId],
    queryFn: () => getLoadProgress(sheetId),
    refetchInterval: 15000,
  });

  const loadedMut = useMutation({
    mutationFn: (line: LoadSheetLine) =>
      recordBoxLoaded(sheetId, line.id, {
        quantityLoaded: line.quantity,
        loadSection: sectionPick,
        loadLayer: parseInt(layerInput) || 1,
        loadPosition: posInput || undefined,
        notes: notesInput || undefined,
        userId: user?.id,
        loadedBy: user?.name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["load-lines", sheetId] });
      qc.invalidateQueries({ queryKey: ["load-progress", sheetId] });
      qc.invalidateQueries({ queryKey: ["load-sheet", sheetId] });
      setRecordModal(null);
      setPosInput("");
      setNotesInput("");
    },
    onError: () => Alert.alert("Error", "Could not record item as loaded"),
  });

  const atBayMut = useMutation({
    mutationFn: (lineId: string) => recordBoxAtBay(sheetId, lineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["load-lines", sheetId] });
    },
    onError: () => Alert.alert("Error", "Could not record arrived at bay"),
  });

  const advanceMut = useMutation({
    mutationFn: (action: Parameters<typeof advanceLoadSheetStatus>[1]) =>
      advanceLoadSheetStatus(sheetId, action, {
        userId: user?.id,
        userName: user?.name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["load-sheet", sheetId] });
      qc.invalidateQueries({ queryKey: ["load-sheets"] });
    },
    onError: () => Alert.alert("Error", "Could not update load sheet status"),
  });

  const handleDispatch = () => {
    Alert.alert(
      "Confirm Dispatch Safe",
      "Please confirm the load is secure, balanced, and safe for transport.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Safe & Dispatch",
          style: "default",
          onPress: () => advanceMut.mutate("dispatch"),
        },
      ],
    );
  };

  const s = sheet as unknown as LoadSheet | null;
  const lines: LoadSheetLine[] = (linesData as any)?.lines ?? [];
  const progress = prog as unknown as any;
  const unit = UNIT_LABEL(s);
  const col = s ? (LS_COLOURS[s.status] ?? "#6b7280") : "#6b7280";
  const sections: TrailerSection[] = ["FRONT", "MID", "REAR", "UNASSIGNED"];

  const LINE_STATUS_COLORS: Record<string, string> = {
    PENDING: "#6b7280",
    PICKED: "#3b82f6",
    AT_BAY: "#8b5cf6",
    LOADED: "#10b981",
    SHORT: "#ef4444",
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: col }]}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{s?.loadSheetNumber ?? "…"}</Text>
          <Text style={styles.sub}>
            {s?.carrierName}
            {s?.trailerNumber ? ` — 🚛 ${s.trailerNumber}` : ""}
          </Text>
          {s?.dispatchedBy && (
            <Text
              style={[
                styles.sub,
                { color: "#059669", fontWeight: "600", marginTop: 4 },
              ]}
            >
              Safe confirmation & Dispatched by: {s.dispatchedBy}
            </Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={[styles.badge, { backgroundColor: col + "22" }]}>
            <Text style={[styles.badgeText, { color: col }]}>
              {s?.status ?? "…"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEmailModalVisible(true)}>
              <Ionicons name="mail-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* KPI strip */}
      {progress && (
        <View style={styles.kpiRow}>
          {[
            { l: "Pending", v: progress.pending, c: "#6b7280" },
            { l: "At Bay", v: progress.atBay, c: "#8b5cf6" },
            { l: "Loaded", v: progress.loaded, c: "#10b981" },
            { l: "Short", v: progress.short, c: "#ef4444" },
          ].map(({ l, v, c }) => (
            <View key={l} style={styles.kpi}>
              <Text style={[styles.kpiVal, { color: c }]}>{v}</Text>
              <Text style={styles.kpiLbl}>{l}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Advance status actions */}
      {s && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
        >
          <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
            {s.status === "READY" && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#f59e0b" }]}
                onPress={() => advanceMut.mutate("start_loading")}
                disabled={advanceMut.isPending}
              >
                <Text style={styles.btnText}>Start Loading</Text>
              </TouchableOpacity>
            )}
            {s.status === "LOADING" && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#10b981" }]}
                onPress={() => advanceMut.mutate("complete_loading")}
                disabled={advanceMut.isPending}
              >
                <Text style={styles.btnText}>Mark Loaded</Text>
              </TouchableOpacity>
            )}
            {s.status === "LOADED" && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#059669" }]}
                onPress={handleDispatch}
                disabled={advanceMut.isPending}
              >
                <Text style={styles.btnText}>Dispatch</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Lines list */}
      <FlatList
        data={lines}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const lc = LINE_STATUS_COLORS[item.status] ?? "#6b7280";
          return (
            <View
              style={[styles.card, { borderLeftColor: lc, borderLeftWidth: 4 }]}
            >
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.sub}>
                    {item.sku}
                    {item.orderNumber ? ` — Order ${item.orderNumber}` : ""}
                  </Text>
                  <Text style={styles.sub}>
                    {item.unitCount ?? item.boxes} {unit}
                    {(item.unitCount ?? item.boxes) !== 1 ? "s" : ""}{" "}
                    {item.stillageType
                      ? `· ${item.stillageType.replace("_", " ")}`
                      : ""}
                  </Text>
                  {item.loadedBy && (
                    <Text
                      style={[
                        styles.sub,
                        { marginTop: 4, fontStyle: "italic" },
                      ]}
                    >
                      Loaded by: {item.loadedBy}
                    </Text>
                  )}
                  {item.loadSection !== "UNASSIGNED" && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              SECTION_COLOURS[item.loadSection] + "22",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: SECTION_COLOURS[item.loadSection] },
                          ]}
                        >
                          {item.loadSection}
                        </Text>
                      </View>
                      {item.loadPosition && (
                        <Text style={styles.meta}>{item.loadPosition}</Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <View style={[styles.badge, { backgroundColor: lc + "22" }]}>
                    <Text style={[styles.badgeText, { color: lc }]}>
                      {item.status}
                    </Text>
                  </View>
                  {item.status === "PICKED" && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#8b5cf6" }]}
                      onPress={() => atBayMut.mutate(item.id)}
                      disabled={atBayMut.isPending}
                    >
                      <Text style={styles.btnText}>At Bay</Text>
                    </TouchableOpacity>
                  )}
                  {(item.status === "AT_BAY" || item.status === "PICKED") && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#10b981" }]}
                      onPress={() => {
                        setSectionPick(
                          item.loadSection !== "UNASSIGNED"
                            ? item.loadSection
                            : "REAR",
                        );
                        setPosInput(item.loadPosition ?? "");
                        setRecordModal(item);
                      }}
                    >
                      <Text style={styles.btnText}>Load ✓</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {item.pickerName && (
                <Text style={styles.meta}>
                  Picker: {item.pickerName}
                  {item.pickedAt
                    ? ` · ${new Date(item.pickedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No lines on this load sheet</Text>
        }
      />

      {/* Record box loaded modal */}
      <Modal visible={!!recordModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Record {unit} Loaded</Text>
            <Text style={styles.sub} numberOfLines={2}>
              {recordModal?.productName}
            </Text>
            <Text style={styles.sub}>
              {recordModal?.unitCount ?? recordModal?.boxes} {unit}
              {(recordModal?.unitCount ?? recordModal?.boxes) !== 1 ? "s" : ""}
            </Text>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Trailer Section
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(["FRONT", "MID", "REAR", "UNASSIGNED"] as TrailerSection[]).map(
                (sec) => (
                  <TouchableOpacity
                    key={sec}
                    style={[
                      styles.chip,
                      sectionPick === sec && {
                        backgroundColor: SECTION_COLOURS[sec],
                        borderColor: SECTION_COLOURS[sec],
                      },
                    ]}
                    onPress={() => setSectionPick(sec)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        sectionPick === sec && { color: "#fff" },
                      ]}
                    >
                      {sec}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>
              Layer (1 = floor)
            </Text>
            <TextInput
              style={styles.input}
              value={layerInput}
              onChangeText={setLayerInput}
              keyboardType="numeric"
              placeholder="1"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>
              Position (e.g. LEFT-REAR-1)
            </Text>
            <TextInput
              style={styles.input}
              value={posInput}
              onChangeText={setPosInput}
              placeholder="Optional"
              autoCapitalize="characters"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={notesInput}
              onChangeText={setNotesInput}
              placeholder="Optional notes"
              multiline
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#6b7280" }]}
                onPress={() => setRecordModal(null)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#10b981" }]}
                disabled={loadedMut.isPending}
                onPress={() => recordModal && loadedMut.mutate(recordModal)}
              >
                {loadedMut.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Confirm Loaded</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal visible={emailModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Email Load Sheet</Text>
            <Text style={styles.sub}>
              Send a copy of Load Sheet {s?.loadSheetNumber} to:
            </Text>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Recipients (comma separated)
            </Text>
            <TextInput
              style={styles.input}
              value={emailRecipients}
              onChangeText={setEmailRecipients}
              placeholder="e.g. transport@example.com, agency@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#6b7280" }]}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#2563EB" }]}
                disabled={emailMut.isPending || !emailRecipients}
                onPress={() => {
                  const recipients = emailRecipients
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean);
                  if (recipients.length > 0) {
                    emailMut.mutate(recipients);
                  }
                }}
              >
                {emailMut.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Send Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Load Sheets Tab (list → detail) ─────────────────────────────────────────

const LS_STATUS_FILTERS: Array<LoadSheetStatus | "ALL"> = [
  "ALL",
  "BUILDING",
  "READY",
  "LOADING",
  "LOADED",
  "DISPATCHED",
];

function LoadSheetsTab() {
  const [filter, setFilter] = useState<LoadSheetStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<string | null>(null);

  // Quick Action State
  const [emailSheetId, setEmailSheetId] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["load-sheets", filter],
    queryFn: () =>
      getLoadSheets(filter !== "ALL" ? { status: filter } : undefined),
    refetchInterval: 30000,
  });

  const emailMut = useMutation({
    mutationFn: (recipients: string[]) =>
      emailSheetId
        ? emailLoadSheet(emailSheetId, recipients)
        : Promise.reject("No sheet selected"),
    onSuccess: () => {
      Alert.alert("Success", "Load sheet emailed successfully");
      setEmailSheetId(null);
      setEmailRecipients("");
    },
    onError: () => Alert.alert("Error", "Failed to email load sheet"),
  });

  const handleShare = async (id: string) => {
    try {
      const url = getLoadSheetPdfUrl(id);
      await Share.share({
        message: `Load Sheet PDF: ${url}`,
        url: url,
      });
    } catch (e) {
      Alert.alert("Error", "Could not share load sheet");
    }
  };

  const sheets: LoadSheet[] = (data as any)?.loadSheets ?? [];

  if (selected) {
    return (
      <LoadSheetDetail sheetId={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterRow}>
          {LS_STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[styles.chipText, filter === f && styles.chipActiveText]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sheets}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoadSheetRow
              sheet={item}
              onOpen={setSelected}
              onShare={handleShare}
              onEmail={(id) => setEmailSheetId(id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No load sheets found</Text>
          }
        />
      )}

      {/* Email Modal for List View */}
      <Modal visible={!!emailSheetId} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Email Load Sheet</Text>
            <Text style={styles.sub}>Enter recipients for the load sheet:</Text>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Recipients (comma separated)
            </Text>
            <TextInput
              style={styles.input}
              value={emailRecipients}
              onChangeText={setEmailRecipients}
              placeholder="e.g. transport@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#6b7280" }]}
                onPress={() => {
                  setEmailSheetId(null);
                  setEmailRecipients("");
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#2563EB" }]}
                disabled={emailMut.isPending || !emailRecipients}
                onPress={() => {
                  const recipients = emailRecipients
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean);
                  if (recipients.length > 0) emailMut.mutate(recipients);
                }}
              >
                {emailMut.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Pick Tasks Tab ───────────────────────────────────────────────────────────

function PickTaskCard({
  task,
  onAssign,
  onComplete,
  onShort,
}: {
  task: PickTask;
  onAssign: (t: PickTask) => void;
  onComplete: (t: PickTask) => void;
  onShort: (t: PickTask) => void;
}) {
  const col = PICK_COLOURS[task.status] ?? "#6b7280";
  const PRIORITY_COLOURS: Record<string, string> = {
    LOW: "#6b7280",
    NORMAL: "#3b82f6",
    HIGH: "#f59e0b",
    URGENT: "#f97316",
    CRITICAL: "#ef4444",
  };
  return (
    <View style={[styles.card, { borderLeftColor: col, borderLeftWidth: 4 }]}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {task.title}
          </Text>
          {task.productName && (
            <Text style={styles.sub}>
              {task.sku} — {task.productName}
            </Text>
          )}
          <Text style={styles.sub}>
            {task.fromLocationCode ? `From: ${task.fromLocationCode}  ` : ""}
            Qty: {task.completedQuantity}/{task.quantity}
          </Text>
          {task.assignedToName && (
            <Text style={styles.sub}>👷 {task.assignedToName}</Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[styles.badge, { backgroundColor: col + "22" }]}>
            <Text style={[styles.badgeText, { color: col }]}>
              {task.status}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: PRIORITY_COLOURS[task.priority] + "22" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: PRIORITY_COLOURS[task.priority] },
              ]}
            >
              {task.priority}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
        {task.status === "UNASSIGNED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3b82f6" }]}
            onPress={() => onAssign(task)}
          >
            <Text style={styles.btnText}>Assign</Text>
          </TouchableOpacity>
        )}
        {(task.status === "ASSIGNED" ||
          task.status === "IN_PROGRESS" ||
          task.status === "AT_BAY") && (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#10b981" }]}
              onPress={() => onComplete(task)}
            >
              <Text style={styles.btnText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#ef4444" }]}
              onPress={() => onShort(task)}
            >
              <Text style={styles.btnText}>Short</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {task.loadSheetNumber && (
        <Text style={styles.meta}>LS: {task.loadSheetNumber}</Text>
      )}
    </View>
  );
}

function PicksTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "UNASSIGNED" | "IN_PROGRESS" | "AT_BAY"
  >("ALL");
  const [assignModal, setAssignModal] = useState<PickTask | null>(null);
  const [pickerIdInput, setPickerIdInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pick-tasks", statusFilter],
    queryFn: () =>
      getPickTasks(
        statusFilter !== "ALL" ? { status: statusFilter as any } : undefined,
      ),
    refetchInterval: 20000,
  });

  const assignMut = useMutation({
    mutationFn: ({ taskId, pickerId }: { taskId: string; pickerId: string }) =>
      assignPickTask(taskId, pickerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pick-tasks"] });
      setAssignModal(null);
      setPickerIdInput("");
    },
    onError: () => Alert.alert("Error", "Could not assign task"),
  });

  const completeMut = useMutation({
    mutationFn: ({ taskId, qty }: { taskId: string; qty: number }) =>
      completePickTask(taskId, qty),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pick-tasks"] }),
    onError: () => Alert.alert("Error", "Could not complete task"),
  });

  const shortMut = useMutation({
    mutationFn: ({ taskId, qty }: { taskId: string; qty: number }) =>
      shortPickTask(taskId, qty, "Short pick reported on mobile"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pick-tasks"] }),
    onError: () => Alert.alert("Error", "Could not record short pick"),
  });

  const tasks: PickTask[] = (data as any)?.tasks ?? [];

  const PICK_STATUS_FILTERS = [
    "ALL",
    "UNASSIGNED",
    "IN_PROGRESS",
    "AT_BAY",
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterRow}>
          {PICK_STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, statusFilter === f && styles.chipActive]}
              onPress={() => setStatusFilter(f as any)}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === f && styles.chipActiveText,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PickTaskCard
              task={item}
              onAssign={setAssignModal}
              onComplete={(t) =>
                Alert.alert("Complete Pick", `Mark ${t.quantity} completed?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Confirm",
                    onPress: () =>
                      completeMut.mutate({ taskId: t.id, qty: t.quantity }),
                  },
                ])
              }
              onShort={(t) =>
                Alert.alert("Short Pick", "Record short pick?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Short",
                    style: "destructive",
                    onPress: () =>
                      shortMut.mutate({ taskId: t.id, qty: t.quantity }),
                  },
                ])
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No pick tasks found</Text>
          }
        />
      )}
      <Modal visible={!!assignModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Assign Pick Task</Text>
            <Text style={styles.sub} numberOfLines={2}>
              {assignModal?.title}
            </Text>
            <Text style={[styles.label, { marginTop: 12 }]}>
              Picker Employee ID
            </Text>
            <TextInput
              style={styles.input}
              value={pickerIdInput}
              onChangeText={setPickerIdInput}
              placeholder="e.g. EMP-0042"
              autoCapitalize="characters"
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#6b7280" }]}
                onPress={() => setAssignModal(null)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#3b82f6" }]}
                disabled={!pickerIdInput.trim() || assignMut.isPending}
                onPress={() =>
                  assignModal &&
                  assignMut.mutate({
                    taskId: assignModal.id,
                    pickerId: pickerIdInput.trim(),
                  })
                }
              >
                {assignMut.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Trailer Plan Tab ─────────────────────────────────────────────────────────

function TrailerPlanTab() {
  const qc = useQueryClient();
  const [sheetId, setSheetId] = useState("");
  const [result, setResult] = useState<TrailerOptimisationResult | null>(null);

  const { data: sheetsData } = useQuery({
    queryKey: ["load-sheets", "LOADING"],
    queryFn: () => getLoadSheets({ status: "LOADING" }),
  });
  const sheets: LoadSheet[] = (sheetsData as any)?.loadSheets ?? [];

  const runMut = useMutation({
    mutationFn: (id: string) => runTrailerOptimisation(id),
    onSuccess: (res) => setResult(res as unknown as TrailerOptimisationResult),
    onError: () => Alert.alert("Error", "Optimisation failed"),
  });

  const applyMut = useMutation({
    mutationFn: () => applyOptimisationPlan(sheetId, result!),
    onSuccess: () => {
      Alert.alert("Applied", "Loading plan applied to all lines");
      qc.invalidateQueries({ queryKey: ["load-lines", sheetId] });
      setResult(null);
    },
    onError: () => Alert.alert("Error", "Could not apply plan"),
  });

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={styles.sectionHeader}>Select a LOADING load sheet</Text>
      {sheets.length === 0 && (
        <Text style={styles.empty}>
          No load sheets currently in LOADING status
        </Text>
      )}
      {sheets.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[
            styles.card,
            sheetId === s.id && { borderColor: "#2563eb", borderWidth: 2 },
          ]}
          onPress={() => {
            setSheetId(s.id);
            setResult(null);
          }}
        >
          <Text style={styles.cardTitle}>{s.loadSheetNumber}</Text>
          <Text style={styles.sub}>
            {s.carrierName}
            {s.trailerNumber ? ` — 🚛 ${s.trailerNumber}` : ""}
          </Text>
          <Text style={styles.sub}>
            {s.loadedBoxes}/{s.totalBoxes} {UNIT_LABEL(s)}s loaded ·{" "}
            {s.completionPct.toFixed(0)}%
          </Text>
        </TouchableOpacity>
      ))}

      {sheetId && !result && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#7c3aed", marginTop: 8 }]}
          disabled={runMut.isPending}
          onPress={() => runMut.mutate(sheetId)}
        >
          {runMut.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>🤖 Run AI Trailer Optimisation</Text>
          )}
        </TouchableOpacity>
      )}

      {result && (
        <View style={{ marginTop: 12 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Optimisation Result</Text>
            <Text style={styles.sub}>
              Est. load time: {result.estimatedLoadTimeMins} mins
            </Text>
            <Text
              style={[
                styles.sub,
                { color: result.weightDistributionOk ? "#10b981" : "#ef4444" },
              ]}
            >
              Weight distribution:{" "}
              {result.weightDistributionOk ? "✓ OK" : "⚠ Review"}
            </Text>
          </View>
          {result.sections.map((sec) => (
            <View
              key={sec.section}
              style={[
                styles.card,
                {
                  borderLeftColor: SECTION_COLOURS[sec.section],
                  borderLeftWidth: 4,
                },
              ]}
            >
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{sec.label}</Text>
                <Text style={styles.sub}>
                  {sec.totalBoxes} boxes · {sec.totalWeight.toFixed(0)} kg
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${sec.utilizationPct}%` as any,
                      backgroundColor: SECTION_COLOURS[sec.section],
                    },
                  ]}
                />
              </View>
              <Text style={styles.meta}>
                {sec.utilizationPct.toFixed(0)}% utilisation
              </Text>
              {sec.lines.slice(0, 5).map((ln) => (
                <View
                  key={ln.lineId}
                  style={[styles.cardRow, { marginTop: 4 }]}
                >
                  <Text style={[styles.sub, { flex: 1 }]} numberOfLines={1}>
                    {ln.productName}
                  </Text>
                  <Text style={styles.meta}>
                    Order {ln.loadOrder} · L{ln.layer}
                  </Text>
                </View>
              ))}
              {sec.lines.length > 5 && (
                <Text style={styles.meta}>
                  +{sec.lines.length - 5} more items
                </Text>
              )}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: "#6b7280" }]}
              onPress={() => setResult(null)}
            >
              <Text style={styles.btnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: "#10b981" }]}
              disabled={applyMut.isPending}
              onPress={() => applyMut.mutate()}
            >
              {applyMut.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Apply Plan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function MarshallingScreen() {
  const [tab, setTab] = useState<MainTab>("bays");

  const TABS: { key: MainTab; label: string; icon: string }[] = [
    { key: "bays", label: "Bay Board", icon: "git-merge-outline" },
    { key: "sheets", label: "Load Sheets", icon: "document-text-outline" },
    { key: "picks", label: "Picks", icon: "layers-outline" },
    { key: "plan", label: "Trailer Plan", icon: "car-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* Screen header */}
      <View style={styles.screenHeader}>
        <Ionicons name="git-merge-outline" size={22} color="#2563EB" />
        <Text style={styles.screenTitle}>Marshalling</Text>
      </View>

      {/* Tab switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
      >
        <View style={styles.tabRow}>
          {TABS.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Ionicons
                name={icon as any}
                size={15}
                color={tab === key ? "#2563EB" : "#94a3b8"}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  tab === key && styles.tabBtnActiveText,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === "bays" && <BayBoard />}
        {tab === "sheets" && <LoadSheetsTab />}
        {tab === "picks" && <PicksTab />}
        {tab === "plan" && <TrailerPlanTab />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  screenTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  tabRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  tabBtnActive: { backgroundColor: "#EFF6FF" },
  tabBtnText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  tabBtnActiveText: { color: "#2563EB", fontWeight: "600" },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  meta: { fontSize: 11, color: "#94a3b8", marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  btn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  progressTrack: {
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 5, borderRadius: 3 },
  kpiRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  kpi: { flex: 1, alignItems: "center", paddingVertical: 12 },
  kpiVal: { fontSize: 22, fontWeight: "700" },
  kpiLbl: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
  filterScroll: {
    flexGrow: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterRow: { flexDirection: "row", gap: 8, padding: 10 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipActiveText: { color: "#fff" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  label: { fontSize: 13, color: "#64748b", fontWeight: "500", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 2,
  },
});
