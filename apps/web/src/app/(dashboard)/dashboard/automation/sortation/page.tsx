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
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SortationDevice {
  id: string;
  name: string;
  deviceType: "CONVEYOR" | "SORTER" | "AS_RS";
  status: "ACTIVE" | "IDLE" | "MAINTENANCE" | "ERROR" | "OFFLINE";
  currentLocation: string | null;
  utilizationPct: number;
  tasksToday: number;
  successRate: number;
  lastMaintenance: string | null;
}

interface ThroughputPoint {
  hour: string;
  items: number;
}

interface ActivityItem {
  id: string;
  taskType: string;
  device: string;
  deviceType: string;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "QUEUED";
  createdAt: string;
  completedAt: string | null;
}

interface SortationSummary {
  totalSorters: number;
  online: number;
  offline: number;
  itemsProcessedToday: number;
  avgSystemSuccessRate: number;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_DEVICES: SortationDevice[] = [
  {
    id: "C1",
    name: "Main Conveyor Line A",
    deviceType: "CONVEYOR",
    status: "ACTIVE",
    currentLocation: "Zone A — Inbound",
    utilizationPct: 88,
    tasksToday: 1240,
    successRate: 99,
    lastMaintenance: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
  },
  {
    id: "C2",
    name: "Main Conveyor Line B",
    deviceType: "CONVEYOR",
    status: "ACTIVE",
    currentLocation: "Zone B — Outbound",
    utilizationPct: 76,
    tasksToday: 943,
    successRate: 98,
    lastMaintenance: new Date(Date.now() - 5 * 24 * 3600_000).toISOString(),
  },
  {
    id: "S1",
    name: "Cross-Belt Sorter 1",
    deviceType: "SORTER",
    status: "ACTIVE",
    currentLocation: "Sort Hub 1",
    utilizationPct: 91,
    tasksToday: 2180,
    successRate: 97,
    lastMaintenance: new Date(Date.now() - 14 * 24 * 3600_000).toISOString(),
  },
  {
    id: "S2",
    name: "Cross-Belt Sorter 2",
    deviceType: "SORTER",
    status: "ACTIVE",
    currentLocation: "Sort Hub 2",
    utilizationPct: 84,
    tasksToday: 1876,
    successRate: 98,
    lastMaintenance: new Date(Date.now() - 10 * 24 * 3600_000).toISOString(),
  },
  {
    id: "S3",
    name: "Shoe Sorter — Returns",
    deviceType: "SORTER",
    status: "IDLE",
    currentLocation: "Returns Area",
    utilizationPct: 22,
    tasksToday: 187,
    successRate: 95,
    lastMaintenance: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
  },
  {
    id: "AS1",
    name: "AS/RS Crane 1",
    deviceType: "AS_RS",
    status: "ACTIVE",
    currentLocation: "High-Bay Rack Row A",
    utilizationPct: 93,
    tasksToday: 312,
    successRate: 100,
    lastMaintenance: new Date(Date.now() - 30 * 24 * 3600_000).toISOString(),
  },
  {
    id: "AS2",
    name: "AS/RS Crane 2",
    deviceType: "AS_RS",
    status: "MAINTENANCE",
    currentLocation: "Maintenance Bay",
    utilizationPct: 0,
    tasksToday: 0,
    successRate: 100,
    lastMaintenance: new Date().toISOString(),
  },
];

const now = new Date();
const DEMO_THROUGHPUT: ThroughputPoint[] = Array.from(
  { length: 8 },
  (_, i) => ({
    hour: `${String((now.getHours() - 7 + i + 24) % 24).padStart(2, "0")}:00`,
    items: [120, 210, 340, 480, 520, 460, 390, 290][i],
  }),
);

const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: "A1",
    taskType: "SORT",
    device: "Cross-Belt Sorter 1",
    deviceType: "SORTER",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 45000).toISOString(),
    completedAt: new Date(Date.now() - 38000).toISOString(),
  },
  {
    id: "A2",
    taskType: "CONVEY",
    device: "Main Conveyor Line A",
    deviceType: "CONVEYOR",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 62000).toISOString(),
    completedAt: new Date(Date.now() - 55000).toISOString(),
  },
  {
    id: "A3",
    taskType: "SORT",
    device: "Cross-Belt Sorter 2",
    deviceType: "SORTER",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 90000).toISOString(),
    completedAt: new Date(Date.now() - 82000).toISOString(),
  },
  {
    id: "A4",
    taskType: "RETRIEVE",
    device: "AS/RS Crane 1",
    deviceType: "AS_RS",
    status: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 110000).toISOString(),
    completedAt: null,
  },
  {
    id: "A5",
    taskType: "SORT",
    device: "Shoe Sorter — Returns",
    deviceType: "SORTER",
    status: "FAILED",
    createdAt: new Date(Date.now() - 150000).toISOString(),
    completedAt: null,
  },
  {
    id: "A6",
    taskType: "CONVEY",
    device: "Main Conveyor Line B",
    deviceType: "CONVEYOR",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 180000).toISOString(),
    completedAt: new Date(Date.now() - 171000).toISOString(),
  },
  {
    id: "A7",
    taskType: "STORE",
    device: "AS/RS Crane 1",
    deviceType: "AS_RS",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 240000).toISOString(),
    completedAt: new Date(Date.now() - 230000).toISOString(),
  },
];

