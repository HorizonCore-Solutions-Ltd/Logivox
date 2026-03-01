"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  TrendingUp,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: "THRESHOLD" | "SCHEDULE" | "DEMAND_SPIKE";
  pendingOrderThreshold: number | null;
  pendingLineThreshold: number | null;
  cronExpression: string | null;
  defaultWaveType: string;
  defaultPriority: string;
  defaultStrategy: string;
  defaultMaxOrders: number | null;
  defaultMaxLines: number | null;
  shipWindowHours: number | null;
  carrierFilter: string[];
  cooldownMinutes: number;
  lastFiredAt: string | null;
  fireCount: number;
  successCount: number;
  failureCount: number;
  status: "IDLE" | "EVALUATING" | "FIRING" | "ERROR" | "PAUSED";
  lastError: string | null;
  warehouse: Warehouse;
  createdAt: string;
  _count: { executions: number };
}

interface TriggerResult {
  executed: boolean;
  waveNumber?: string;
  ordersIncluded?: number;
  linesIncluded?: number;
  triggerReason?: string;
  reason?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  THRESHOLD: "Order Threshold",
  SCHEDULE: "Cron Schedule",
  DEMAND_SPIKE: "Demand Spike",
};

const STATUS_COLORS: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-700",
  EVALUATING: "bg-blue-100 text-blue-700",
  FIRING: "bg-yellow-100 text-yellow-700",
  ERROR: "bg-red-100 text-red-700",
  PAUSED: "bg-orange-100 text-orange-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-yellow-100 text-yellow-700",
  URGENT: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

// ── Blank form state ───────────────────────────────────────────────────────────

