"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface DeliveryRun {
  id: string;
  runNumber?: string;
  routeName?: string;
  driverName?: string;
  vehicleRegistration?: string;
  totalStops: number;
  completedStops: number;
  status: string;
  startTime?: string;
  endTime?: string;
}

interface DeliveryStop {
  id: string;
  stopSequence: number;
  customerName?: string;
  addressLine1?: string;
  deliveryStatus: string;
  actualArrival?: string;
  signedBy?: string;
}

const RUN_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};
const STOP_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  ARRIVED: "default",
  DELIVERED: "outline",
  FAILED: "destructive",
};

const pct = (run: DeliveryRun) =>
  run.totalStops > 0
    ? Math.round((run.completedStops / run.totalStops) * 100)
    : 0;

export default function DeliveryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: runsData, isLoading: runsLoading } = useQuery<{
    routes: DeliveryRun[];
  }>({
    queryKey: ["delivery-runs"],
    queryFn: async () => {
      const res = await fetch("/api/delivery/runs");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const { data: stopsData, isLoading: stopsLoading } = useQuery<{
    stops: DeliveryStop[];
  }>({
    queryKey: ["delivery-stops", selectedRunId],
    queryFn: async () => {
      const res = await fetch(`/api/delivery/my-run?runId=${selectedRunId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedRunId,
  });

  const startRunMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/delivery/runs/${id}/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-runs"] });
      toast({ title: "Run started" });
    },
    onError: () =>
      toast({ title: "Failed to start run", variant: "destructive" }),
  });

  const arriveStopMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/delivery/stops/${id}/arrive`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-stops", selectedRunId] });
      toast({ title: "Arrived at stop" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const completeStopMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/delivery/stops/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-stops", selectedRunId] });
      qc.invalidateQueries({ queryKey: ["delivery-runs"] });
      toast({ title: "Stop delivered" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const failStopMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/delivery/stops/${id}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Unable to deliver" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery-stops", selectedRunId] });
      qc.invalidateQueries({ queryKey: ["delivery-runs"] });
      toast({ title: "Stop marked failed" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const runs = runsData?.routes ?? [];
  const stops = stopsData?.stops ?? [];
  const selectedRun = runs.find((r) => r.id === selectedRunId);

  const totalRuns = runs.length;
  const inProgress = runs.filter((r) => r.status === "IN_PROGRESS").length;
  const completed = runs.filter((r) => r.status === "COMPLETED").length;
  const totalStops = runs.reduce((s, r) => s + r.totalStops, 0);
  const completedStops = runs.reduce((s, r) => s + r.completedStops, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="h-6 w-6 text-indigo-600" />
          Delivery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live delivery runs, route progress and stop management
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Runs",
            value: totalRuns,
            icon: Truck,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            title: "In Progress",
            value: inProgress,
            icon: Clock,
            color: "text-yellow-500",
            bg: "bg-yellow-50",
          },
          {
            title: "Completed",
            value: completed,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-50",
          },
          {
            title: "Stops Done",
            value: `${completedStops}/${totalStops}`,
            icon: MapPin,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {runsLoading ? "—" : kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delivery Runs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {runsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No delivery runs today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    runs.map((run) => (
                      <TableRow
                        key={run.id}
                        className={`hover:bg-muted/50 cursor-pointer ${selectedRunId === run.id ? "bg-muted" : ""}`}
                        onClick={() =>
                          setSelectedRunId(
                            run.id === selectedRunId ? null : run.id,
                          )
                        }
                      >
                        <TableCell className="font-mono font-semibold text-sm">
                          {run.runNumber ?? run.routeName ?? run.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {run.driverName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                RUN_STATUS_VARIANT[run.status] ?? "secondary"
                              }
                            >
                              {run.status.replace(/_/g, " ")}
                            </Badge>
                            {run.status === "SCHEDULED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRunMutation.mutate(run.id);
                                }}
                              >
                                <Play className="h-3 w-3 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct(run)} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {run.completedStops}/{run.totalStops}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedRun
                ? `Stops — ${selectedRun.runNumber ?? selectedRun.routeName ?? "Run"}`
                : "Stops"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedRunId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <ChevronRight className="h-8 w-8 opacity-30" />
                <p className="text-sm">Select a run to view stops</p>
              </div>
            ) : stopsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stops.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No stops for this run.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stops.map((stop) => (
                      <TableRow key={stop.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">
                          {stop.stopSequence}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {stop.customerName ?? "—"}
                          </p>
                          {stop.addressLine1 && (
                            <p className="text-xs text-muted-foreground">
                              {stop.addressLine1}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              STOP_STATUS_VARIANT[stop.deliveryStatus] ??
                              "secondary"
                            }
                          >
                            {stop.deliveryStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {stop.actualArrival
                            ? new Date(stop.actualArrival).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {stop.deliveryStatus === "PENDING" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Arrived"
                                onClick={() =>
                                  arriveStopMutation.mutate(stop.id)
                                }
                              >
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {stop.deliveryStatus === "ARRIVED" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="Complete"
                                  onClick={() =>
                                    completeStopMutation.mutate(stop.id)
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="Fail"
                                  onClick={() =>
                                    failStopMutation.mutate(stop.id)
                                  }
                                >
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
