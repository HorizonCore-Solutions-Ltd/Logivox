"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Save, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

type Thresholds = {
  damage: number;
  adjustment: number;
  transfer: number;
};

type WarehouseOverride = {
  damage?: number;
  adjustment?: number;
  transfer?: number;
};

type SettingsState = {
  enabled: boolean;
  thresholds: Thresholds;
  warehouseOverrides: Record<string, WarehouseOverride>;
};

type Warehouse = {
  id: string;
  name: string;
  code?: string;
};

const DEFAULTS: SettingsState = {
  enabled: true,
  thresholds: {
    damage: 10,
    adjustment: 25,
    transfer: 50,
  },
  warehouseOverrides: {},
};

export default function CapaInventorySettingsPage() {
  const { canManageSettings } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, warehousesRes] = await Promise.all([
          fetch("/api/organization/capa-inventory-settings"),
          fetch("/api/warehouses"),
        ]);

        if (!settingsRes.ok) throw new Error("Failed to load settings");
        if (!warehousesRes.ok) throw new Error("Failed to load warehouses");

        const settingsData = await settingsRes.json();
        const warehousesData = await warehousesRes.json();

        setSettings({
          ...DEFAULTS,
          ...(settingsData.settings || {}),
          thresholds: {
            ...DEFAULTS.thresholds,
            ...(settingsData.settings?.thresholds || {}),
          },
          warehouseOverrides: settingsData.settings?.warehouseOverrides || {},
        });
        setWarehouses(
          (warehousesData || []).map((w: any) => ({
            id: w.id,
            name: w.name,
            code: w.code,
          })),
        );
      } catch (error: any) {
        toast({
          title: "Failed to load CAPA settings",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled: settings.enabled,
        thresholds: settings.thresholds,
        warehouseOverrides: settings.warehouseOverrides,
      };

      const res = await fetch("/api/organization/capa-inventory-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSettings((prev) => ({
        ...prev,
        ...(data.settings || {}),
        thresholds: {
          ...prev.thresholds,
          ...(data.settings?.thresholds || {}),
        },
      }));

      toast({
        title: "Saved",
        description: "CAPA auto-trigger settings updated.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateThreshold = (key: keyof Thresholds, value: string) => {
    const parsed = Number(value);
    setSettings((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]:
          Number.isFinite(parsed) && parsed > 0 ? parsed : prev.thresholds[key],
      },
    }));
  };

  const updateWarehouseOverride = (
    warehouseId: string,
    key: keyof Thresholds,
    value: string,
  ) => {
    const parsed = Number(value);
    setSettings((prev) => {
      const current = prev.warehouseOverrides[warehouseId] || {};
      const next: WarehouseOverride = {
        ...current,
      };

      if (value.trim() === "") {
        delete next[key];
      } else if (Number.isFinite(parsed) && parsed > 0) {
        next[key] = parsed;
      }

      const updatedOverrides = {
        ...prev.warehouseOverrides,
        [warehouseId]: next,
      };

      if (
        updatedOverrides[warehouseId] &&
        Object.keys(updatedOverrides[warehouseId]).length === 0
      ) {
        delete updatedOverrides[warehouseId];
      }

      return {
        ...prev,
        warehouseOverrides: updatedOverrides,
      };
    });
  };

  const effectiveCount = useMemo(
    () => Object.keys(settings.warehouseOverrides || {}).length,
    [settings.warehouseOverrides],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading CAPA integration settings...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            CAPA-Inventory Integration Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure when high-risk stock adjustments should auto-create CAPAs.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !canManageSettings}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {!canManageSettings && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              You have read-only access. Contact an organization admin to change
              CAPA threshold settings.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-CAPA Behavior</CardTitle>
          <CardDescription>
            Enable or disable automatic CAPA creation from inventory risk
            events.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Auto CAPA Creation</p>
            <p className="text-sm text-muted-foreground">
              When enabled, configured thresholds can trigger CAPAs
              automatically.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) =>
              setSettings((prev) => ({ ...prev, enabled: v }))
            }
            disabled={!canManageSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Organization Default Thresholds
          </CardTitle>
          <CardDescription>
            Defaults used across all warehouses unless a warehouse override is
            defined.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Damage Threshold</Label>
            <Input
              type="number"
              min="1"
              value={settings.thresholds.damage}
              onChange={(e) => updateThreshold("damage", e.target.value)}
              disabled={!canManageSettings}
            />
            <p className="text-xs text-muted-foreground">
              Trigger on DAMAGE adjustments at or above this quantity.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Adjustment Threshold</Label>
            <Input
              type="number"
              min="1"
              value={settings.thresholds.adjustment}
              onChange={(e) => updateThreshold("adjustment", e.target.value)}
              disabled={!canManageSettings}
            />
            <p className="text-xs text-muted-foreground">
              Trigger on ADJUSTMENT movements at or above this quantity.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Transfer Threshold</Label>
            <Input
              type="number"
              min="1"
              value={settings.thresholds.transfer}
              onChange={(e) => updateThreshold("transfer", e.target.value)}
              disabled={!canManageSettings}
            />
            <p className="text-xs text-muted-foreground">
              Trigger on TRANSFER reductions at or above this quantity.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warehouse Overrides</CardTitle>
          <CardDescription>
            Optional site-level overrides. Leave fields blank to inherit
            organization defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            {effectiveCount} warehouse override{effectiveCount === 1 ? "" : "s"}{" "}
            configured
          </div>

          <Separator />

          {warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No warehouses found for this organization.
            </p>
          ) : (
            <div className="space-y-3">
              {warehouses.map((warehouse) => {
                const override =
                  settings.warehouseOverrides[warehouse.id] || {};
                return (
                  <div
                    key={warehouse.id}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-3 border rounded-md p-3"
                  >
                    <div className="lg:col-span-2">
                      <p className="font-medium">{warehouse.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {warehouse.code || warehouse.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Damage</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={String(settings.thresholds.damage)}
                        value={override.damage ?? ""}
                        onChange={(e) =>
                          updateWarehouseOverride(
                            warehouse.id,
                            "damage",
                            e.target.value,
                          )
                        }
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Adjustment</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={String(settings.thresholds.adjustment)}
                        value={override.adjustment ?? ""}
                        onChange={(e) =>
                          updateWarehouseOverride(
                            warehouse.id,
                            "adjustment",
                            e.target.value,
                          )
                        }
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Transfer</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder={String(settings.thresholds.transfer)}
                        value={override.transfer ?? ""}
                        onChange={(e) =>
                          updateWarehouseOverride(
                            warehouse.id,
                            "transfer",
                            e.target.value,
                          )
                        }
                        disabled={!canManageSettings}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
