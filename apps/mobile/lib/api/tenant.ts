/**
 * Tenant API
 *
 * Fetches per-tenant configuration from the backend, including which
 * add-on modules are licensed/enabled for the current organisation.
 */
import { apiClient } from "./client";
import type { AddOnKey } from "../config/addons";

export interface TenantAddOns {
  /** List of add-on keys that are active for this tenant */
  enabledAddOns: AddOnKey[];
  /** Optional per-tenant display overrides (e.g. custom names) */
  labels?: Partial<Record<AddOnKey, string>>;
}

export interface TenantConfig {
  id: string;
  name: string;
  addOns: TenantAddOns;
}

/** Fetch the current tenant's configuration (add-ons, branding, etc.) */
export async function getTenantConfig(): Promise<TenantConfig> {
  const { data } = await apiClient.get<TenantConfig>("/api/tenant/config");
  return data;
}