const blankForm = {
  warehouseId: "",
  name: "",
  description: "",
  triggerType: "THRESHOLD" as "THRESHOLD" | "SCHEDULE" | "DEMAND_SPIKE",
  pendingOrderThreshold: "",
  pendingLineThreshold: "",
  cronExpression: "",
  defaultWaveType: "BATCH",
  defaultPriority: "NORMAL",
  defaultStrategy: "FIFO",
  defaultMaxOrders: "",
  defaultMaxLines: "",
  shipWindowHours: "",
  cooldownMinutes: "30",
  isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WaveAutomationPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);

  // Summary stats
  const totalRules = rules.length;
  const activeRules = rules.filter((r) => r.isActive).length;
  const totalFired = rules.reduce((s, r) => s + r.fireCount, 0);
  const errorRules = rules.filter((r) => r.status === "ERROR").length;

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/waves/automation-rules");
      if (!res.ok) throw new Error(await res.text());
      const { rules: data } = await res.json();
      setRules(data ?? []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch("/api/warehouses");
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.warehouses ?? []);
      setWarehouses(list);
    } catch {
      // Non-fatal — user can still type warehouse ID
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchWarehouses();
  }, [fetchRules, fetchWarehouses]);

  // ── Create rule ─────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.warehouseId || !form.name || !form.triggerType) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        warehouseId: form.warehouseId,
        name: form.name,
        description: form.description || undefined,
        triggerType: form.triggerType,
        defaultWaveType: form.defaultWaveType,
        defaultPriority: form.defaultPriority,
        defaultStrategy: form.defaultStrategy,
        cooldownMinutes: parseInt(form.cooldownMinutes) || 30,
        isActive: form.isActive,
      };

      if (form.triggerType === "THRESHOLD") {
        if (form.pendingOrderThreshold)
          payload.pendingOrderThreshold = parseInt(form.pendingOrderThreshold);
        if (form.pendingLineThreshold)
          payload.pendingLineThreshold = parseInt(form.pendingLineThreshold);
      }
      if (form.triggerType === "SCHEDULE") {
        payload.cronExpression = form.cronExpression;
      }
      if (form.defaultMaxOrders)
        payload.defaultMaxOrders = parseInt(form.defaultMaxOrders);
      if (form.defaultMaxLines)
        payload.defaultMaxLines = parseInt(form.defaultMaxLines);
      if (form.shipWindowHours)
        payload.shipWindowHours = parseInt(form.shipWindowHours);

      const res = await fetch("/api/waves/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Unknown error");
      }

      toast({ title: "Automation rule created" });
      setDialogOpen(false);
      setForm(blankForm);
      await fetchRules();
    } catch (err) {
      toast({
        title: "Failed to create rule",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────

  const handleToggleActive = async (rule: AutomationRule) => {
    const orig = rule.isActive;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: !orig } : r)),
    );
    try {
      const res = await fetch(`/api/waves/automation-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !orig }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Rule ${!orig ? "activated" : "paused"}` });
    } catch {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: orig } : r)),
      );
      toast({ title: "Failed to update rule", variant: "destructive" });
    }
  };

  // ── Manual trigger ──────────────────────────────────────────────────────────

  const handleTrigger = async (rule: AutomationRule) => {
    setTriggeringId(rule.id);
    try {
      const res = await fetch(
        `/api/waves/automation-rules/${rule.id}/trigger`,
        { method: "POST" },
      );
      const data: TriggerResult = await res.json();

      if (res.status === 429) {
        toast({
          title: "Cooldown active",
          description: `Try again in ${(data as { remainingMinutes?: number }).remainingMinutes ?? "?"} minute(s)`,
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: "Trigger failed",
          description: (data as { error?: string }).error ?? "Unknown error",
          variant: "destructive",
        });
        return;
      }

      if (data.executed) {
        toast({
          title: `Wave ${data.waveNumber} created`,
          description: `${data.ordersIncluded} orders · ${data.linesIncluded} lines`,
        });
      } else {
        toast({
          title: "No wave created",
          description: data.reason ?? data.triggerReason,
        });
      }

      await fetchRules();
    } catch {
      toast({ title: "Trigger request failed", variant: "destructive" });
    } finally {
      setTriggeringId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/waves/automation-rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({ title: "Rule deleted" });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString();
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Wave Automation Rules
          </h1>
          <p className="text-muted-foreground mt-1">
            Auto-generate pick waves based on order thresholds, schedules, or
            demand spikes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRules} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Configure when waves should be automatically generated
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Warehouse */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="r-warehouse">Warehouse *</Label>
                    {warehouses.length > 0 ? (
                      <Select
                        value={form.warehouseId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, warehouseId: v }))
                        }
                      >
                        <SelectTrigger id="r-warehouse" className="mt-1">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} ({w.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="r-warehouse"
                        className="mt-1"
                        placeholder="Warehouse ID"
                        value={form.warehouseId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            warehouseId: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Name + description */}
                <div>
                  <Label htmlFor="r-name">Rule Name *</Label>
                  <Input
                    id="r-name"
                    className="mt-1"
                    placeholder="e.g. Morning Peak Wave"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="r-desc">Description</Label>
                  <Textarea
                    id="r-desc"
                    className="mt-1"
                    rows={2}
                    placeholder="Optional description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>

                {/* Trigger type */}
                <div>
                  <Label htmlFor="r-trigger">Trigger Type *</Label>
                  <Select
                    value={form.triggerType}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        triggerType: v as typeof form.triggerType,
                      }))
                    }
                  >
                    <SelectTrigger id="r-trigger" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THRESHOLD">
                        Order Threshold — fire when orders pile up
                      </SelectItem>
                      <SelectItem value="SCHEDULE">
                        Cron Schedule — fire at fixed times
                      </SelectItem>
                      <SelectItem value="DEMAND_SPIKE">
                        Demand Spike — fire on 2× hourly average
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Threshold-specific */}
                {form.triggerType === "THRESHOLD" && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                    <div>
                      <Label htmlFor="r-ord-thresh">Min Pending Orders</Label>
                      <Input
                        id="r-ord-thresh"
                        type="number"
                        className="mt-1"
                        placeholder="e.g. 50"
                        value={form.pendingOrderThreshold}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pendingOrderThreshold: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="r-line-thresh">Min Pending Lines</Label>
                      <Input
                        id="r-line-thresh"
                        type="number"
                        className="mt-1"
                        placeholder="e.g. 200"
                        value={form.pendingLineThreshold}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pendingLineThreshold: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <p className="col-span-2 text-xs text-muted-foreground">
                      Wave fires when EITHER threshold is exceeded.
                    </p>
                  </div>
                )}

                {/* Schedule-specific */}
                {form.triggerType === "SCHEDULE" && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <Label htmlFor="r-cron">Cron Expression *</Label>
                    <Input
                      id="r-cron"
                      className="mt-1 font-mono"
                      placeholder="0 8,12,16 * * 1-5"
                      value={form.cronExpression}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          cronExpression: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Standard 5-field cron. Example: 0 8 * * 1-5 = 8am Mon–Fri
                    </p>
                  </div>
                )}

                {/* Default wave settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="r-wtype">Wave Type</Label>
                    <Select
                      value={form.defaultWaveType}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, defaultWaveType: v }))
                      }
                    >
                      <SelectTrigger id="r-wtype" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "BATCH",
                          "SINGLE_ORDER",
                          "ZONE",
                          "CARRIER",
                          "PRIORITY",
                          "CUSTOM",
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="r-priority">Priority</Label>
                    <Select
                      value={form.defaultPriority}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, defaultPriority: v }))
                      }
                    >
                      <SelectTrigger id="r-priority" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"].map(
                          (p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="r-strategy">Strategy</Label>
                    <Select
                      value={form.defaultStrategy}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, defaultStrategy: v }))
                      }
                    >
                      <SelectTrigger id="r-strategy" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "FIFO",
                          "LIFO",
                          "ZONE_BASED",
                          "CARRIER_BASED",
                          "SHIP_DATE",
                          "PRIORITY",
                          "SHORTEST_PATH",
                          "CUSTOM",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="r-maxord">Max Orders / Wave</Label>
                    <Input
                      id="r-maxord"
                      type="number"
                      className="mt-1"
                      placeholder="100"
                      value={form.defaultMaxOrders}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          defaultMaxOrders: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="r-maxlines">Max Lines / Wave</Label>
                    <Input
                      id="r-maxlines"
                      type="number"
                      className="mt-1"
                      placeholder="500"
                      value={form.defaultMaxLines}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          defaultMaxLines: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="r-window">Ship Window (hrs)</Label>
                    <Input
                      id="r-window"
                      type="number"
                      className="mt-1"
                      placeholder="24"
                      value={form.shipWindowHours}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shipWindowHours: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Cooldown */}
                <div>
                  <Label htmlFor="r-cooldown">Cooldown (minutes)</Label>
                  <Input
                    id="r-cooldown"
                    type="number"
                    className="mt-1 w-40"
                    value={form.cooldownMinutes}
                    min={0}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cooldownMinutes: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum gap between any two firings of this rule.
                  </p>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="r-active"
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                  <Label htmlFor="r-active">Active immediately</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating…" : "Create Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Layers className="w-4 h-4" /> Total Rules
            </div>
            <p className="text-2xl font-bold mt-1">{totalRules}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Active
            </div>
            <p className="text-2xl font-bold mt-1">{activeRules}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BarChart2 className="w-4 h-4 text-blue-500" /> Total Fired
            </div>
            <p className="text-2xl font-bold mt-1">{totalFired}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="w-4 h-4 text-red-500" /> Errors
            </div>
            <p className="text-2xl font-bold mt-1">{errorRules}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium">No automation rules yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create a rule to automatically generate pick waves when pending
              orders exceed a threshold, on a schedule, or during demand spikes.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`transition-opacity ${rule.isActive ? "" : "opacity-60"}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base truncate">
                        {rule.name}
                      </CardTitle>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[rule.status] ?? ""}`}
                        variant="outline"
                      >
                        {rule.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {TRIGGER_LABELS[rule.triggerType]}
                      </Badge>
                      <Badge
                        className={`text-xs ${PRIORITY_COLORS[rule.defaultPriority] ?? ""}`}
                        variant="outline"
                      >
                        {rule.defaultPriority}
                      </Badge>
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-1 text-xs">
                        {rule.description}
                      </CardDescription>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Active toggle */}
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleActive(rule)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">
                        {rule.isActive ? "On" : "Off"}
                      </span>
                    </div>

                    {/* Manual trigger */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrigger(rule)}
                      disabled={triggeringId === rule.id || !rule.isActive}
                    >
                      {triggeringId === rule.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span className="ml-1.5">Run Now</span>
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete rule?</AlertDialogTitle>
                          <AlertDialogDescription>
                            &ldquo;{rule.name}&rdquo; will be permanently
                            deleted. Execution history will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(rule.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Expand */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpandedId(expandedId === rule.id ? null : rule.id)
                      }
                    >
                      {expandedId === rule.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Stats row */}
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3 mt-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {rule.fireCount} fired · {rule.successCount} succeeded ·{" "}
                    {rule.failureCount} failed
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last: {formatDate(rule.lastFiredAt)}
                  </span>
                  <span>
                    Warehouse: {rule.warehouse.name} ({rule.warehouse.code})
                  </span>
                  <span>
                    Wave: {rule.defaultWaveType} · Max{" "}
                    {rule.defaultMaxOrders ?? "∞"} orders
                  </span>
                  {rule.triggerType === "THRESHOLD" && (
                    <span>
                      Threshold: {rule.pendingOrderThreshold ?? "—"} orders /{" "}
                      {rule.pendingLineThreshold ?? "—"} lines
                    </span>
                  )}
                  {rule.triggerType === "SCHEDULE" && (
                    <span className="font-mono">
                      Cron: {rule.cronExpression}
                    </span>
                  )}
                  <span>Cooldown: {rule.cooldownMinutes}m</span>
                  <span>{rule._count.executions} executions total</span>
                </div>

                {/* Last error */}
                {rule.status === "ERROR" && rule.lastError && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {rule.lastError}
                  </div>
                )}

                {/* Expanded execution history */}
                {expandedId === rule.id && (
                  <ExecutionHistory ruleId={rule.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Execution History sub-component ──────────────────────────────────────────

interface Execution {
  id: string;
  status: string;
  triggeredBy: string;
  waveNumber: string | null;
  ordersIncluded: number;
  linesIncluded: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

function ExecutionHistory({ ruleId }: { ruleId: string }) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/waves/automation-rules/${ruleId}`);
        if (!res.ok) return;
        const data = await res.json();
        setExecutions(data.executions ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [ruleId]);

  if (loading) {
    return (
      <div className="mt-3 text-xs text-muted-foreground animate-pulse">
        Loading execution history…
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="mt-3 text-xs text-muted-foreground">
        No executions yet.
      </div>
    );
  }

  const STATUS_DOT: Record<string, string> = {
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
    PENDING: "bg-yellow-400",
    IN_PROGRESS: "bg-blue-400",
  };

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Recent Executions (last {executions.length})
      </p>
      <div className="space-y-1.5">
        {executions.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 text-xs py-1 border-b border-dashed last:border-0"
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[ex.status] ?? "bg-gray-400"}`}
            />
            <span className="text-muted-foreground w-32 flex-shrink-0">
              {ex.createdAt ? new Date(ex.createdAt).toLocaleString() : "—"}
            </span>
            <span className="font-medium">{ex.status}</span>
            {ex.waveNumber && (
              <span className="text-blue-600 font-mono">{ex.waveNumber}</span>
            )}
            {ex.ordersIncluded > 0 && (
              <span className="text-muted-foreground">
                {ex.ordersIncluded} orders · {ex.linesIncluded} lines
              </span>
            )}
            {ex.durationMs != null && (
              <span className="text-muted-foreground ml-auto flex-shrink-0">
                {ex.durationMs}ms
              </span>
            )}
            {ex.error && (
              <span className="text-red-600 truncate max-w-xs">{ex.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
