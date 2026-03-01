"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  RefreshCw, Plus, Play, Package, AlertTriangle, CheckCircle,
  ArrowDown, Clock, Settings, Zap, TrendingDown,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface ReplenRule {
  id: string;
  name: string;
  strategy: string;
  minQty: number;
  maxQty: number;
  reorderPoint: number;
  reorderQty: number;
  leadTimeDays: number;
  autoCreatePO: boolean;
  isActive: boolean;
  _count: { tasks: number };
  inventoryItem?: { name: string; sku: string; currentStock: number };
  warehouse?: { name: string; code: string };
  supplier?: { name: string };
}

interface ReplenTask {
  id: string;
  status: string;
  priority: string;
  requiredQty: number;
  orderedQty: number | null;
  createdAt: string;
  completedAt: string | null;
  inventoryItem?: { name: string; sku: string; currentStock: number };
  warehouse?: { name: string; code: string };
  purchaseOrder?: { poNumber: string };
}

const STRATEGY_LABELS: Record<string, string> = {
  MIN_MAX: "Min/Max",
  REORDER_POINT: "Reorder Point",
  DEMAND_BASED: "Demand Based",
  PERIODIC_REVIEW: "Periodic Review",
};

const TASK_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  PO_CREATED: { label: "PO Created", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-gray-100 text-gray-600",
};