const DEMO_SUMMARY: SortationSummary = {
  totalSorters: DEMO_DEVICES.length,
  online: DEMO_DEVICES.filter(
    (d) => d.status === "ACTIVE" || d.status === "IDLE",
  ).length,
  offline: DEMO_DEVICES.filter(
    (d) =>
      d.status === "MAINTENANCE" ||
      d.status === "ERROR" ||
      d.status === "OFFLINE",
  ).length,
  itemsProcessedToday: DEMO_DEVICES.reduce((s, d) => s + d.tasksToday, 0),
  avgSystemSuccessRate: Math.round(
    DEMO_DEVICES.filter((d) => d.tasksToday > 0).reduce(
      (s, d) => s + d.successRate,
      0,
    ) / DEMO_DEVICES.filter((d) => d.tasksToday > 0).length,
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  ACTIVE: {
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-800 border-green-300",
    label: "Online",
  },
  IDLE: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Idle",
  },
  MAINTENANCE: {
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    label: "Maintenance",
  },
  ERROR: {
    dot: "bg-red-600 animate-ping",
    badge: "bg-red-100 text-red-800 border-red-300",
    label: "Error",
  },
  OFFLINE: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Offline",
  },
};

const DEVICE_TYPE_ICON: Record<string, string> = {
  CONVEYOR: "⚙️",
  SORTER: "🔀",
  AS_RS: "🏗️",
};

