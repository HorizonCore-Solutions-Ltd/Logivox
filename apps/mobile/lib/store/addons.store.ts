/**
 * Add-ons Store
 *
 * Runtime source of truth for which add-on modules are active.
 * Bootstraps from the static addons.ts config, then hydrates from the
 * backend tenant API after login so values reflect the current tenant's
 * actual licence.
 *
 * Usage:
 *   const enabled = useAddOnsStore(s => s.isEnabled("DELIVERY"));
 */
import { create } from "zustand";
import { ADD_ONS, type AddOnKey } from "../config/addons";
import { getTenantConfig } from "../api/tenant";

interface AddOnsState {
  /** Set of currently enabled add-on keys */
  enabled: Set<AddOnKey>;
  /** Whether the store has been hydrated from the API */
  hydrated: boolean;
  /** Any error encountered during hydration */
  error: string | null;

  /** Check if a specific add-on is currently enabled */
  isEnabled: (key: AddOnKey) => boolean;
  /** Fetch tenant config from API and update enabled set */
  load: () => Promise<void>;
  /** Reset to the static defaults (e.g. on logout) */
  reset: () => void;
}

/** Build initial enabled set from the static addons.ts config */
function staticEnabledSet(): Set<AddOnKey> {
  const keys = Object.entries(ADD_ONS)
    .filter(([, meta]) => meta.enabled)
    .map(([key]) => key as AddOnKey);
  return new Set(keys);
}

export const useAddOnsStore = create<AddOnsState>((set, get) => ({
  enabled: staticEnabledSet(),
  hydrated: false,
  error: null,

  isEnabled: (key: AddOnKey) => get().enabled.has(key),

  load: async () => {
    try {
      const config = await getTenantConfig();
      set({
        enabled: new Set(config.addOns.enabledAddOns),
        hydrated: true,
        error: null,
      });
    } catch (err) {
      // Fallback silently to the static config — don't block app startup
      console.warn(
        "[AddOns] Failed to load tenant config, using defaults:",
        err,
      );
      set({ hydrated: true, error: (err as Error).message });
    }
  },

  reset: () =>
    set({ enabled: staticEnabledSet(), hydrated: false, error: null }),
}));