export default function ReplenishmentPage() {
  const [rules, setRules] = useState<ReplenRule[]>([]);
  const [tasks, setTasks] = useState<ReplenTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ pending: 0, critical: 0, lowStock: 0, autoRules: 0 });

  const [form, setForm] = useState({
    name: "", strategy: "MIN_MAX", minQty: 10, maxQty: 100,
    reorderPoint: 20, reorderQty: 50, leadTimeDays: 3, autoCreatePO: false, isActive: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, tasksRes] = await Promise.all([
        fetch("/api/replenishment/rules"),
        fetch("/api/replenishment/run"), // GET returns pending tasks
      ]);
      const rulesData = await rulesRes.json();
      const tasksData = await tasksRes.json();

      const ruleList: ReplenRule[] = rulesData.rules || [];
      const taskList: ReplenTask[] = tasksData.tasks || [];

      setRules(ruleList);
      setTasks(taskList);
      setStats({
        pending: taskList.filter((t) => t.status === "PENDING").length,
        critical: taskList.filter((t) => t.priority === "CRITICAL").length,
        lowStock: ruleList.filter((r) => r.inventoryItem && r.inventoryItem.currentStock <= r.reorderPoint).length,
        autoRules: ruleList.filter((r) => r.autoCreatePO && r.isActive).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runReplenishment = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/replenishment/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Replenishment Run Complete",
        description: `${data.summary?.tasksCreated ?? 0} tasks created, ${data.summary?.poCreated ?? 0} POs auto-generated.`,
      });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Run failed", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const createRule = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/replenishment/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Rule created", description: `"${form.name}" is now active.` });
      setShowCreate(false);
      setForm({ name: "", strategy: "MIN_MAX", minQty: 10, maxQty: 100, reorderPoint: 20, reorderQty: 50, leadTimeDays: 3, autoCreatePO: false, isActive: true });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = async (rule: ReplenRule) => {
    await fetch(`/api/replenishment/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    fetchAll();
  };

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Replenishment</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automated stock replenishment rules, demand-based triggers, and PO generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
            <Button variant="outline" onClick={runReplenishment} disabled={running}>
              <Play className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
              {running ? "Running..." : "Run Now"}
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Rule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Replenishment Rule</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="col-span-2 space-y-1">
                    <Label>Rule Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Warehouse A Min/Max" />
                  </div>
                  <div className="space-y-1">
                    <Label>Strategy</Label>
                    <Select value={form.strategy} onValueChange={(v) => setForm((f) => ({ ...f, strategy: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STRATEGY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Lead Time (days)</Label>
                    <Input type="number" min={0} value={form.leadTimeDays} onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Min Qty</Label>
                    <Input type="number" min={0} value={form.minQty} onChange={(e) => setForm((f) => ({ ...f, minQty: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Qty</Label>
                    <Input type="number" min={0} value={form.maxQty} onChange={(e) => setForm((f) => ({ ...f, maxQty: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Reorder Point</Label>
                    <Input type="number" min={0} value={form.reorderPoint} onChange={(e) => setForm((f) => ({ ...f, reorderPoint: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Reorder Qty</Label>
                    <Input type="number" min={1} value={form.reorderQty} onChange={(e) => setForm((f) => ({ ...f, reorderQty: Number(e.target.value) }))} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Auto-create Purchase Orders</p>
                      <p className="text-xs text-muted-foreground">Automatically generate POs when trigger fires</p>
                    </div>
                    <Switch checked={form.autoCreatePO} onCheckedChange={(v) => setForm((f) => ({ ...f, autoCreatePO: v }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={createRule} disabled={creating || !form.name}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Tasks", value: stats.pending, icon: <Clock className="h-4 w-4 text-amber-500" />, color: "text-amber-600" },
            { label: "Critical", value: stats.critical, icon: <AlertTriangle className="h-4 w-4 text-red-500" />, color: "text-red-600" },
            { label: "Low Stock SKUs", value: stats.lowStock, icon: <TrendingDown className="h-4 w-4 text-orange-500" />, color: "text-orange-600" },
            { label: "Auto-PO Rules", value: stats.autoRules, icon: <Zap className="h-4 w-4 text-green-500" />, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.icon}
                </div>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules"><Settings className="h-3 w-3 mr-1" />Rules ({rules.length})</TabsTrigger>
            <TabsTrigger value="tasks"><Package className="h-3 w-3 mr-1" />Tasks ({tasks.length})</TabsTrigger>
          </TabsList>

          {/* Rules tab */}
          <TabsContent value="rules">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading rules...
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-30" />
                    <p>No replenishment rules yet</p>
                    <Button variant="link" onClick={() => setShowCreate(true)}>Create first rule</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Strategy</TableHead>
                        <TableHead>Item / SKU</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Reorder Point</TableHead>
                        <TableHead>Reorder Qty</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Pending Tasks</TableHead>
                        <TableHead>Auto PO</TableHead>
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{STRATEGY_LABELS[rule.strategy] || rule.strategy}</Badge>
                          </TableCell>
                          <TableCell>
                            {rule.inventoryItem ? (
                              <div>
                                <p className="text-sm">{rule.inventoryItem.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{rule.inventoryItem.sku}</p>
                              </div>
                            ) : <span className="text-muted-foreground text-xs">All items</span>}
                          </TableCell>
                          <TableCell className="text-sm">{rule.warehouse?.name ?? "All"}</TableCell>
                          <TableCell>
                            <span className={`font-mono text-sm ${rule.inventoryItem && rule.inventoryItem.currentStock <= rule.reorderPoint ? "text-red-600 font-bold" : ""}`}>
                              {rule.reorderPoint}
                              {rule.inventoryItem && rule.inventoryItem.currentStock <= rule.reorderPoint && (
                                <TrendingDown className="h-3 w-3 inline ml-1 text-red-500" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{rule.reorderQty}</TableCell>
                          <TableCell className="text-sm">{rule.leadTimeDays}d</TableCell>
                          <TableCell>
                            {rule._count.tasks > 0 ? (
                              <Badge className="bg-amber-100 text-amber-800">{rule._count.tasks}</Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell>
                            {rule.autoCreatePO ? (
                              <Badge className="bg-green-100 text-green-800"><Zap className="h-3 w-3 mr-1" />Auto</Badge>
                            ) : <span className="text-muted-foreground text-xs">Manual</span>}
                          </TableCell>
                          <TableCell>
                            <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks tab */}
          <TabsContent value="tasks">
            <Card>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 opacity-30" />
                    <p>No open replenishment tasks</p>
                    <p className="text-xs mt-1">Click "Run Now" to scan stock levels</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Required Qty</TableHead>
                        <TableHead>Ordered Qty</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PO #</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => {
                        const sc = TASK_STATUS[task.status] || { label: task.status, color: "bg-gray-100 text-gray-600" };
                        const pc = PRIORITY_COLOR[task.priority] || "bg-gray-100 text-gray-600";
                        return (
                          <TableRow key={task.id} className="hover:bg-muted/50">
                            <TableCell>
                              {task.inventoryItem ? (
                                <div>
                                  <p className="text-sm font-medium">{task.inventoryItem.name}</p>
                                  <p className="text-xs font-mono text-muted-foreground">{task.inventoryItem.sku}</p>
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-sm">{task.warehouse?.name ?? "—"}</TableCell>
                            <TableCell className="font-mono text-sm">
                              <span className={task.inventoryItem && task.inventoryItem.currentStock < 10 ? "text-red-600 font-bold" : ""}>
                                {task.inventoryItem?.currentStock ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{task.requiredQty}</TableCell>
                            <TableCell className="font-mono text-sm">{task.orderedQty ?? "—"}</TableCell>
                            <TableCell><Badge className={`text-xs ${pc}`}>{task.priority}</Badge></TableCell>
                            <TableCell><Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge></TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {task.purchaseOrder?.poNumber ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardSidebar>
  );
}
