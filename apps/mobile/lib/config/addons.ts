/**
 * Add-on Module Configuration
 *
 * Add-on modules are optional extensions to the core Flowstock WMS platform.
 * They are licensed separately and can be toggled here (or loaded from a
 * backend tenant config API in production).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  STANDARD PACKAGE (always on):
 *    - Inventory, Orders, Receiving, Returns, Picking
 *    - Quality, CAPA, Compliance
 *    - Shipping, Suppliers, Analytics
 *    - Invoices, Cycle Counts
 *
 *  ADD-ON MODULES:
 *    - Marshalling & Yard System
 *    - Delivery (Last Mile)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AddOnKey = "MARSHALLING_YARD" | "DELIVERY";

export interface AddOnMeta {
  /** Human-readable name */
  name: string;
  /** Short description shown in settings/admin */
  description: string;
  /** Whether the add-on is currently enabled for this tenant (set to false to disable) */
  enabled: boolean;
}

// ── Master Add-on Toggle Map ──────────────────────────────────────────────────
// To disable an add-on for a tenant, set `enabled: false` here (or load this
// dynamically from the tenant settings API).
export const ADD_ONS: Record<AddOnKey, AddOnMeta> = {
  MARSHALLING_YARD: {
    name: "Marshalling & Yard Management",
    description:
      "Manages yard slots, dock doors, vehicle scheduling, and load marshalling. " +
      "Includes Yard, Dock, and Marshalling screens.",
    enabled: true,
  },
  DELIVERY: {
    name: "Last Mile Delivery",
    description:
      "Driver dispatch, route management, proof-of-delivery, and live stop tracking.",
    enabled: true,
  },
};

/** Helper to check if a specific add-on is enabled */
export function isAddOnEnabled(key: AddOnKey): boolean {
  return ADD_ONS[key]?.enabled ?? false;
}
