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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  Award,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerMetric {
  id: string;
  name: string;
  department: string;
  position: string;
  status: "ACTIVE" | "SCHEDULED" | "IDLE";
  clockedInAt: string | null;
  hoursToday: number;
  unitsPicked: number;
  unitsPacked: number;
  linesProcessed: number;
  unitsPerHour: number;
  pts: number; // Performance-to-Standard %
}

interface DeptSummary {
  name: string;
  workers: number;
  avgPts: number;
}

interface LaborSummary {
  totalWorkersScheduled: number;
  totalWorkersClocked: number;
  totalUnitsPicked: number;
  totalUnitsPacked: number;
  totalLinesProcessed: number;
  totalHoursWorked: number;
  unitsPerHour: number;
  performanceToStandard: number;
  standardUnitsPerHour: number;
  timestamp: string;
}

const getPTSBadge = (pts: number) => {
  if (pts >= 110)
    return (
      <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
        ⭐ Top Performer
      </Badge>
    );
  if (pts >= 95)
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-200">
        ✅ On Target
      </Badge>
    );
  if (pts >= 80)
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
        ⚠️ Approaching
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-800 border border-red-200">
      🔴 Needs Support
    </Badge>
  );
};

const getPTSColor = (pts: number) => {
  if (pts >= 110) return "bg-purple-500";
  if (pts >= 95) return "bg-green-500";
  if (pts >= 80) return "bg-yellow-500";
  return "bg-red-500";
};

export default function LaborDashboardPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<LaborSummary | null>(null);
  const [workers, setWorkers] = useState<WorkerMetric[]>([]);
  const [departments, setDepartments] = useState<DeptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [reassignModal, setReassignModal] = useState<{
    open: boolean;
    worker: WorkerMetric | null;
  }>({ open: false, worker: null });
  const [reassignTarget, setReassignTarget] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/labor/dashboard");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setWorkers(data.workers ?? []);
        setDepartments(data.departments ?? []);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to fetch labor data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleReassign = async () => {
    if (!reassignModal.worker || !reassignTarget) return;
    toast({
      title: "Re-assignment Sent",
      description: `${reassignModal.worker.name} → ${reassignTarget}`,
    });
    setReassignModal({ open: false, worker: null });
    setReassignTarget("");
  };

  const activeWorkers = workers.filter((w) => w.status === "ACTIVE");
  const needingSupportCount = workers.filter((w) => w.pts < 80 && w.status === "ACTIVE").length;
  const topPerformers = workers.filter((w) => w.pts >= 110).length;

  const departmentChartData = departments.map((d) => ({
    name: d.name.length > 12 ? d.name.substring(0, 12) + "…" : d.name,
    "Avg PTS %": d.avgPts,
    workers: d.workers,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Real-Time Labor Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live workforce performance vs. engineered labor standards
            {lastRefreshed && (
              <span className="ml-2 text-xs text-gray-400">
                · Last updated: {lastRefreshed}
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
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workers</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? "—" : activeWorkers.length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  of {summary?.totalWorkersScheduled ?? "—"} scheduled
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shift PTS %</p>
                <p
                  className={`text-3xl font-bold ${(summary?.performanceToStandard ?? 0) >= 95 ? "text-green-600" : (summary?.performanceToStandard ?? 0) >= 80 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {loading ? "—" : `${summary?.performanceToStandard ?? 0}%`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Std: {summary?.standardUnitsPerHour ?? 120} units/hr
                </p>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Units / Hour</p>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? "—" : summary?.unitsPerHour ?? 0}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {summary?.totalUnitsPicked ?? 0} picked ·{" "}
                  {summary?.totalUnitsPacked ?? 0} packed
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={needingSupportCount > 0 ? "border-red-200 bg-red-50" : ""}
        >
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Need Support</p>
                <p
                  className={`text-3xl font-bold ${needingSupportCount > 0 ? "text-red-600" : "text-gray-400"}`}
                >
                  {loading ? "—" : needingSupportCount}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {topPerformers} top performers
                </p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${needingSupportCount > 0 ? "text-red-300" : "text-gray-200"}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workers">
        <TabsList>
          <TabsTrigger value="workers">
            <Users className="h-4 w-4 mr-1" />
            Worker Leaderboard
          </TabsTrigger>
          <TabsTrigger value="departments">
            <BarChart className="h-4 w-4 mr-1" />
            Departments
          </TabsTrigger>
        </TabsList>

        {/* Worker Leaderboard */}
        <TabsContent value="workers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Worker Performance — Today&apos;s Shift
              </CardTitle>
              <CardDescription>
                Ranked by Performance-to-Standard (PTS%). Standard ={" "}
                {summary?.standardUnitsPerHour ?? 120} units/hr
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading worker data…
                </div>
              ) : workers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No workers clocked in yet today.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Units/Hr</TableHead>
                      <TableHead>PTS %</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker, idx) => (
                      <TableRow
                        key={worker.id}
                        className={
                          worker.pts < 80 && worker.status === "ACTIVE"
                            ? "bg-red-50 hover:bg-red-100"
                            : ""
                        }
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {worker.position}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {worker.department}
                        </TableCell>
                        <TableCell>
                          {worker.status === "ACTIVE" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              Active
                            </Badge>
                          ) : worker.status === "SCHEDULED" ? (
                            <Badge
                              variant="outline"
                              className="text-xs text-gray-500"
                            >
                              Scheduled
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-yellow-600"
                            >
                              Idle
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {worker.unitsPerHour > 0 ? worker.unitsPerHour : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px]">
                              <Progress
                                value={Math.min(worker.pts, 130)}
                                max={130}
                                className="h-2"
                              />
                            </div>
                            <span className="text-sm font-semibold min-w-[40px]">
                              {worker.pts > 0 ? `${worker.pts}%` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {worker.status === "ACTIVE" && worker.pts > 0
                            ? getPTSBadge(worker.pts)
                            : null}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {worker.hoursToday > 0
                            ? `${worker.hoursToday.toFixed(1)}h`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {worker.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setReassignModal({ open: true, worker })
                              }
                            >
                              <ArrowRightLeft className="h-3 w-3 mr-1" />
                              Re-assign
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading || departments.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  {loading ? "Loading…" : "No department data available"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={departmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis domain={[0, 130]} />
                    <Tooltip
                      formatter={(val: any, name: string) =>
                        name === "Avg PTS %" ? [`${val}%`, name] : [val, name]
                      }
                    />
                    <Legend />
                    <Bar dataKey="Avg PTS %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Department table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Workers Active</TableHead>
                    <TableHead>Avg PTS %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.name}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-right">
                        {dept.workers}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(dept.avgPts, 130)}
                            max={130}
                            className="h-2 max-w-[100px]"
                          />
                          <span className="text-sm font-semibold">
                            {dept.avgPts}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getPTSBadge(dept.avgPts)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Re-assignment Modal */}
      <Dialog
        open={reassignModal.open}
        onOpenChange={(v) => setReassignModal({ open: v, worker: v ? reassignModal.worker : null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Re-assign Worker
            </DialogTitle>
            <DialogDescription>
              Move{" "}
              <strong>{reassignModal.worker?.name}</strong> to a different
              department or zone. Current PTS:{" "}
              <strong>{reassignModal.worker?.pts}%</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {["Picking", "Packing", "Receiving", "Replenishment", "Shipping"].map(
              (dept) => (
                <button
                  key={dept}
                  onClick={() => setReassignTarget(dept)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${reassignTarget === dept ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {dept}
                </button>
              ),
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignModal({ open: false, worker: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!reassignTarget}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm Re-assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
