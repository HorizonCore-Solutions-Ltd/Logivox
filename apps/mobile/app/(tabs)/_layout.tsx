import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/store/auth.store";
import {
  isTabVisible,
  TAB_ADD_ON_MAP,
  type TabName,
} from "../../lib/config/roleAccess";
import { useAddOnsStore } from "../../lib/store/addons.store";

const ACTIVE = "#2563EB";
const INACTIVE = "#94A3B8";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabDef {
  name: TabName;
  title: string;
  icon: IoniconName;
  activeIcon?: IoniconName;
}

const TAB_DEFS: TabDef[] = [
  { name: "index", title: "Home", icon: "home-outline", activeIcon: "home" },
  {
    name: "picking",
    title: "Picking",
    icon: "layers-outline",
    activeIcon: "layers",
  },
  {
    name: "inventory",
    title: "Inventory",
    icon: "cube-outline",
    activeIcon: "cube",
  },
  {
    name: "orders",
    title: "Orders",
    icon: "receipt-outline",
    activeIcon: "receipt",
  },
  {
    name: "receiving",
    title: "Receiving",
    icon: "download-outline",
    activeIcon: "download",
  },
  { name: "returns", title: "Returns", icon: "return-up-back-outline" },
  {
    name: "quality",
    title: "Quality",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
  },
  {
    name: "capa",
    title: "CAPA",
    icon: "construct-outline",
    activeIcon: "construct",
  },
  {
    name: "compliance",
    title: "Compliance",
    icon: "document-text-outline",
    activeIcon: "document-text",
  },
  {
    name: "shipping",
    title: "Shipping",
    icon: "airplane-outline",
    activeIcon: "airplane",
  },
  {
    name: "suppliers",
    title: "Suppliers",
    icon: "business-outline",
    activeIcon: "business",
  },
  {
    name: "analytics",
    title: "Analytics",
    icon: "bar-chart-outline",
    activeIcon: "bar-chart",
  },
  { name: "cyclecount", title: "Counts", icon: "swap-horizontal-outline" },
  {
    name: "invoices",
    title: "Invoices",
    icon: "cash-outline",
    activeIcon: "cash",
  },
  { name: "more", title: "More", icon: "grid-outline", activeIcon: "grid" },
  // ── Operational tabs ───────────────────────────────────────────────────────
  { name: "yard", title: "Yard", icon: "car-outline", activeIcon: "car" },
  { name: "dock", title: "Dock", icon: "enter-outline", activeIcon: "enter" },
  {
    name: "marshalling",
    title: "Marshalling",
    icon: "git-merge-outline",
    activeIcon: "git-merge",
  },
  {
    name: "waves",
    title: "Waves",
    icon: "layers-outline",
    activeIcon: "layers",
  },
  {
    name: "labor",
    title: "Labour",
    icon: "people-outline",
    activeIcon: "people",
  },
  {
    name: "slotting",
    title: "Slotting",
    icon: "grid-outline",
    activeIcon: "grid",
  },
  {
    name: "assembly",
    title: "Assembly",
    icon: "build-outline",
    activeIcon: "build",
  },
  {
    name: "delivery",
    title: "Delivery",
    icon: "map-outline",
    activeIcon: "map",
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-outline",
    activeIcon: "person",
  },
  // Hidden screens (accessed via More)
  {
    name: "cognitive",
    title: "Cognitive",
    icon: "brain-outline",
  },
  {
    name: "transfers",
    title: "Transfers",
    icon: "git-network-outline",
  },
];

export default function TabLayout() {
  const { user } = useAuthStore();
  const role = user?.role;
  const addOnEnabled = useAddOnsStore((s) => s.isEnabled);

  const tabHref = (name: TabName): string | null => {
    // Gate on add-on first (e.g. Marshalling, Delivery)
    const requiredAddOn = TAB_ADD_ON_MAP[name];
    if (requiredAddOn && !addOnEnabled(requiredAddOn)) return null;
    // Then gate on role
    return isTabVisible(role, name) ? undefined! : null;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#1E3A5F" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      }}
    >
      {TAB_DEFS.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            href: tabHref(name),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused && activeIcon ? activeIcon : icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
