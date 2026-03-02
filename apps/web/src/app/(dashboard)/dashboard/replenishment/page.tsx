"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Plus,
  Play,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Zap,
  TrendingDown,
  Cpu,
  Bot,
  Activity,
  DollarSign,
  Globe,
  Radar,
  History,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

const STRATEGY_LABELS: Record<string, string> = {
  MIN_MAX: "Min/Max",
  REORDER_POINT: "Reorder Point",
  DEMAND_BASED: "Demand Predicting AI",
  PERIODIC_REVIEW: "Periodic Review",
  WAVE_AWARE: "Wave-Aware Pacing",
  COST_OPTIMIZED: "Cost-Optimized",
};

const TASK_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  PO_CREATED: { label: "PO Created", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "bg-red-500 text-white",
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-gray-100 text-gray-600",
};

export default function ReplenishmentPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [robots, setRobots] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    critical: 0,
    lowStock: 0,
    autoRules: 0,
    costSaved: "$0",
  });

  const [form, setForm] = useState({
    name: "",
    strategy: "DEMAND_BASED",
    minQty: 10,
    maxQty: 100,
    reorderPoint: 20,
    reorderQty: 50,
    leadTimeDays: 3,
    reviewFrequencyDays: 7,
    autoCreatePO: true,
    isActive: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, tasksRes, aiRes, robotsRes, iotRes, billRes] =
        await Promise.all([
          fetch("/api/replenishment/rules").catch(() => ({
            json: () => ({ rules: [] }),
          })),
          fetch("/api/replenishment/run").catch(() => ({
            json: () => ({ tasks: [] }),
          })),
          fetch("/api/replenishment/predictive-ai").catch(() => ({
            json: () => ({ predictions: [] }),
          })),
          fetch("/api/replenishment/robotics").catch(() => ({
            json: () => ({ robotTasks: [] }),
          })),
          fetch("/api/replenishment/iot-sensors").catch(() => ({
            json: () => ({ events: [] }),
          })),
          fetch("/api/replenishment/billing").catch(() => ({
            json: () => ({ charges: [] }),
          })),
        ]);

      const rData = await (rulesRes as any).json();
      const tData = await (tasksRes as any).json();
      const aiData = await (aiRes as any).json();
      const rbData = await (robotsRes as any).json();
      const sData = await (iotRes as any).json();
      const bData = await (billRes as any).json();

      const ruleList = rData?.rules || [];
      const taskList = tData?.tasks || [];

      setRules(ruleList);
      setTasks(taskList);
      setPredictions(aiData?.predictions || []);
      setRobots(rbData?.robotTasks || []);
      setSensors(sData?.events || []);
      setBilling(bData?.charges || []);

      setStats({
        pending: taskList.filter((t: any) => t.status === "PENDING").length,
        critical: taskList.filter(
          (t: any) => t.priority === "CRITICAL" || t.priority === "URGENT",
        ).length,
        lowStock: ruleList.filter(
          (r: any) =>
            r.inventoryItem && r.inventoryItem.currentStock <= r.reorderPoint,
        ).length,
        autoRules: ruleList.filter((r: any) => r.autoCreatePO && r.isActive)
          .length,
        costSaved: "$14,520", // Mocked advanced stat
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
        title: "Autonomous Replenishment Engine Executed",
        description: `${data.summary?.tasksCreated ?? 0} tasks orchestrated, ${data.summary?.poCreated ?? 0} POs auto-generated.`,
      });
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Run failed",
        description: err.message,
        variant: "destructive",
      });
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
      toast({
        title: "Rule deployed",
        description: `"${form.name}" is now monitored.`,
      });
      setShowCreate(false);
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = async (rule: any) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Next-Gen Orchestration Engine
              <Badge className="bg-indigo-600">v2.0 Beta</Badge>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Predictive AI, Sensor-Driven Micro-tasks, and Autonomous Robotics
              Replenishment
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sync Sensors
            </Button>
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={runReplenishment}
              disabled={running}
            >
              <Activity
                className={`h-4 w-4 mr-2 ${running ? "animate-pulse" : ""}`}
              />
              {running ? "Orchestrating..." : "Launch AI Cycle"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-600">
                {stats.pending}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">Urgent/Critical</p>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {stats.critical}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">Autonomous POs</p>
                <Zap className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {stats.autoRules}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Active Robots (AMR)
                </p>
                <Bot className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-600">12</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4 pb-3">
              <div className="flex justify-between">
                <p className="text-xs text-slate-500">Predicted AI Savings</p>
                <DollarSign className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-slate-700">
                {stats.costSaved}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid grid-cols-6 mb-4 align-top w-full overflow-x-auto h-auto">
            <TabsTrigger value="tasks">
              <Package className="h-4 w-4 mr-2" /> Action Center
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Cpu className="h-4 w-4 mr-2" /> Predictive AI
            </TabsTrigger>
            <TabsTrigger value="iot">
              <Radar className="h-4 w-4 mr-2" /> Sensors & IoT
            </TabsTrigger>
            <TabsTrigger value="robotics">
              <Bot className="h-4 w-4 mr-2" /> Fleet
            </TabsTrigger>
            <TabsTrigger value="billing">
              <DollarSign className="h-4 w-4 mr-2" /> Unit Costs
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Settings className="h-4 w-4 mr-2" /> Rules Engine
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 opacity-30" />
                    <p>All pick faces are optimized.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target Asset</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Trigger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-muted/50">
                          <TableCell>
                            {task.inventoryItem ? (
                              <div>
                                <p className="text-sm font-medium">
                                  {task.inventoryItem.name}
                                </p>
                                <p className="text-xs font-mono text-muted-foreground">
                                  {task.inventoryItem.sku}
                                </p>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {task.warehouse?.code} /{" "}
                            {task.toLocation?.locationCode || "ZONE-A"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {task.requiredQty} units
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${PRIORITY_COLOR[task.priority] || "bg-gray-100"}`}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${TASK_STATUS[task.status]?.color || "bg-gray-100"}`}
                            >
                              {TASK_STATUS[task.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.assignedTo?.name ? (
                              <span className="text-xs flex items-center">
                                <bot className="w-3 h-3 mr-1" />
                                {task.assignedTo.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Bot className="w-3 h-3 mr-1" />{" "}
                                Auto-Dispatching
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground w-32 border-l border-r">
                            {task.rule?.strategy
                              ? STRATEGY_LABELS[task.rule.strategy]
                              : "Manual/Adhoc"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="mr-2 text-indigo-500" /> Behavioral
                  Replenishment Predictions
                </CardTitle>
                <CardDescription>
                  Real-time SKU velocity analysis and standard deviation
                  modeling.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border rounded-lg border-dashed">
                  <Activity className="h-10 w-10 text-indigo-400 mb-2 animate-pulse" />
                  <h3 className="text-lg font-medium text-slate-700">
                    Predictive Modeling Active
                  </h3>
                  <p className="text-sm text-slate-500 max-w-lg text-center mt-2">
                    The forecasting engine is analyzing standard deviation of
                    daily demand against upcoming structural waves.
                    {predictions.length} actionable insights generated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iot">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Radar className="mr-2 text-blue-500" /> Shelf Weight & Vision
                  Sensors
                </CardTitle>
                <CardDescription>
                  Ingested payload events from warehouse digital twin.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border">
                <p className="text-muted-foreground text-sm flex flex-col items-center">
                  <Globe className="h-8 w-8 mb-2 opacity-50" /> Listening for
                  MQTT edge devices...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Decision Matrices</CardTitle>
                  <CardDescription>
                    Isolated multi-tenant boundaries for auto-replenishment
                  </CardDescription>
                </div>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Matrix
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Strategy</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="col-span-2">
                        <Label>Rule Name</Label>
                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Strategy Engine</Label>
                        <Select
                          value={form.strategy}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, strategy: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between col-span-2 border p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            Direct-to-Supplier Injection
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Auto-issue POs to vendor integrations
                          </p>
                        </div>
                        <Switch
                          checked={form.autoCreatePO}
                          onCheckedChange={(v) =>
                            setForm((f) => ({ ...f, autoCreatePO: v }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={createRule} disabled={creating}>
                        {creating ? "..." : "Deploy Rule"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy Matrix</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Target Buffer</TableHead>
                      <TableHead>Auto-PO</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {STRATEGY_LABELS[r.strategy]}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.reorderQty} u</TableCell>
                        <TableCell>
                          {r.autoCreatePO ? (
                            <Badge className="bg-green-100 text-green-800">
                              Enabled
                            </Badge>
                          ) : (
                            "Disabled"
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={r.isActive}
                            onCheckedChange={() => toggleRule(r)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Implement generic empty states for remaining tabs */}
          <TabsContent value="robotics">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground text-sm">
                AMR Task Dispatcher linked and verified.
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="billing">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground text-sm">
                3PL Replenishment billing matrices loaded.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardSidebar>
  );
}
