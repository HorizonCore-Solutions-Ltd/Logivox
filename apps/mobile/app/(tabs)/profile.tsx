import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Application from "expo-application";
import {
  User,
  Building2,
  Shield,
  Fingerprint,
  LogOut,
  ChevronRight,
  Bell,
  Globe,
  HelpCircle,
  Info,
  Moon,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/store/auth.store";
import { useOfflineStore } from "@/lib/store/offline.store";

export default function ProfileScreen() {
  const {
    user,
    biometricEnabled,
    signOut,
    enableBiometric,
    disableBiometric,
    isLoading,
  } = useAuthStore();
  const {
    isOnline,
    queue: pendingMutations,
    processQueue: syncPendingMutations,
  } = useOfflineStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const ok = await enableBiometric();
      if (!ok) {
        Alert.alert(
          "Unavailable",
          "Biometric authentication is not available on this device.",
        );
      }
    } else {
      await disableBiometric();
    }
  };

  const handleSyncNow = async () => {
    if (pendingMutations.length === 0) {
      Alert.alert("Already synced", "No pending changes to synchronise.");
      return;
    }
    await syncPendingMutations();
    Alert.alert(
      "Synced",
      `${pendingMutations.length} pending change(s) synced.`,
    );
  };

  const initials = user
    ? (user.name ?? user.email ?? "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const fullName = user?.name ?? user?.email ?? "Unknown User";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.email}>{user?.email ?? ""}</Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role.replace(/_/g, " ")}
              </Text>
            </View>
          )}
        </View>

        {/* Organisation */}
        {user?.organizationId && (
          <Section title="Organisation">
            <InfoRow
              icon={<Building2 color="#64748B" size={18} />}
              label="Org ID"
              value={user.organizationId}
            />
          </Section>
        )}

        {/* Connectivity */}
        <Section title="Status">
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {isOnline ? (
                <Wifi color="#059669" size={18} />
              ) : (
                <WifiOff color="#DC2626" size={18} />
              )}
              <Text style={styles.rowLabel}>Connection</Text>
            </View>
            <Text
              style={[
                styles.connectionText,
                { color: isOnline ? "#059669" : "#DC2626" },
              ]}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          {pendingMutations.length > 0 && (
            <TouchableOpacity style={styles.row} onPress={handleSyncNow}>
              <View style={styles.rowLeft}>
                <View style={styles.pendingDot} />
                <Text style={styles.rowLabel}>
                  {pendingMutations.length} pending change(s)
                </Text>
              </View>
              <Text style={styles.syncNowText}>Sync now</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* Security */}
        <Section title="Security">
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Fingerprint color="#64748B" size={18} />
              <Text style={styles.rowLabel}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
              thumbColor={biometricEnabled ? "#2563EB" : "#94A3B8"}
            />
          </View>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell color="#64748B" size={18} />
              <Text style={styles.rowLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
              thumbColor={notificationsEnabled ? "#2563EB" : "#94A3B8"}
            />
          </View>
        </Section>

        {/* Support */}
        <Section title="Support">
          <NavRow
            icon={<HelpCircle color="#64748B" size={18} />}
            label="Help & Feedback"
            onPress={() => {}}
          />
          <NavRow
            icon={<Globe color="#64748B" size={18} />}
            label="Website"
            onPress={() => {}}
          />
          <NavRow
            icon={<Info color="#64748B" size={18} />}
            label="About"
            onPress={() => {}}
          />
        </Section>

        {/* App version */}
        <Text style={styles.version}>
          Flowstock v{Application.nativeApplicationVersion ?? "1.0.0"} (
          {Application.nativeBuildVersion ?? "1"})
        </Text>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#DC2626" size="small" />
          ) : (
            <LogOut color="#DC2626" size={20} />
          )}
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <ChevronRight color="#CBD5E1" size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { paddingBottom: 48 },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
  fullName: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  email: { fontSize: 14, color: "#64748B", marginTop: 4 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  section: { marginBottom: 4, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowLabel: { fontSize: 15, color: "#0F172A", fontWeight: "500" },
  rowValue: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  connectionText: { fontSize: 14, fontWeight: "700" },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D97706",
  },
  syncNowText: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
    marginVertical: 16,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    marginTop: 8,
  },
  signOutText: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
});
