import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/store/auth.store";
import { canAccess } from "../../lib/config/roleAccess";

interface FeatureTile {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  feature: string;
}

const ALL_FEATURES: FeatureTile[] = [
  { label: "Analytics", icon: "bar-chart-outline", route: "/(tabs)/analytics", color: "#3b82f6", feature: "analytics" },
  { label: "Inventory", icon: "cube-outline", route: "/(tabs)/inventory", color: "#10b981", feature: "inventory" },
  { label: "Orders", icon: "receipt-outline", route: "/(tabs)/orders", color: "#6366f1", feature: "orders" },
  { label: "Picking", icon: "layers-outline", route: "/(tabs)/picking", color: "#f59e0b", feature: "picking" },
  { label: "Receiving", icon: "download-outline", route: "/(tabs)/receiving", color: "#8b5cf6", feature: "receiving" },
  { label: "Shipping", icon: "airplane-outline", route: "/(tabs)/shipping", color: "#0ea5e9", feature: "shipping" },
  { label: "Returns", icon: "return-up-back-outline", route: "/(tabs)/returns", color: "#ef4444", feature: "returns" },
  { label: "Quality", icon: "shield-checkmark-outline", route: "/(tabs)/quality", color: "#10b981", feature: "quality" },
  { label: "CAPA", icon: "construct-outline", route: "/(tabs)/capa", color: "#f97316", feature: "capa" },
  { label: "Compliance", icon: "document-text-outline", route: "/(tabs)/compliance", color: "#7c3aed", feature: "compliance" },
  { label: "Suppliers", icon: "business-outline", route: "/(tabs)/suppliers", color: "#0891b2", feature: "suppliers" },
  { label: "Invoices", icon: "cash-outline", route: "/(tabs)/invoices", color: "#059669", feature: "invoices" },
  { label: "Cycle Counts", icon: "swap-horizontal-outline", route: "/(tabs)/cyclecount", color: "#d97706", feature: "cycleCount" },
  // ── Operational area tiles ─────────────────────────────────────────────────
  { label: "Yard Mgmt", icon: "car-outline", route: "/(tabs)/yard", color: "#0f766e", feature: "yard" },
  { label: "Dock / Staging", icon: "enter-outline", route: "/(tabs)/dock", color: "#1d4ed8", feature: "dock" },
  { label: "Marshalling", icon: "git-merge-outline", route: "/(tabs)/marshalling", color: "#4f46e5", feature: "marshalling" },
  { label: "Waves", icon: "layers-outline", route: "/(tabs)/waves", color: "#9333ea", feature: "waves" },
  { label: "Labour", icon: "people-outline", route: "/(tabs)/labor", color: "#b45309", feature: "labor" },
  { label: "Slotting", icon: "grid-outline", route: "/(tabs)/slotting", color: "#0369a1", feature: "slotting" },
  { label: "Assembly", icon: "build-outline", route: "/(tabs)/assembly", color: "#7c3aed", feature: "assembly" },
  { label: "Delivery", icon: "map-outline", route: "/(tabs)/delivery", color: "#10b981", feature: "delivery" },
];

const SCREEN_W = Dimensions.get("window").width;
const TILE_W = (SCREEN_W - 48) / 3;

export default function MoreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role;

  const visibleFeatures = ALL_FEATURES.filter((f) => canAccess(role, f.feature));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>All Features</Text>
      <Text style={styles.subHeading}>
        {user?.name ?? "User"} · {role ?? "Unknown role"}
      </Text>

      <View style={styles.grid}>
        {visibleFeatures.map((f) => (
          <TouchableOpacity
            key={f.route}
            style={styles.tile}
            onPress={() => router.push(f.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: f.color + "1a" }]}>
              <Ionicons name={f.icon} size={26} color={f.color} />
            </View>
            <Text style={styles.tileLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Ionicons name="person-outline" size={20} color="#374151" />
          <Text style={styles.settingsLabel}>My Profile</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 2 },
  subHeading: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: TILE_W,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  settingsRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  settingsLabel: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "600" },
});
