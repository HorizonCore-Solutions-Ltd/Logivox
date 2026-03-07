"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Waves,
  Settings,
  Play,
  Pause,
  Clock,
  Users,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

interface Wave {
  id: string;
  waveNumber: string;
  name: string;
  status: string;
  progress: number;
  totalOrders: number;
  createdAt: string;
}

interface Recommendation {
  id: string;
  zone: string;
  action: "ADD_LABOR" | "REDUCE_LABOR";
  count: number;
  reason: string;
}

export default function PlanningBoard() {
  const queryClient = useQueryClient();
  const [simulationMode, setSimulationMode] = useState(false);

  const { data, isLoading } = useQuery<{
    waves: Wave[];
    recommendations: Recommendation[];
  }>({
    queryKey: ["ops-planning"],
    queryFn: async () => {
      const res = await fetch("/api/operations/planning");
      if (!res.ok) throw new Error("Failed to fetch planning data");
      return res.json();
    },
  });

  const createWaveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/operations/planning", {
        method: "POST",
        body: JSON.stringify({
          name: `Wave ${new Date().toLocaleTimeString()}`,
          type: "BATCH",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-planning"] });
      toast.success("Wave created successfully");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const waves = data?.waves || [];
  const reco = data?.recommendations || [];

  return (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning Board</h1>
          <p className="text-muted-foreground">
            Orchestrate waves, manage labor, and optimize flow.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={simulationMode ? "default" : "outline"}
            onClick={() => setSimulationMode(!simulationMode)}
          >
            <BrainCircuit className="mr-2 h-4 w-4" />
            {simulationMode ? "Exit Simulation Mode" : "Run Simulation"}
          </Button>
          <Button
            onClick={() => createWaveMutation.mutate()}
            disabled={createWaveMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Wave
          </Button>
        </div>
      </div>

      {simulationMode && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center gap-4 animate-in fade-in">
          <BrainCircuit className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-indigo-900">
              Simulation Enabled
            </h3>
            <p className="text-sm text-indigo-700">
              Changes made here will not affect live operations until applied.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Planning Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Waveline</CardTitle>
              <CardDescription>Drag and drop to re-prioritize.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {waves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded bg-slate-50">
                  No active waves. Create one to start.
                </div>
              ) : (
                waves.map((wave) => (
                  <div
                    key={wave.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        W
                      </div>
                      <div>
                        <div className="font-semibold">{wave.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span>{wave.waveNumber}</span>
                          <span>
                            • {new Date(wave.createdAt).toLocaleTimeString()}
                          </span>
                          <span>• {wave.totalOrders} Orders</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 flex-1 justify-end">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{Number(wave.progress)}%</span>
                        </div>
                        <Progress
                          value={Number(wave.progress)}
                          className="h-2"
                        />
                      </div>

                      <Badge
                        variant={
                          wave.status === "COMPLETED"
                            ? "default"
                            : wave.status === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {wave.status}
                      </Badge>

                      <div className="hidden group-hover:flex gap-2">
                        <Button size="icon" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <BrainCircuit className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reco.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-3 rounded shadow-sm border text-sm"
                >
                  <div className="font-semibold flex justify-between">
                    {rec.zone}
                    <Badge
                      variant="outline"
                      className={
                        rec.action === "ADD_LABOR"
                          ? "text-green-600 bg-green-50"
                          : "text-amber-600 bg-amber-50"
                      }
                    >
                      {rec.action.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground">{rec.reason}</p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-indigo-100">
                <h4 className="font-semibold text-sm mb-2 text-indigo-900">
                  Predicted Congestion
                </h4>
                <div className="bg-white p-3 rounded border flex items-center justify-between">
                  <div className="text-sm">Pack Station 4</div>
                  <div className="text-xs text-red-500 font-medium flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> High Risk (14:00)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Labor Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span>Picking (Zone A)</span>
                <span className="font-bold">8 / 10</span>
              </div>
              <Progress value={80} className="h-2 bg-slate-100" />

              <div className="flex justify-between items-center text-sm">
                <span>Packing</span>
                <span className="font-bold">4 / 6</span>
              </div>
              <Progress value={66} className="h-2 bg-slate-100" />

              <div className="flex justify-between items-center text-sm">
                <span>Receiving</span>
                <span className="font-bold">12 / 15</span>
              </div>
              <Progress value={85} className="h-2 bg-slate-100" />
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full text-xs">
                View detailed labor map &rarr;
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
