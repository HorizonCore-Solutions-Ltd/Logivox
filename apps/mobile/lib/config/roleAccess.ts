/**
 * Role-based access configuration for the mobile app.
 *
 * Each role defines:
 *  - tabs       : bottom tab names visible to this role (max 5 including "profile")
 *  - homeKPIs   : KPI card keys shown on the role's dashboard
 *  - quickActions: action IDs shown as quick-action buttons on dashboard
 *  - features   : granular feature flags (used for in-screen access checks)
 */
import { ADD_ONS } from "./addons";

export type AppRole =
  | "PICKER"
  | "RECEIVER"
  | "STOCK_CONTROLLER"
  | "RETURNS_AGENT"
  | "QC_INSPECTOR"
  | "CAPA_OFFICER"
  | "COMPLIANCE_OFFICER"
  | "FINANCE"
  | "SHIPPING_CLERK"
  | "SUPPLIER_MANAGER"
  | "SALES"
  | "MANAGER"
  | "ADMIN"
  // ── New operational roles ────────────────────────────────────────────────────
  | "YARD_OPERATIVE"
  | "MARSHALLER"
  | "LOAD_PLANNER"
  | "WAVE_PLANNER"
  | "ASSEMBLY_OPERATIVE"
  | "OPERATIONS_MANAGER"
  | "DRIVER";

export type TabName =
  | "index"         // Dashboard — always included
  | "picking"
  | "inventory"
  | "orders"
  | "receiving"
  | "returns"
  | "quality"
  | "capa"
  | "compliance"
  | "shipping"
  | "suppliers"
  | "analytics"
  | "cyclecount"
  | "invoices"
  | "more"          // Admin overflow grid
  | "profile"       // Always included
  // ── New operational tabs ─────────────────────────────────────────────────────
  | "yard"
  | "dock"
  | "marshalling"
  | "waves"
  | "labor"
  | "slotting"
  | "delivery"
  | "assembly";

export interface RoleConfig {
  label: string;          // Human-readable role name
  tabs: TabName[];        // Ordered list; "index" first, "profile" last
  homeKPIs: string[];
  quickActions: string[];
  features: string[];
}

