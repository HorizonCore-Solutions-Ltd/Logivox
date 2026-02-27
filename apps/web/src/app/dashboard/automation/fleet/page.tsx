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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Activity,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Bot,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FleetDevice {
  id: string;
  name: string;
  deviceType: string;
  status: "ACTIVE" | "IDLE" | "CHARGING" | "MAINTENANCE" | "ERROR" | "OFFLINE";
  batteryLevel: number | null;
  currentLocation: string | null;
  utilizationPct: number;
  tasksCompletedToday: number;
  uptimeHours: number;
}

interface FleetTask {
  id: string;
  taskType: string;
  priority: number;
  status: string;
  deviceId: string | null;
  deviceName: string | null;
  sourceLocation: string | null;
  destinationLocation: string | null;
  estimatedDuration: number | null;
  createdAt: string;
}

interface DispatchSuggestion {
  taskId: string;
  taskType: string;
  priority: number;
  sourceLocation: string | null;
  destinationLocation: string | null;
  suggestedDeviceId: string | null;
  suggestedDeviceName: string;
}

interface FleetSummary {
  totalDevices: number;
  active: number;
  idle: number;
  charging: number;
  maintenance: number;
  avgUtilizationPct: number;
  totalTasksToday: number;
  queuedTasks: number;
  activeTasks: number;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_DEVICES: FleetDevice[] = [
  { id: "D1", name: "AMR-Alpha-01", deviceType: "AMR", status: "ACTIVE", batteryLevel: 78, currentLocation: "Aisle A-07", utilizationPct: 82, tasksCompletedToday: 34, uptimeHours: 6.5 },
  { id: "D2", name: "AMR-Alpha-02", deviceType: "AMR", status: "ACTIVE", batteryLevel: 61, currentLocation: "Aisle C-03", utilizationPct: 75, tasksCompletedToday: 28, uptimeHours: 6.5 },
  { id: "D3", name: "AMR-Alpha-03", deviceType: "AMR", status: "IDLE", batteryLevel: 95, currentLocation: "Home Base 1", utilizationPct: 45, tasksCompletedToday: 19, uptimeHours: 4.2 },
  { id: "D4", name: "AMR-Bravo-01", deviceType: "AMR", status: "CHARGING", batteryLevel: 23, currentLocation: "Charging Station 1", utilizationPct: 0, tasksCompletedToday: 41, uptimeHours: 7.1 },
  { id: "D5", name: "AGV-01", deviceType: "AGV", status: "ACTIVE", batteryLevel: 88, currentLocation: "Rack Row B", utilizationPct: 90, tasksCompletedToday: 52, uptimeHours: 7.8 },
  { id: "D6", name: "AGV-02", deviceType: "AGV", status: "IDLE", batteryLevel: 71, currentLocation: "Dock Area", utilizationPct: 60, tasksCompletedToday: 31, uptimeHours: 5.9 },
  { id: "D7", name: "COBOT-Pack-01", deviceType: "COBOT", status: "ACTIVE", batteryLevel: null, currentLocation: "Pack Station 1", utilizationPct: 95, tasksCompletedToday: 112, uptimeHours: 8.0 },
  { id: "D8", name: "COBOT-Pack-02", deviceType: "COBOT", status: "MAINTENANCE", batteryLevel: null, currentLocation: "Maintenance Bay", utilizationPct: 0, tasksCompletedToday: 0, uptimeHours: 0 },
  { id: "D9", name: "ROBOT-ARM-01", deviceType: "ROBOT_ARM", status: "ACTIVE", batteryLevel: null, currentLocation: "Palletizing Station", utilizationPct: 88, tasksCompletedToday: 67, uptimeHours: 7.5 },
];

const DEMO_TASKS: FleetTask[] = [
  { id: "T1", taskType: "PICK", priority: 9, status: "IN_PROGRESS", deviceId: "D1", deviceName: "AMR-Alpha-01", sourceLocation: "A-07-B", destinationLocation: "PACK-01", estimatedDuration: 8, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "T2", taskType: "PUTAWAY", priority: 8, status: "IN_PROGRESS", deviceId: "D5", deviceName: "AGV-01", sourceLocation: "RECV-01", destinationLocation: "B-12-A", estimatedDuration: 12, createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: "T3", taskType: "PICK", priority: 7, status: "QUEUED", deviceId: null, deviceName: null, sourceLocation: "C-03-C", destinationLocation: "PACK-02", estimatedDuration: 7, createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: "T4", taskType: "REPLENISHMENT", priority: 6, status: "QUEUED", deviceId: null, deviceName: null, sourceLocation: "BULK-04", destinationLocation: "F-01-A", estimatedDuration: 15, createdAt: new Date(Date.now() - 1 * 60000).toISOString() },
  { id: "T5", taskType: "PICK", priority: 5, status: "QUEUED", deviceId: null, deviceName: null, sourceLocation: "E-09-B", destinationLocation: "PACK-01", estimatedDuration: 6, createdAt: new Date(Date.now() - 45000).toISOString() },
];

const DEMO_SUGGESTIONS: DispatchSuggestion[] = [
  { taskId: "T3", taskType: "PICK", priority: 7, sourceLocation: "C-03-C", destinationLocation: "PACK-02", suggestedDeviceId: "D3", suggestedDeviceName: "AMR-Alpha-03" },
  { taskId: "T4", taskType: "REPLENISHMENT", priority: 6, sourceLocation: "BULK-04", destinationLocation: "F-01-A", suggestedDeviceId: "D6", suggestedDeviceName: "AGV-02" },
  { taskId: "T5", taskType: "PICK", priority: 5, sourceLocation: "E-09-B", destinationLocation: "PACK-01", suggestedDeviceId: null, suggestedDeviceName: "No idle device available" },
];

const DEMO_SUMMARY: FleetSummary = {
  totalDevices: DEMO_DEVICES.length,
  active: DEMO_DEVICES.filter((d) => d.status === "ACTIVE").length,
  idle: DEMO_DEVICES.filter((d) => d.status === "IDLE").length,
  charging: DEMO_DEVICES.filter((d) => d.status === "CHARGING").length,
  maintenance: DEMO_DEVICES.filter((d) => d.status === "MAINTENANCE" || d.status === "ERROR").length,
  avgUtilizationPct: Math.round(DEMO_DEVICES.reduce((s, d) => s + d.utilizationPct, 0) / DEMO_DEVICES.length),
  totalTasksToday: DEMO_DEVICES.reduce((s, d) => s + d.tasksCompletedToday, 0),
  queuedTasks: 3,
  activeTasks: 2,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE: { color: "text-green-700", bg: "bg-green-100 border-green-300", label: "Active" },
  IDLE: { color: "text-gray-600", bg: "bg-gray-100 border-gray-300", label: "Idle" },
  CHARGING: { color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-300", label: "Charging" },
  MAINTENANCE: { color: "text-orange-700", bg: "bg-orange-100 border-orange-300", label: "Maintenance" },
  ERROR: { color: "text-red-700", bg: "bg-red-100 border-red-300", label: "Error" },
  OFFLINE: { color: "text-gray-400", bg: "bg-gray-100 border-gray-200", label: "Offline" },
};

const DEVICE_TYPE_ICON: Record<string, string> = {
  AMR: "🤖",
  AGV: "🚗",
  COBOT: "🦾",
  ROBOT_ARM: "🦿",
  CONVEYOR: "⚙️",
  SORTER: "📦",
};

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return <span className="text-xs text-gray-400">AC</span>;
  if (level <= 15) return <BatteryWarning className="h-4 w-4 text-red-500" />;
  if (level <= 30) return <BatteryLow className="h-4 w-4 text-orange-500" />;
  if (level <= 60) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
  if (level <= 90) return <Battery className="h-4 w-4 text-green-500" />;
  return <BatteryFull className="h-4 w-4 text-green-600" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FleetPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [tasks, setTasks] = useState<FleetTask[]>([]);
  const [suggestions, setSuggestions] = useState<DispatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<FleetDevice | null>(null);
  const [customTask, setCustomTask] = useState({ taskType: "PICK", sourceLocation: "", destinationLocation: "", priority: "5" });
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/fleet");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary ?? null);
        setDevices(data.devices ?? []);
        setTasks(data.pendingTasks ?? []);
        setSuggestions(data.dispatchSuggestions ?? []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const dispatchTask = async (deviceId: string, taskType: string, source: string | null, dest: string | null, priority: number) => {
    setDispatching(deviceId);
    try {
      const res = await fetch("/api/automation/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, taskType, sourceLocation: source, destinationLocation: dest, priority }),
      });
      if (res.ok) {
        toast({ title: "Task Dispatched", description: `${taskType} task sent to device` });
        fetchData();
      }
    } catch {
      toast({ title: "Dispatch failed", variant: "destructive" });
    } finally {
      setDispatching(null);
    }
  };

  const acceptSuggestion = (s: DispatchSuggestion) => {
    if (!s.suggestedDeviceId) return;
    dispatchTask(s.suggestedDeviceId, s.taskType, s.sourceLocation, s.destinationLocation, s.priority);
  };

  const openCustomDispatch = (device: FleetDevice) => {
    setSelectedDevice(device);
    setCustomDialogOpen(true);
  };

  const sendCustomDispatch = () => {
    if (!selectedDevice) return;
    dispatchTask(selectedDevice.id, customTask.taskType, customTask.sourceLocation || null, customTask.destinationLocation || null, Number(customTask.priority));
    setCustomDialogOpen(false);
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 15_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const dSummary = summary ?? DEMO_SUMMARY;
  const dDevices = devices.length > 0 ? devices : DEMO_DEVICES;
  const dTasks = tasks.length > 0 ? tasks : DEMO_TASKS;
  const dSuggestions = suggestions.length > 0 ? suggestions : DEMO_SUGGESTIONS;

  const barData = dDevices.filter((d) => d.tasksCompletedToday > 0).map((d) => ({
    name: d.name.split("-").slice(-2).join("-"),
    tasks: d.tasksCompletedToday,
    util: d.utilizationPct,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-violet-500" />
            AMR / Robot Fleet Command
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time fleet status · Task dispatch · Battery management · Utilization analytics
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">· {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh((v) => !v)} className={autoRefresh ? "border-green-400 text-green-700" : ""}>
            <Activity className="h-4 w-4 mr-1" />
            {autoRefresh ? "Live (15s)" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-3xl font-bold text-green-700">{dSummary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Idle</p>
            <p className="text-3xl font-bold text-gray-500">{dSummary.idle}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Charging</p>
            <p className="text-3xl font-bold text-yellow-600">{dSummary.charging}</p>
          </CardContent>
        </Card>
        <Card className={dSummary.maintenance > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Maintenance</p>
            <p className={`text-3xl font-bold ${dSummary.maintenance > 0 ? "text-orange-600" : "text-gray-400"}`}>{dSummary.maintenance}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Avg Utilization</p>
            <p className="text-3xl font-bold text-violet-700">{dSummary.avgUtilizationPct}%</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Tasks Completed Today</p>
            <p className="text-3xl font-bold text-blue-600">{dSummary.totalTasksToday}</p>
          </CardContent>
        </Card>
        <Card className={dSummary.queuedTasks > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Queued Tasks</p>
            <p className={`text-3xl font-bold ${dSummary.queuedTasks > 0 ? "text-orange-600" : "text-gray-400"}`}>{dSummary.queuedTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Tasks</p>
            <p className="text-3xl font-bold text-green-600">{dSummary.activeTasks}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fleet">
        <TabsList>
          <TabsTrigger value="fleet">Fleet Status</TabsTrigger>
          <TabsTrigger value="dispatch">
            Dispatch Queue
            {dSummary.queuedTasks > 0 && <Badge className="ml-1.5 text-xs bg-orange-500">{dSummary.queuedTasks}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Fleet Status Grid */}
        <TabsContent value="fleet" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dDevices.map((device) => {
              const cfg = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.OFFLINE;
              const isLowBattery = device.batteryLevel !== null && device.batteryLevel <= 20;
              return (
                <Card key={device.id} className={`border-2 ${cfg.bg} transition-all`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{DEVICE_TYPE_ICON[device.deviceType] ?? "🔧"}</span>
                        <div>
                          <CardTitle className="text-sm font-semibold">{device.name}</CardTitle>
                          <CardDescription className="text-xs">{device.deviceType}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`text-xs ${cfg.bg} ${cfg.color} border`}>{cfg.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Battery */}
                    {device.batteryLevel !== null && (
                      <div className="flex items-center gap-2">
                        {device.status === "CHARGING" ? <BatteryCharging className="h-4 w-4 text-yellow-500" /> : <BatteryIcon level={device.batteryLevel} />}
                        <Progress value={device.batteryLevel} className={`h-2 flex-1 ${isLowBattery ? "bg-red-100" : ""}`} />
                        <span className={`text-xs font-bold ${isLowBattery ? "text-red-600" : "text-gray-600"}`}>{device.batteryLevel}%</span>
                      </div>
                    )}
                    {/* Utilization */}
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-violet-400" />
                      <Progress value={device.utilizationPct} className="h-1.5 flex-1" />
                      <span className="text-xs text-gray-500">{device.utilizationPct}% util</span>
                    </div>
                    {/* Location + tasks */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {device.currentLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.currentLocation}
                        </span>
                      )}
                      <span>{device.tasksCompletedToday} tasks today</span>
                    </div>
                    {/* Dispatch button for idle devices */}
                    {device.status === "IDLE" && (
                      <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-1" onClick={() => openCustomDispatch(device)}>
                        <Zap className="h-3 w-3 mr-1" />
                        Dispatch Task
                      </Button>
                    )}
                    {device.status === "MAINTENANCE" && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <Settings className="h-3 w-3" />
                        Under maintenance
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Dispatch Queue */}
        <TabsContent value="dispatch" className="mt-4 space-y-4">
          {/* Dispatch Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">AI Dispatch Suggestions</CardTitle>
              <CardDescription>Optimal device matched to each queued task based on type + proximity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dSuggestions.map((sug) => (
                <div key={sug.taskId} className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50">
                  <div className="text-xs text-center w-6">
                    <span className="font-bold text-violet-700">P{sug.priority}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{sug.taskType}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {sug.sourceLocation ?? "—"} → {sug.destinationLocation ?? "—"}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium text-gray-700">{sug.suggestedDeviceName}</p>
                    {!sug.suggestedDeviceId && <p className="text-red-400">No device available</p>}
                  </div>
                  <Button size="sm" disabled={!sug.suggestedDeviceId || dispatching === sug.suggestedDeviceId} onClick={() => acceptSuggestion(sug)} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {dispatching === sug.suggestedDeviceId ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3 mr-1" />Accept</>}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Task Queue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Full Task Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${task.status === "IN_PROGRESS" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                    <Badge variant={task.status === "IN_PROGRESS" ? "default" : "outline"} className={`text-xs ${task.status === "IN_PROGRESS" ? "bg-green-100 text-green-800" : ""}`}>
                      {task.status.replace("_", " ")}
                    </Badge>
                    <span className="font-medium">{task.taskType}</span>
                    <span className="text-gray-400 text-xs flex-1">
                      {task.sourceLocation ?? "—"} → {task.destinationLocation ?? "—"}
                    </span>
                    {task.deviceName && (
                      <span className="text-xs text-violet-600 font-medium">{task.deviceName}</span>
                    )}
                    <span className="text-xs text-gray-400">P{task.priority}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tasks Completed Today — Per Device</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v: number, name: string) => [v, name === "tasks" ? "Tasks Completed" : "Utilization %"]} />
                  <Bar dataKey="tasks" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.util >= 80 ? "#7c3aed" : entry.util >= 50 ? "#a78bfa" : "#ddd6fe"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Dispatch Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dispatch Task to {selectedDevice?.name}</DialogTitle>
            <DialogDescription>Assign a manual task to this device</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Task Type</Label>
              <Select value={customTask.taskType} onValueChange={(v) => setCustomTask((t) => ({ ...t, taskType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICK">Pick</SelectItem>
                  <SelectItem value="PUTAWAY">Putaway</SelectItem>
                  <SelectItem value="REPLENISHMENT">Replenishment</SelectItem>
                  <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source Location</Label>
              <Input placeholder="e.g. A-07-B" value={customTask.sourceLocation} onChange={(e) => setCustomTask((t) => ({ ...t, sourceLocation: e.target.value }))} />
            </div>
            <div>
              <Label>Destination</Label>
              <Input placeholder="e.g. PACK-01" value={customTask.destinationLocation} onChange={(e) => setCustomTask((t) => ({ ...t, destinationLocation: e.target.value }))} />
            </div>
            <div>
              <Label>Priority (1–10)</Label>
              <Input type="number" min="1" max="10" value={customTask.priority} onChange={(e) => setCustomTask((t) => ({ ...t, priority: e.target.value }))} />
            </div>
          </div>
          <Button className="w-full mt-2 bg-violet-600 hover:bg-violet-700 text-white" disabled={dispatching === selectedDevice?.id} onClick={sendCustomDispatch}>
            {dispatching === selectedDevice?.id ? "Dispatching…" : "Dispatch"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
