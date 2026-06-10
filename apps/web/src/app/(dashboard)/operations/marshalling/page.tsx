"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
  Clock,
  MoreVertical,
  Plus,
  GitMerge,
  ArrowRight,
  Box,
  CheckCircle2,
  AlertTriangle,
  History,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Camera, AlertOctagon, Share2, Printer } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LoadSheet {
  id: string;
  loadSheetNumber: string;
  carrierName: string;
  shipmentDate: string; // Used as fallback scheduled date
  scheduledDeparture?: string;
  startedLoadingAt?: string;
  finishedLoadingAt?: string;
  actualDeparture?: string;
  delayReason?: string;
  status: string;
  totalWeight: number;
  totalContainers: number;
  customer?: { name: string };
  bayDoor?: { name: string };
  vehicleType?: {
    name: string;
    length: number;
    maxVolume: number;
    maxWeight: number;
  };
}

interface StagingLane {
  id: string;
  status: "AVAILABLE" | "OCCUPIED" | "BLOCKED";
  loadSheetId?: string;
}

export default function MarshallingBoard() {
  const queryClient = useQueryClient();
  const [departDialogOpen, setDepartDialogOpen] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<LoadSheet | null>(null);
  const [delayReason, setDelayReason] = useState("");
  const [safetyCleared, setSafetyCleared] = useState(false);

  // Incident Form State
  const [incidentType, setIncidentType] = useState<string>("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<string>("MEDIUM");

  const { data, isLoading } = useQuery<{
    loadSheets: LoadSheet[];
    history: LoadSheet[];
    stagingLanes: StagingLane[];
  }>({
    queryKey: ["ops-marshalling"],
    queryFn: async () => {
      const res = await fetch("/api/operations/marshalling");
      if (!res.ok) throw new Error("Failed to fetch marshalling data");
      return res.json();
    },
  });

  const handlePrintLoadSheet = async (sheetObj: LoadSheet) => {
    try {
      toast.message(`Generating PDF for ${sheetObj.loadSheetNumber}...`);

      // Fetch details
      const res = await fetch(`/api/operations/loadsheet/${sheetObj.id}`);
      if (!res.ok) throw new Error("Could not fetch details");

      const fullSheet = await res.json();
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // blue-900
      doc.text("LogiVox WMS - Load Sheet", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Load ID: ${fullSheet.loadSheetNumber}`, 14, 34);
      doc.text(`Carrier: ${fullSheet.carrierName || "N/A"}`, 14, 40);
      doc.text(`Status: ${fullSheet.status}`, 14, 46);

      // Details
      let yPos = 55;
      doc.text(
        `Scheduled Departure: ${fullSheet.scheduledDeparture ? new Date(fullSheet.scheduledDeparture).toLocaleString() : "TBD"}`,
        14,
        yPos,
      );
      yPos += 6;
      doc.text(
        `Vehicle Type: ${fullSheet.vehicleType?.name || "Standard"}`,
        14,
        yPos,
      );
      yPos += 6;
      doc.text(
        `Assigned Bay Door: ${fullSheet.bayDoor?.name || "Unassigned"}`,
        14,
        yPos,
      );

      yPos += 14;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Manifest Items", 14, yPos);

      // Table of Containers
      const tableBody =
        fullSheet.containers?.map((c: any) => [
          c.containerNumber || "N/A",
          c.containerType,
          c.status,
          c.containerItems?.length || 0,
          (c.weight || 0) + " kg",
        ]) || [];

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Container ID", "Type", "Status", "Items", "Weight"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138] },
      });

      doc.save(`LoadSheet_${fullSheet.loadSheetNumber}.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  const reportIncidentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/operations/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: incidentType,
          description: incidentDesc,
          severity: incidentSeverity,
          loadSheetId: selectedSheet?.id,
          location: selectedSheet?.bayDoor?.name || "Unassigned",
        }),
      });
      if (!res.ok) throw new Error("Failed to report incident");
      return res.json();
    },
    onSuccess: () => {
      setIncidentDialogOpen(false);
      setIncidentType("");
      setIncidentDesc("");
      toast.success("Incident Reported Successfully");
    },
  });

  const createLoadSheetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/operations/marshalling", {
        method: "POST",
        body: JSON.stringify({
          carrierName: "FedEx Express",
          stagingLane: "S3",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-marshalling"] });
      toast.success("Load Sheet Generated");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => {
      const res = await fetch("/api/operations/marshalling", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loadSheetId: id, status, delayReason: reason }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-marshalling"] });
      setDepartDialogOpen(false);
      toast.success("Status Updated");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const loadSheets = data?.loadSheets || [];
  const history = data?.history || [];
  const lanes = data?.stagingLanes || [];

  // Calculate KPIs
  const onTimeDepartures = history.filter((h) => {
    if (!h.actualDeparture || !h.scheduledDeparture) return true; // Assume on time if data missing
    return new Date(h.actualDeparture) <= new Date(h.scheduledDeparture);
  }).length;
  const onTimeRate =
    history.length > 0
      ? Math.round((onTimeDepartures / history.length) * 100)
      : 100;

  const avgLoadTime =
    history.reduce((acc, curr) => {
      if (!curr.startedLoadingAt || !curr.finishedLoadingAt) return acc;
      return (
        acc +
        (new Date(curr.finishedLoadingAt).getTime() -
          new Date(curr.startedLoadingAt).getTime())
      );
    }, 0) /
    (history.length || 1) /
    (1000 * 60); // in minutes

  // Find a suitable status display - check variance against schedule
  const getStatusDisplay = (sheet: LoadSheet) => {
    const scheduled = sheet.scheduledDeparture
      ? new Date(sheet.scheduledDeparture)
      : null;
    const isLate = scheduled && new Date() > scheduled;

    if (sheet.status === "LOADING") {
      return (
        <Badge className={isLate ? "bg-amber-600" : "bg-green-600"}>
          {isLate ? "Late Loading" : "Loading"}
        </Badge>
      );
    }
    return <Badge variant="secondary">{sheet.status}</Badge>;
  };

  return (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Marshalling & Load Planning
          </h1>
          <p className="text-muted-foreground">
            Manage staging lanes, load sheets, and outbound dispatch.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => createLoadSheetMutation.mutate()}
            disabled={createLoadSheetMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Load Sheet
          </Button>
        </div>
      </div>

      {/* 1. KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              On-Time Departure
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${onTimeRate < 95 ? "text-amber-600" : "text-green-600"}`}
            >
              {onTimeRate}%
            </div>
            <p className="text-xs text-muted-foreground">Target: 95%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgLoadTime)}m</div>
            <p className="text-xs text-muted-foreground">
              From scan start to seal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loads</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadSheets.filter((l) => l.status === "LOADING").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadSheets.length} pending staging
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Late Departures
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {history.length - onTimeDepartures}
            </div>
            <p className="text-xs text-muted-foreground">
              Require root cause analysis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Loads</TabsTrigger>
          <TabsTrigger value="history">History & Reports</TabsTrigger>
          <TabsTrigger value="map">Floor Map</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loadSheets.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-lg">
              No active load sheets found. Create one to begin.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadSheets.map((sheet) => (
                <Card
                  key={sheet.id}
                  className={`hover:shadow-md transition-shadow border-l-4 ${sheet.status === "LOADING" ? "border-l-green-500" : "border-l-slate-200"}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          {sheet.loadSheetNumber}
                        </CardTitle>
                        <CardDescription>{sheet.carrierName}</CardDescription>
                      </div>
                      {getStatusDisplay(sheet)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-4">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {sheet.scheduledDeparture
                          ? new Date(sheet.scheduledDeparture).toLocaleString()
                          : "TBD"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {sheet.bayDoor?.name || "Unassigned"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                      <Truck className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-xs">
                        {sheet.vehicleType?.name || "Standard 53ft"}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span>Verification Progress</span>
                        <span>{sheet.status === "LOADING" ? "45%" : "0%"}</span>
                      </div>
                      <Progress
                        value={sheet.status === "LOADING" ? 45 : 0}
                        className="h-1.5"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 pt-4 flex gap-2">
                    {/* PDF Download */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      title="Download PDF Load Sheet"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintLoadSheet(sheet);
                      }}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      title="Handover API Data"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `/api/operations/handover?loadSheetId=${sheet.id}`,
                          "_blank",
                        );
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      title="Report Quality Issue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSheet(sheet);
                        setIncidentDialogOpen(true);
                      }}
                    >
                      <AlertOctagon className="h-4 w-4" />
                    </Button>
                    {sheet.status === "LOADING" ? (
                      <Button
                        size="sm"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={() => {
                          setSelectedSheet(sheet);
                          setDepartDialogOpen(true);
                        }}
                      >
                        Depart <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: sheet.id,
                            status: "LOADING",
                          })
                        }
                      >
                        Start Loading
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Departed Load Sheets</CardTitle>
              <CardDescription>
                Recent history and delay analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-muted-foreground">
                    No historical data available.
                  </p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {h.loadSheetNumber}
                          <Badge variant="outline">{h.carrierName}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Scheduled:{" "}
                          {h.scheduledDeparture
                            ? new Date(h.scheduledDeparture).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        {h.delayReason ? (
                          <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Late:{" "}
                            {h.delayReason}
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> On Time
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Departed:{" "}
                          {h.actualDeparture
                            ? new Date(h.actualDeparture).toLocaleTimeString()
                            : "Unknown"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          {/* Staging Map Visualization */}
          <Card className="bg-slate-50 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="h-5 w-5" /> Staging Lane Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {["S1", "S2", "S3", "S4"].map((laneId) => {
                  const lane = lanes.find((l) => l.id === laneId) || {
                    id: laneId,
                    status: "AVAILABLE",
                  };
                  const occupiedSheet = loadSheets.find(
                    (ls) => ls.id === lane.loadSheetId,
                  );

                  return (
                    <div
                      key={laneId}
                      className={`
                                    h-32 border-2 rounded-lg p-4 flex flex-col justify-between transition-all
                                    ${lane.status === "OCCUPIED" ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-slate-300"}
                                `}
                    >
                      <div className="flex justify-between font-bold text-lg text-slate-700">
                        {laneId}
                        <Badge
                          variant={
                            lane.status === "OCCUPIED" ? "secondary" : "outline"
                          }
                        >
                          {lane.status}
                        </Badge>
                      </div>

                      {occupiedSheet ? (
                        <div className="text-sm">
                          <div className="font-semibold text-blue-800">
                            {occupiedSheet.loadSheetNumber}
                          </div>
                          <div className="text-xs text-blue-600 truncate">
                            {occupiedSheet.carrierName}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 text-sm">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Depart Dialog */}
      <Dialog open={departDialogOpen} onOpenChange={setDepartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Inspection & Departure</DialogTitle>
            <DialogDescription>
              Review safety check and confirm departure for{" "}
              {selectedSheet?.loadSheetNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Digital "Green Light" Safety Check */}
            <div className="grid gap-2">
              <Label>Safety & Quality Status</Label>
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm flex gap-2 items-start opacity-70">
                <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <div className="font-semibold text-red-900">
                    Pending Safety Verification
                  </div>
                  <p className="text-red-700 text-xs">
                    Verify load securement, seal integrity, and driver
                    clearance.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Schedule Variance</Label>
              {selectedSheet?.scheduledDeparture &&
              new Date() > new Date(selectedSheet.scheduledDeparture) ? (
                <div className="p-2 bg-red-50 text-red-800 text-sm rounded border border-red-200 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Departure is late by{" "}
                  {Math.round(
                    (new Date().getTime() -
                      new Date(selectedSheet.scheduledDeparture).getTime()) /
                      60000,
                  )}{" "}
                  minutes.
                </div>
              ) : (
                <div className="p-2 bg-green-50 text-green-800 text-sm rounded border border-green-200 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Departure is on time.
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Delay Reason (If applicable)</Label>
              <Textarea
                id="reason"
                placeholder="E.g., Carrier late, Paperwork issue, Inventory shortage..."
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
              />
            </div>

            {/* Safety Clearing - The "Green Light" */}
            <div className="flex items-start space-x-2 pt-2 border-t">
              <Checkbox
                id="safety"
                checked={safetyCleared}
                // @ts-expect-error - Checkbox types from Radix sometimes differ
                onCheckedChange={(c) => setSafetyCleared(c === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="safety" className="text-sm font-bold">
                  I confirm this load is safe and compliant.
                </Label>
                <p className="text-xs text-muted-foreground">
                  Digital Signature: Releasing this load certifies all safety
                  checks are passed.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepartDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateStatusMutation.mutate({
                  id: selectedSheet!.id,
                  status: "DEPARTED",
                  reason: delayReason,
                })
              }
              disabled={!safetyCleared || updateStatusMutation.isPending}
              className={safetyCleared ? "bg-green-700 hover:bg-green-800" : ""}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {safetyCleared ? "Authorize & Depart" : "Pending Safety Check"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Quality Incident</DialogTitle>
            <DialogDescription>
              Log an issue for Load {selectedSheet?.loadSheetNumber}. This will
              be flagged for review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Issue Type</Label>
              <Select onValueChange={setIncidentType} value={incidentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type of issue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Compliance</SelectLabel>
                    <SelectItem value="Safety">
                      Safety / Unsafe Loading
                    </SelectItem>
                    <SelectItem value="Labeling">Labeling Error</SelectItem>
                    <SelectItem value="Documentation">
                      Missing Paperwork
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Execution</SelectLabel>
                    <SelectItem value="Damaged">Damaged Goods</SelectItem>
                    <SelectItem value="Driver">Driver Missed Window</SelectItem>
                    <SelectItem value="Inventory">
                      Inventory Shortage
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Severity</Label>
              <div className="flex gap-2">
                {["LOW", "MEDIUM", "HIGH"].map((s) => (
                  <Button
                    key={s}
                    variant={incidentSeverity === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIncidentSeverity(s)}
                    className={
                      incidentSeverity === s
                        ? s === "HIGH"
                          ? "bg-red-600 hover:bg-red-700"
                          : s === "MEDIUM"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what happened..."
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground border p-2 rounded bg-slate-50 cursor-pointer hover:bg-slate-100">
              <Camera className="h-4 w-4" />
              <span>Attach Photo Evidence (Optional)</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIncidentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => reportIncidentMutation.mutate()}
              disabled={
                !incidentType ||
                !incidentDesc ||
                reportIncidentMutation.isPending
              }
            >
              {reportIncidentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