const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  PICKER: {
    label: "Picker",
    tabs: ["index", "picking", "profile"],
    homeKPIs: ["picksToday", "pickAccuracy", "pendingWaves", "streak"],
    quickActions: ["startWave", "scanItem", "reportShortPick", "viewTasks"],
    features: ["picking", "scanning", "voiceCommand"],
  },

  RECEIVER: {
    label: "Receiver",
    tabs: ["index", "receiving", "inventory", "profile"],
    homeKPIs: ["asnsDue", "itemsReceivedToday", "pendingPutaway", "discrepancies"],
    quickActions: ["scanASN", "receiveASN", "reportDiscrepancy", "viewASNs"],
    features: ["receiving", "inventory.view", "scanning", "voiceCommand"],
  },

  STOCK_CONTROLLER: {
    label: "Stock Controller",
    tabs: ["index", "inventory", "cyclecount", "profile"],
    homeKPIs: ["totalSKUs", "lowStockAlerts", "cycleCountsDue", "inventoryValue"],
    quickActions: ["startCycleCount", "adjustStock", "viewLowStock", "scanItem"],
    features: [
      "inventory.view",
      "inventory.adjust",
      "cycleCount",
      "scanning",
      "voiceCommand",
    ],
  },

  RETURNS_AGENT: {
    label: "Returns Agent",
    tabs: ["index", "returns", "inventory", "profile"],
    homeKPIs: ["returnsOpen", "returnsPendingApproval", "returnsReceivedToday", "returnValuePending"],
    quickActions: ["createReturn", "approveReturn", "receiveReturn", "viewReturns"],
    features: ["returns", "inventory.view", "scanning"],
  },

  QC_INSPECTOR: {
    label: "QC Inspector",
    tabs: ["index", "quality", "returns", "profile"],
    homeKPIs: ["inspectionsDue", "passRate", "failedToday", "onHold"],
    quickActions: ["startInspection", "viewInspections", "viewReturns", "raiseCAPA"],
    features: ["quality", "returns.view", "capa.create"],
  },

  CAPA_OFFICER: {
    label: "CAPA Officer",
    tabs: ["index", "capa", "compliance", "profile"],
    homeKPIs: ["capaOpen", "capaOverdue", "capaClosedThisMonth", "complianceScore"],
    quickActions: ["createCAPA", "reviewCAPA", "viewCompliance", "viewAuditLog"],
    features: ["capa", "compliance.view"],
  },

  COMPLIANCE_OFFICER: {
    label: "Compliance Officer",
    tabs: ["index", "compliance", "capa", "profile"],
    homeKPIs: ["complianceScore", "tasksDue", "auditsDue", "capaOverdue"],
    quickActions: ["viewCompliance", "completeTask", "viewAuditLog", "reviewCAPA"],
    features: ["compliance", "capa.view", "auditLog"],
  },

  FINANCE: {
    label: "Finance",
    tabs: ["index", "invoices", "profile"],
    homeKPIs: ["outstandingInvoices", "overdueAmount", "revenueThisMonth", "cashCollected"],
    quickActions: ["viewInvoices", "approveInvoice", "viewOverdue", "exportReport"],
    features: ["invoices", "reporting.financial"],
  },

  SHIPPING_CLERK: {
    label: "Shipping Clerk",
    tabs: ["index", "shipping", "orders", "profile"],
    homeKPIs: ["packingTasksDue", "shipmentsToday", "pendingDispatch", "lateShipments"],
    quickActions: ["viewPackingTasks", "generateLabel", "dispatchShipment", "viewOrders"],
    features: ["shipping", "orders.view", "scanning"],
  },

  SUPPLIER_MANAGER: {
    label: "Supplier Manager",
    tabs: ["index", "suppliers", "receiving", "profile"],
    homeKPIs: ["activeSuppliers", "openPOs", "asnsDue", "scorecardAlerts"],
    quickActions: ["viewSuppliers", "createPO", "viewASNs", "viewScorecard"],
    features: ["suppliers", "receiving.view", "orders.purchase"],
  },

  SALES: {
    label: "Sales",
    tabs: ["index", "orders", "invoices", "profile"],
    homeKPIs: ["ordersToday", "ordersPending", "revenueThisMonth", "outstandingInvoices"],
    quickActions: ["createOrder", "viewOrders", "viewInvoices", "viewCustomers"],
    features: ["orders", "invoices.view", "customers"],
  },

  MANAGER: {
    label: "Manager",
    tabs: ["index", "analytics", "orders", "more", "profile"],
    homeKPIs: [
      "ordersToday",
      "pickAccuracy",
      "shipRate",
      "utilizationRate",
      "capaOverdue",
      "complianceScore",
    ],
    quickActions: [
      "viewAnalytics",
      "viewOrders",
      "viewLaborPerformance",
      "viewAlerts",
    ],
    features: [
      "analytics",
      "orders",
      "inventory.view",
      "shipping.view",
      "returns.view",
      "quality.view",
      "capa.view",
      "compliance.view",
      "reporting",
      "laborPerformance",
      "labor",
      "waves",
      "yard.view",
      "dock.view",
      "slotting.view",
      "assembly.view",
    ],
  },

  ADMIN: {
    label: "Administrator",
    tabs: ["index", "analytics", "more", "profile"],
    homeKPIs: [
      "ordersToday",
      "pickAccuracy",
      "complianceScore",
      "capaOverdue",
      "inventoryValue",
      "revenueThisMonth",
    ],
    quickActions: [
      "viewAnalytics",
      "viewAlerts",
      "manageUsers",
      "systemSettings",
    ],
    features: [
      "analytics",
      "orders",
      "inventory",
      "shipping",
      "returns",
      "quality",
      "capa",
      "compliance",
      "suppliers",
      "invoices",
      "reporting",
      "admin",
      "laborPerformance",
      "cycleCount",
      "yard",
      "dock",
      "waves",
      "labor",
      "slotting",
      "assembly",
      "delivery",
    ],
  },

  // ── New operational roles ────────────────────────────────────────────────────

  YARD_OPERATIVE: {
    label: "Yard Operative",
    tabs: ["index", "yard", "profile"],
    homeKPIs: ["vehiclesOnSite", "inboundToday", "outboundToday", "pendingCheckIn"],
    quickActions: ["gateCheckIn", "gateCheckOut", "viewYard", "shunterTasks"],
    features: ["yard"],
  },

  MARSHALLER: {
    label: "Marshaller",
    tabs: ["index", "marshalling", "yard", "profile"],
    homeKPIs: ["loadSheetsActive", "boxesLoadedToday", "pendingPickTasks", "baysLoading"],
    quickActions: ["viewBayBoard", "viewLoadSheets", "assignPicks", "runTrailerPlan"],
    features: ["marshalling", "marshalling.bayBoard", "marshalling.loadSheets", "marshalling.picks", "marshalling.trailerPlan", "yard"],
  },

  LOAD_PLANNER: {
    label: "Load Planner",
    tabs: ["index", "dock", "analytics", "profile"],
    homeKPIs: ["trailersToLoad", "appointmentsToday", "loadEfficiency", "pendingDispatch"],
    quickActions: ["viewDockAppointments", "viewLoadPlanning", "dispatchShipment", "viewAnalytics"],
    features: ["dock", "dock.loadPlanning", "shipping.view", "analytics"],
  },

  WAVE_PLANNER: {
    label: "Wave Planner",
    tabs: ["index", "waves", "picking", "analytics", "profile"],
    homeKPIs: ["wavesActive", "wavesCompleted", "picksToday", "pickAccuracy"],
    quickActions: ["createWave", "releaseWave", "viewWaves", "viewPickerMetrics"],
    features: ["waves", "picking.view", "analytics"],
  },

  ASSEMBLY_OPERATIVE: {
    label: "Assembly Operative",
    tabs: ["index", "assembly", "inventory", "profile"],
    homeKPIs: ["ordersAssigned", "ordersInProgress", "componentsPicked", "completedToday"],
    quickActions: ["viewAssemblyOrders", "startAssembly", "pickComponent", "completeAssembly"],
    features: ["assembly", "inventory.view", "scanning"],
  },

  OPERATIONS_MANAGER: {
    label: "Operations Manager",
    tabs: ["index", "labor", "slotting", "analytics", "more", "profile"],
    homeKPIs: [
      "activeWorkers",
      "avgEfficiency",
      "slottingPending",
      "wavesActive",
      "pickAccuracy",
      "utilizationRate",
    ],
    quickActions: ["viewLaborDashboard", "runSlotting", "viewWaves", "viewAnalytics"],
    features: [
      "labor",
      "slotting",
      "waves",
      "analytics",
      "inventory.view",
      "picking.view",
      "dock.view",
      "yard.view",
      "assembly.view",
      "delivery.view",
      "reporting",
      "laborPerformance",
    ],
  },

  DRIVER: {
    label: "Driver",
    tabs: ["index", "delivery", "profile"],
    homeKPIs: ["pendingDeliveries", "stopsToday", "fuelLevel", "vehicleHealth"],
    quickActions: ["startRoute", "scanPackage", "reportIssue", "viewRoute"],
    features: ["delivery", "scanning"],
  },
};



