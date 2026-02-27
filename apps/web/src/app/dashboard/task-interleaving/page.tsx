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
import { ArrowRightLeft, CheckCircle2, Clock, RefreshCw, Activity, Zap, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Wave {
  id: string;
  name: string;
  status: string;
  totalLines: number;
  completedLines: number;
  assignedWorkers: string[];
}

interface InterleavingTask {
  taskId: string;
  type: string;
  location: string;
  aisle: string;
  product: string;
  priority: number;
  nearestWorker: string | null;
  distanceSaving: string;
}

interface WorkerQueue {
  workerId: string;
  workerName: string;
  currentTask: string;
  currentLocation: string;
  queueDepth: number;
  estimatedMinutesUntilFree: number;
}

interface InterleavingData {
  summary: {
    activeWaves: number;
    pendingInterleavingSuggestions: number;
    idleWorkers: number;
    estimatedTimeSavingMinutes: number;
  };
  activeWaves: Wave[];
  interleavingSuggestions: InterleavingTask[];
  workerQueues: WorkerQueue[];
}

export default function TaskInterleavingPage() {
  const { toast } = useToast();
  const [data, setData] = useState<InterleavingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/task-interleaving");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Error fetching task interleaving:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptSuggestion = async (suggestion: InterleavingTask) => {
    if (!suggestion.nearestWorker) return;
    setAccepting(suggestion.taskId);
    try {
      const res = await fetch("/api/task-interleaving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: suggestion.taskId,
          workerId: suggestion.nearestWorker,
        }),
      });
      if (res.ok) {
        toast({
          title: "Task Assigned",
          description: `${suggestion.type} at ${suggestion.location} assigned to ${suggestion.nearestWorker}`,
        });
        fetchData();
      }
    } catch (err) {
      toast({ title: "Assignment failed", description: "Please try again", variant: "destructive" });
    } finally {
      setAccepting(null);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 30_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  // Demo data for when DB is empty
  const displayData: InterleavingData = data?.activeWaves?.length
    ? data
    : {
        summary: {
          activeWaves: 3,
          pendingInterleavingSuggestions: 7,
          idleWorkers: 2,
          estimatedTimeSavingMinutes: 34,
        },
        activeWaves: [
          { id: "W-001", name: "Wave AM-01", status: "IN_PROGRESS", totalLines: 48, completedLines: 31, assignedWorkers: ["J. Smith", "M. Patel", "L. Jones"] },
          { id: "W-002", name: "Wave AM-02", status: "IN_PROGRESS", totalLines: 32, completedLines: 12, assignedWorkers: ["A. Brown", "R. Davis"] },
          { id: "W-003", name: "Wave PM-01", status: "ASSIGNED", totalLines: 60, completedLines: 0, assignedWorkers: ["S. Wilson", "K. Moore", "E. Taylor", "P. Anderson"] },
        ],
        interleavingSuggestions: [
          { taskId: "T-101", type: "Putaway", location: "A-12-B", aisle: "A", product: "SKU-7734", priority: 1, nearestWorker: "J. Smith", distanceSaving: "~45 ft" },
          { taskId: "T-102", type: "Replenishment", location: "C-04-A", aisle: "C", product: "SKU-2291", priority: 2, nearestWorker: "M. Patel", distanceSaving: "~30 ft" },
          { taskId: "T-103", type: "Putaway", location: "B-08-C", aisle: "B", product: "SKU-8812", priority: 2, nearestWorker: "A. Brown", distanceSaving: "~60 ft" },
          { taskId: "T-104", type: "Replenishment", location: "F-02-A", aisle: "F", product: "SKU-1107", priority: 3, nearestWorker: "L. Jones", distanceSaving: "~22 ft" },
        ],
        workerQueues: [
          { workerId: "EMP-001", workerName: "J. Smith", currentTask: "Picking", currentLocation: "A-11", queueDepth: 3, estimatedMinutesUntilFree: 4 },
          { workerId: "EMP-002", workerName: "M. Patel", currentTask: "Picking", currentLocation: "C-03", queueDepth: 2, estimatedMinutesUntilFree: 6 },
          { workerId: "EMP-003", workerName: "L. Jones", currentTask: "Picking", currentLocation: "F-01", queueDepth: 4, estimatedMinutesUntilFree: 3 },
          { workerId: "EMP-004", workerName: "A. Brown", currentTask: "Idle", currentLocation: "B-07", queueDepth: 0, estimatedMinutesUntilFree: 0 },
          { workerId: "EMP-005", workerName: "R. Davis", currentTask: "Idle", currentLocation: "DOCK", queueDepth: 0, estimatedMinutesUntilFree: 0 },
        ],
      };

  const PRIORITY_COLOR: Record<number, string> = {
    1: "bg-red-100 text-red-700 border-red-300",
    2: "bg-orange-100 text-orange-700 border-orange-300",
    3: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-purple-500" />
            Task Interleaving Engine
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Minimize travel time by assigning nearby secondary tasks to workers finishing picks
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">· Updated: {lastUpdated}</span>}
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
            {autoRefresh ? "Live (30s)" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Active Waves</p>
            <p className="text-3xl font-bold text-blue-600">{displayData.summary.activeWaves}</p>
            <p className="text-xs text-gray-400 mt-0.5">waves in progress</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Pending Suggestions</p>
            <p className="text-3xl font-bold text-orange-600">{displayData.summary.pendingInterleavingSuggestions}</p>
            <p className="text-xs text-gray-400 mt-0.5">awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Idle Workers</p>
            <p className="text-3xl font-bold text-gray-500">{displayData.summary.idleWorkers}</p>
            <p className="text-xs text-gray-400 mt-0.5">can take tasks now</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Est. Time Saving</p>
            <p className="text-3xl font-bold text-green-600">{displayData.summary.estimatedTimeSavingMinutes}m</p>
            <p className="text-xs text-gray-400 mt-0.5">if all accepted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Waves */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Active Waves
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayData.activeWaves.map((wave) => {
              const pct = Math.round((wave.completedLines / Math.max(wave.totalLines, 1)) * 100);
              return (
                <div key={wave.id} className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{wave.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{wave.status.replace("_", " ")}</Badge>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{wave.completedLines}/{wave.totalLines} lines</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{wave.assignedWorkers.length} workers</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {wave.assignedWorkers.map((w) => (
                      <Badge key={w} variant="secondary" className="text-xs">{w}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Worker Queue Depth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Worker Queue Depth
            </CardTitle>
            <CardDescription>Current task queue per worker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayData.workerQueues.map((w) => (
                <div key={w.workerId} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{w.workerName}</span>
                      <Badge
                        variant={w.currentTask === "Idle" ? "secondary" : "outline"}
                        className={`text-xs ${w.currentTask === "Idle" ? "bg-gray-100" : "bg-blue-50 text-blue-700"}`}
                      >
                        {w.currentTask}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{w.currentLocation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{w.queueDepth}</p>
                    <p className="text-xs text-gray-400">
                      {w.estimatedMinutesUntilFree > 0
                        ? `~${w.estimatedMinutesUntilFree}m free`
                        : "Available now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interleaving Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Interleaving Suggestions
          </CardTitle>
          <CardDescription>
            Secondary tasks that can be assigned to workers finishing nearby picks — accept to dispatch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.interleavingSuggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No interleaving opportunities right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayData.interleavingSuggestions.map((sug) => (
                <div
                  key={sug.taskId}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50 hover:bg-white transition-colors"
                >
                  <div className={`px-2 py-0.5 rounded border text-xs font-bold ${PRIORITY_COLOR[sug.priority] ?? "bg-gray-100 text-gray-700"}`}>
                    P{sug.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{sug.type}</span>
                      <Badge variant="outline" className="text-xs">{sug.product}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Location: <span className="font-medium text-gray-700">{sug.location}</span>
                      {" · "}Aisle {sug.aisle}
                    </p>
                  </div>
                  {sug.nearestWorker && (
                    <div className="text-right text-xs text-gray-500">
                      <p>Nearest: <span className="font-medium text-gray-700">{sug.nearestWorker}</span></p>
                      <p className="text-green-600">{sug.distanceSaving} saved</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    disabled={!sug.nearestWorker || accepting === sug.taskId}
                    onClick={() => acceptSuggestion(sug)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {accepting === sug.taskId ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