function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SortationPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<SortationSummary | null>(null);
  const [devices, setDevices] = useState<SortationDevice[]>([]);
  const [throughput, setThroughput] = useState<ThroughputPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/sortation");
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        if (data.devices?.length) setDevices(data.devices);
        if (data.hourlyThroughput?.length) setThroughput(data.hourlyThroughput);
        if (data.recentActivity?.length) setActivity(data.recentActivity);
        setLastUpdated(new Date().toLocaleTimeString());

        const errors = (data.devices ?? []).filter(
          (d: SortationDevice) => d.status === "ERROR",
        );
        if (errors.length > 0) {
          toast({
            title: "⚠️ Sortation System Error",
            description: `${errors.map((d: SortationDevice) => d.name).join(", ")} reporting errors`,
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 15_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const dSummary = summary ?? DEMO_SUMMARY;
  const dDevices = devices.length > 0 ? devices : DEMO_DEVICES;
  const dThroughput = throughput.length > 0 ? throughput : DEMO_THROUGHPUT;
  const dActivity = activity.length > 0 ? activity : DEMO_ACTIVITY;

  const totalDailyItems = dDevices.reduce((s, d) => s + d.tasksToday, 0);

  // Per-device bar data sorted descending
  const deviceBarData = [...dDevices]
    .filter((d) => d.tasksToday > 0)
    .sort((a, b) => b.tasksToday - a.tasksToday)
    .map((d) => ({
      name: d.name.length > 22 ? d.name.slice(0, 22) + "…" : d.name,
      items: d.tasksToday,
      success: d.successRate,
    }));

  const avgThroughput =
    dThroughput.length > 0
      ? Math.round(
          dThroughput.reduce((s, p) => s + p.items, 0) / dThroughput.length,
        )
      : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="h-6 w-6 text-teal-500" />
            Sortation &amp; Conveyor Control
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conveyor lines · Cross-belt sorters · AS/RS cranes · Real-time
            throughput
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-400">
                · {lastUpdated}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className={autoRefresh ? "border-green-400 text-green-700" : ""}
          >
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-teal-200 bg-teal-50 col-span-2 md:col-span-1">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Items Processed Today
            </p>
            <p className="text-3xl font-bold text-teal-700">
              {dSummary.itemsProcessedToday.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`${dSummary.avgSystemSuccessRate >= 98 ? "border-green-200 bg-green-50" : dSummary.avgSystemSuccessRate >= 95 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}`}
        >
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">System Success Rate</p>
            <p
              className={`text-3xl font-bold ${dSummary.avgSystemSuccessRate >= 98 ? "text-green-700" : dSummary.avgSystemSuccessRate >= 95 ? "text-yellow-700" : "text-red-700"}`}
            >
              {dSummary.avgSystemSuccessRate}%
            </p>
            <Progress
              value={dSummary.avgSystemSuccessRate}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Online Systems</p>
            <p className="text-3xl font-bold text-green-600">
              {dSummary.online}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              of {dSummary.totalSorters} total
              {dSummary.offline > 0 ? ` · ${dSummary.offline} offline` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Avg Throughput/hr</p>
            <p className="text-3xl font-bold text-blue-600">
              {avgThroughput.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">items per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Throughput Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-teal-500" />
            System Throughput — Last 8 Hours
          </CardTitle>
          <CardDescription>
            Items processed per hour across all sortation systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dThroughput}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [
                  v.toLocaleString(),
                  "Items Processed",
                ]}
              />
              <ReferenceLine
                y={avgThroughput}
                stroke="#0d9488"
                strokeDasharray="4 4"
                label={{
                  value: `Avg: ${avgThroughput}`,
                  fontSize: 10,
                  fill: "#0d9488",
                }}
              />
              <Area
                type="monotone"
                dataKey="items"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#tealGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Device Status Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Status</CardTitle>
            <CardDescription>
              Per-device operational status and success rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dDevices.map((device) => {
              const cfg = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.OFFLINE;
              const needsAttention =
                device.successRate < 97 && device.tasksToday > 0;
              return (
                <div
                  key={device.id}
                  className={`p-3 rounded-lg border transition-all ${needsAttention ? "border-yellow-200 bg-yellow-50" : device.status === "MAINTENANCE" ? "border-orange-200 bg-orange-50" : device.status === "ERROR" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {DEVICE_TYPE_ICON[device.deviceType] ?? "⚙️"}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {device.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <Badge
                            className={`text-xs border ${cfg.badge} px-1.5 py-0`}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                      </div>
                      {device.currentLocation && (
                        <p className="text-xs text-gray-400">
                          {device.currentLocation}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p
                        className={`font-bold ${needsAttention ? "text-yellow-700" : "text-teal-700"}`}
                      >
                        {device.successRate}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {device.tasksToday.toLocaleString()} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={device.utilizationPct}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs text-gray-400">
                      {device.utilizationPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Per-device bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items by System Today</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deviceBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.toLocaleString()}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 9 }}
                    width={95}
                  />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString(), "Items"]}
                  />
                  <Bar dataKey="items" radius={[0, 4, 4, 0]}>
                    {deviceBarData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.success >= 98
                            ? "#0d9488"
                            : entry.success >= 95
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {dActivity.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 py-1.5 border-b last:border-0 text-sm ${item.status === "FAILED" ? "bg-red-50" : ""}`}
                  >
                    <div className="w-5 shrink-0">
                      {item.status === "COMPLETED" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {item.status === "FAILED" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {item.status === "IN_PROGRESS" && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto" />
                      )}
                      {item.status === "QUEUED" && (
                        <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.taskType}</span>
                      <span className="text-gray-400 mx-1">
                        <ArrowRight className="h-3 w-3 inline" />
                      </span>
                      <span className="text-xs text-gray-600 truncate">
                        {item.device}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