// ── Add-on gate map ────────────────────────────────────────────────────────
// Maps each optional tab to the add-on key that must be enabled for it to appear.
// Exported so _layout.tsx can gate tabs against the runtime add-ons store.
export const TAB_ADD_ON_MAP: Partial<Record<TabName, keyof typeof ADD_ONS>> = {
  marshalling: "MARSHALLING_YARD",
  yard: "MARSHALLING_YARD",
  dock: "MARSHALLING_YARD",
  delivery: "DELIVERY",
};

/** Returns the tab config for a given role (falls back to PICKER for unknown roles). */
export function getRoleConfig(role?: string | null): RoleConfig {
  if (role && role in ROLE_CONFIG) {
    return ROLE_CONFIG[role as AppRole];
  }
  return ROLE_CONFIG.PICKER;
}

/** Returns the ordered visible tab names for a role. Always includes "index" first and "profile" last. */
export function getTabsForRole(role?: string | null): TabName[] {
  return getRoleConfig(role).tabs;
}

/** Returns true if a role has access to a given feature key. */
export function canAccess(role: string | null | undefined, feature: string): boolean {
  const config = getRoleConfig(role);
  return config.features.some(
    (f) => f === feature || f === feature.split(".")[0]
  );
}

/**
 * True if the given tab should be visible for this role.
 * Add-on gating is handled separately in _layout.tsx via the runtime addons store.
 */
export function isTabVisible(role: string | null | undefined, tab: TabName): boolean {
  return getTabsForRole(role).includes(tab);
}

export default ROLE_CONFIG;
