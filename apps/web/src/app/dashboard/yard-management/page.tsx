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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ParkingSquare,
  RefreshCw,
  Shield,
  ShieldCheck,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GateSummary {
  totalToday: number;
  inbound: number;
  outbound: number;
  avgCheckInVarianceMinutes: number;
  securityChecksPass: number;
  securityChecksFail: number;
}

interface GateEntry {
  id: string;
  entryNumber: string;
  entryType: string;
  direction: "INBOUND" | "OUTBOUND";
  gateNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  licensePlate: string;
  trailerNumber?: string;
  driverName: string;
  carrierName?: string;
  scheduledTime?: string;
  actualTime: string;
  securityCheckPassed: boolean;
  securityNotes?: string;
  appointmentNumber?: string;
  appointmentStatus?: string;
}

interface YardLocation {
  id: string;
  locationCode: string;
  locationName: string;
  locationType: string;
  isOccupied: boolean;
  capacity: number;
  activeAppointment?: {
    appointmentNumber: string;
    appointmentType: string;
    status: string;
    carrierName?: string;
    vehicleNumber?: string;
    trailerNumber?: string;
  } | null;
}

interface ShunterTask {
  id: string;
  type: "PULL_TO_DOCK" | "SPOT_TRAILER";
  priority: "URGENT" | "NORMAL";
  appointmentId: string;
  appointmentNumber: string;
  appointmentType: string;
  carrier?: string;
  vehicleNumber?: string;
  trailerNumber?: string;
  fromLocation: string;
  toLocation: string;
  scheduledStart: string;
  status: string;
}

interface ShunterSummary {
  totalYardLocations: number;
  occupiedSpots: number;
  availableSpots: number;
  pendingShunterTasks: number;
  urgentTasks: number;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_GATE_SUMMARY: GateSummary = {
  totalToday: 47,
  inbound: 29,
  outbound: 18,
  avgCheckInVarianceMinutes: 6,
  securityChecksPass: 45,
  securityChecksFail: 2,
};

const DEMO_ENTRIES: GateEntry[] = [
  { id: "1", entryNumber: "GATE-A1B2C", entryType: "DELIVERY", direction: "INBOUND", gateNumber: "G1", vehicleType: "TRUCK", vehicleNumber: "TRK-441", licensePlate: "ABC-1234", trailerNumber: "TRL-7721", driverName: "James Hawkins", carrierName: "Swift Freight", scheduledTime: new Date(Date.now() - 8 * 60000).toISOString(), actualTime: new Date(Date.now() - 5 * 60000).toISOString(), securityCheckPassed: true, appointmentNumber: "APT-001", appointmentStatus: "CHECKED_IN" },
  { id: "2", entryNumber: "GATE-D3E4F", entryType: "PICKUP", direction: "OUTBOUND", gateNumber: "G2", vehicleType: "TRUCK", vehicleNumber: "TRK-882", licensePlate: "XYZ-5678", driverName: "Maria Santos", carrierName: "FedEx Freight", actualTime: new Date(Date.now() - 22 * 60000).toISOString(), securityCheckPassed: true, appointmentNumber: "APT-002", appointmentStatus: "IN_PROGRESS" },
  { id: "3", entryNumber: "GATE-G5H6I", entryType: "DELIVERY", direction: "INBOUND", gateNumber: "G1", vehicleType: "VAN", vehicleNumber: "VAN-119", licensePlate: "DEF-9012", driverName: "Tom Bradley", carrierName: "UPS Supply Chain", actualTime: new Date(Date.now() - 45 * 60000).toISOString(), securityCheckPassed: false, securityNotes: "Driver ID mismatch — supervisor alerted" },
  { id: "4", entryNumber: "GATE-J7K8L", entryType: "DELIVERY", direction: "INBOUND", gateNumber: "G3", vehicleType: "TRUCK", vehicleNumber: "TRK-334", licensePlate: "GHI-3456", trailerNumber: "TRL-4409", driverName: "Priya Nair", carrierName: "DHL Supply", scheduledTime: new Date(Date.now() - 60 * 60000).toISOString(), actualTime: new Date(Date.now() - 58 * 60000).toISOString(), securityCheckPassed: true, appointmentNumber: "APT-004", appointmentStatus: "COMPLETED" },
  { id: "5", entryNumber: "GATE-M9N0O", entryType: "PICKUP", direction: "OUTBOUND", gateNumber: "G2", vehicleType: "TRUCK", vehicleNumber: "TRK-775", licensePlate: "JKL-7890", trailerNumber: "TRL-8832", driverName: "Carlos Ortiz", carrierName: "Walmart Fleet", actualTime: new Date(Date.now() - 90 * 60000).toISOString(), securityCheckPassed: true, appointmentNumber: "APT-005", appointmentStatus: "COMPLETED" },
];

const DEMO_YARD_LOCATIONS: YardLocation[] = [
  { id: "L1", locationCode: "DOC-01", locationName: "Dock Door 1", locationType: "DOCK_DOOR", isOccupied: true, capacity: 1, activeAppointment: { appointmentNumber: "APT-001", appointmentType: "INBOUND_RECEIPT", status: "IN_PROGRESS", carrierName: "Swift Freight", vehicleNumber: "TRK-441", trailerNumber: "TRL-7721" } },
  { id: "L2", locationCode: "DOC-02", locationName: "Dock Door 2", locationType: "DOCK_DOOR", isOccupied: true, capacity: 1, activeAppointment: { appointmentNumber: "APT-002", appointmentType: "OUTBOUND_SHIPMENT", status: "IN_PROGRESS", carrierName: "FedEx Freight", vehicleNumber: "TRK-882" } },
  { id: "L3", locationCode: "DOC-03", locationName: "Dock Door 3", locationType: "DOCK_DOOR", isOccupied: false, capacity: 1, activeAppointment: null },
  { id: "L4", locationCode: "DOC-04", locationName: "Dock Door 4", locationType: "DOCK_DOOR", isOccupied: false, capacity: 1, activeAppointment: null },
  { id: "L5", locationCode: "PRK-A1", locationName: "Parking Bay A1", locationType: "PARKING_SPOT", isOccupied: true, capacity: 1, activeAppointment: { appointmentNumber: "APT-006", appointmentType: "INBOUND_RECEIPT", status: "CHECKED_IN", carrierName: "DHL Supply", trailerNumber: "TRL-3301" } },
  { id: "L6", locationCode: "PRK-A2", locationName: "Parking Bay A2", locationType: "PARKING_SPOT", isOccupied: true, capacity: 1, activeAppointment: { appointmentNumber: "APT-007", appointmentType: "INBOUND_RECEIPT", status: "CHECKED_IN", carrierName: "UPS Freight", trailerNumber: "TRL-5512" } },
  { id: "L7", locationCode: "PRK-A3", locationName: "Parking Bay A3", locationType: "PARKING_SPOT", isOccupied: false, capacity: 1, activeAppointment: null },
  { id: "L8", locationCode: "PRK-B1", locationName: "Parking Bay B1", locationType: "PARKING_SPOT", isOccupied: false, capacity: 1, activeAppointment: null },
  { id: "L9", locationCode: "FUEL-1", locationName: "Fuel Station 1", locationType: "STAGING", isOccupied: false, capacity: 2, activeAppointment: null },
  { id: "L10", locationCode: "STAGE-1", locationName: "Staging Area 1", locationType: "STAGING", isOccupied: true, capacity: 4, activeAppointment: { appointmentNumber: "APT-008", appointmentType: "CROSS_DOCK", status: "SCHEDULED", carrierName: "Walmart Fleet" } },
];

const DEMO_SHUNTER_TASKS: ShunterTask[] = [
  { id: "PULL-001", type: "PULL_TO_DOCK", priority: "URGENT", appointmentId: "APT-006", appointmentNumber: "APT-006", appointmentType: "INBOUND_RECEIPT", carrier: "DHL Supply", trailerNumber: "TRL-3301", fromLocation: "PRK-A1", toLocation: "DOC-03", scheduledStart: new Date(Date.now() + 8 * 60000).toISOString(), status: "PENDING" },
  { id: "SPOT-002", type: "SPOT_TRAILER", priority: "NORMAL", appointmentId: "APT-004", appointmentNumber: "APT-004", appointmentType: "INBOUND_RECEIPT", carrier: "DHL Supply", trailerNumber: "TRL-4409", fromLocation: "DOC-04", toLocation: "PRK-A3", scheduledStart: new Date(Date.now() + 25 * 60000).toISOString(), status: "PENDING" },
  { id: "PULL-003", type: "PULL_TO_DOCK", priority: "NORMAL", appointmentId: "APT-007", appointmentNumber: "APT-007", appointmentType: "INBOUND_RECEIPT", carrier: "UPS Freight", trailerNumber: "TRL-5512", fromLocation: "PRK-A2", toLocation: "DOC-04", scheduledStart: new Date(Date.now() + 45 * 60000).toISOString(), status: "PENDING" },
];

const DEMO_SHUNTER_SUMMARY: ShunterSummary = {
  totalYardLocations: DEMO_YARD_LOCATIONS.length,
  occupiedSpots: DEMO_YARD_LOCATIONS.filter((l) => l.isOccupied).length,
  availableSpots: DEMO_YARD_LOCATIONS.filter((l) => !l.isOccupied).length,
  pendingShunterTasks: DEMO_SHUNTER_TASKS.length,
  urgentTasks: DEMO_SHUNTER_TASKS.filter((t) => t.priority === "URGENT").length,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minsAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function minsUntil(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (mins <= 0) return "NOW";
  if (mins < 60) return `in ${mins}m`;
  return `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const LOCATION_TYPE_COLOR: Record<string, string> = {
  DOCK_DOOR: "border-blue-300 bg-blue-50",
  PARKING_SPOT: "border-gray-300 bg-gray-50",
  STAGING: "border-purple-300 bg-purple-50",
};

const LOCATION_TYPE_LABEL: Record<string, string> = {
  DOCK_DOOR: "Dock",
  PARKING_SPOT: "Parking",
  STAGING: "Staging",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function YardManagementPage() {
  const { toast } = useToast();
  const [gateSummary, setGateSummary] = useState<GateSummary | null>(null);
  const [gateEntries, setGateEntries] = useState<GateEntry[]>([]);
  const [yardLocations, setYardLocations] = useState<YardLocation[]>([]);
  const [shunterTasks, setShunterTasks] = useState<ShunterTask[]>([]);
  const [shunterSummary, setShunterSummary] = useState<ShunterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dispatching, setDispatching] = useState<string | null>(null);

  // Gate check-in form
  const [gateForm, setGateForm] = useState({
    vehicleNumber: "",
    driverName: "",
    carrierName: "",
    licensePlate: "",
    trailerNumber: "",
    direction: "INBOUND",
    vehicleType: "TRUCK",
    gateNumber: "G1",
    securityCheckPassed: true,
  });
  const [gateDialogOpen, setGateDialogOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gateRes, shunterRes] = await Promise.all([
        fetch("/api/yard/gate-log"),
        fetch("/api/yard/shunter"),
      ]);
      if (gateRes.ok) {
        const g = await gateRes.json();
        setGateSummary(g.summary ?? null);
        setGateEntries(g.entries ?? []);
      }
      if (shunterRes.ok) {
        const s = await shunterRes.json();
        setShunterSummary(s.summary ?? null);
        setYardLocations(s.yardLocations ?? []);
        setShunterTasks(s.shunterTasks ?? []);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching yard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const dispatchShunter = async (task: ShunterTask, driverName = "Auto-Assigned") => {
    setDispatching(task.id);
    try {
      const res = await fetch("/api/yard/shunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: task.appointmentId,
          taskType: task.type,
          fromLocation: task.fromLocation,
          toLocation: task.toLocation,
          assignedTo: driverName,
        }),
      });
      if (res.ok) {
        toast({
          title: "Shunter Dispatched",
          description: `${task.type === "PULL_TO_DOCK" ? "Pull" : "Spot"} task for trailer ${task.trailerNumber} dispatched`,
        });
        fetchData();
      }
    } catch {
      toast({ title: "Dispatch failed", description: "Please try again", variant: "destructive" });
    } finally {
      setDispatching(null);
    }
  };

  const checkInVehicle = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/yard/gate-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gateForm),
      });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Vehicle Checked In",
          description: `${data.entryNumber}${data.autoLinkedAppointment ? " — auto-linked to appointment" : ""}`,
        });
        setGateDialogOpen(false);
        setGateForm({ vehicleNumber: "", driverName: "", carrierName: "", licensePlate: "", trailerNumber: "", direction: "INBOUND", vehicleType: "TRUCK", gateNumber: "G1", securityCheckPassed: true });
        fetchData();
      }
    } catch {
      toast({ title: "Check-in failed", description: "Please try again", variant: "destructive" });
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 20_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const dGateSummary = gateSummary ?? DEMO_GATE_SUMMARY;
  const dEntries = gateEntries.length > 0 ? gateEntries : DEMO_ENTRIES;
  const dLocations = yardLocations.length > 0 ? yardLocations : DEMO_YARD_LOCATIONS;
  const dTasks = shunterTasks.length > 0 ? shunterTasks : DEMO_SHUNTER_TASKS;
  const dShunterSummary = shunterSummary ?? DEMO_SHUNTER_SUMMARY;

  const dockDoors = dLocations.filter((l) => l.locationType === "DOCK_DOOR");
  const parkingSpots = dLocations.filter((l) => l.locationType === "PARKING_SPOT");
  const stagingAreas = dLocations.filter((l) => l.locationType === "STAGING");

  const occupancyPct = Math.round((dShunterSummary.occupiedSpots / Math.max(dShunterSummary.totalYardLocations, 1)) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-500" />
            Yard Management Control Tower
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gate log · Dock allocation · Shunter dispatch · Real-time yard visibility
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">· {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={gateDialogOpen} onOpenChange={setGateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowDownToLine className="h-4 w-4 mr-1" />
                Gate Check-In
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vehicle Gate Check-In</DialogTitle>
                <DialogDescription>Registers vehicle entry/exit and auto-links to any matching appointment</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2">
                  <Label>Vehicle Number *</Label>
                  <Input placeholder="TRK-000" value={gateForm.vehicleNumber} onChange={(e) => setGateForm((f) => ({ ...f, vehicleNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Driver Name *</Label>
                  <Input placeholder="Full name" value={gateForm.driverName} onChange={(e) => setGateForm((f) => ({ ...f, driverName: e.target.value }))} />
                </div>
                <div>
                  <Label>License Plate</Label>
                  <Input placeholder="ABC-1234" value={gateForm.licensePlate} onChange={(e) => setGateForm((f) => ({ ...f, licensePlate: e.target.value }))} />
                </div>
                <div>
                  <Label>Carrier / Company</Label>
                  <Input placeholder="Carrier name" value={gateForm.carrierName} onChange={(e) => setGateForm((f) => ({ ...f, carrierName: e.target.value }))} />
                </div>
                <div>
                  <Label>Trailer Number</Label>
                  <Input placeholder="TRL-0000" value={gateForm.trailerNumber} onChange={(e) => setGateForm((f) => ({ ...f, trailerNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Direction</Label>
                  <Select value={gateForm.direction} onValueChange={(v) => setGateForm((f) => ({ ...f, direction: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <Select value={gateForm.vehicleType} onValueChange={(v) => setGateForm((f) => ({ ...f, vehicleType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRUCK">Truck</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="CAR">Car</SelectItem>
                      <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gate</Label>
                  <Select value={gateForm.gateNumber} onValueChange={(v) => setGateForm((f) => ({ ...f, gateNumber: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G1">Gate 1</SelectItem>
                      <SelectItem value="G2">Gate 2</SelectItem>
                      <SelectItem value="G3">Gate 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <input type="checkbox" id="security" checked={gateForm.securityCheckPassed} onChange={(e) => setGateForm((f) => ({ ...f, securityCheckPassed: e.target.checked }))} className="w-4 h-4" />
                  <Label htmlFor="security" className="cursor-pointer">Security check passed</Label>
                </div>
              </div>
              <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={checkingIn || (!gateForm.vehicleNumber && !gateForm.driverName)} onClick={checkInVehicle}>
                {checkingIn ? "Checking in…" : "Check In Vehicle"}
              </Button>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh((v) => !v)} className={autoRefresh ? "border-green-400 text-green-700" : ""}>
            <Activity className="h-4 w-4 mr-1" />
            {autoRefresh ? "Live (20s)" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Vehicles Today</p>
            <p className="text-3xl font-bold">{dGateSummary.totalToday}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600 flex items-center gap-0.5"><ArrowDownToLine className="h-3 w-3" />{dGateSummary.inbound}</span>
              <span className="text-blue-600 flex items-center gap-0.5"><ArrowUpFromLine className="h-3 w-3" />{dGateSummary.outbound}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Avg Check-In Variance</p>
            <p className={`text-3xl font-bold ${dGateSummary.avgCheckInVarianceMinutes > 15 ? "text-red-600" : dGateSummary.avgCheckInVarianceMinutes > 5 ? "text-yellow-600" : "text-green-600"}`}>
              {dGateSummary.avgCheckInVarianceMinutes}m
            </p>
            <p className="text-xs text-gray-400 mt-0.5">vs scheduled time</p>
          </CardContent>
        </Card>
        <Card className={dGateSummary.securityChecksFail > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Security Pass</p>
            <p className={`text-3xl font-bold ${dGateSummary.securityChecksFail > 0 ? "text-red-600" : "text-green-600"}`}>
              {dGateSummary.securityChecksPass}
            </p>
            {dGateSummary.securityChecksFail > 0 && <p className="text-xs text-red-500">{dGateSummary.securityChecksFail} failed</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Yard Occupancy</p>
            <p className="text-3xl font-bold text-purple-600">{occupancyPct}%</p>
            <Progress value={occupancyPct} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card className={dShunterSummary.urgentTasks > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Shunter Tasks</p>
            <p className={`text-3xl font-bold ${dShunterSummary.urgentTasks > 0 ? "text-orange-600" : ""}`}>{dShunterSummary.pendingShunterTasks}</p>
            {dShunterSummary.urgentTasks > 0 && <p className="text-xs text-orange-600">{dShunterSummary.urgentTasks} urgent</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Available Spots</p>
            <p className="text-3xl font-bold text-teal-600">{dShunterSummary.availableSpots}</p>
            <p className="text-xs text-gray-400 mt-0.5">of {dShunterSummary.totalYardLocations} total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="yard-map">
        <TabsList>
          <TabsTrigger value="yard-map">Yard Map</TabsTrigger>
          <TabsTrigger value="shunter">
            Shunter Dispatch
            {dShunterSummary.urgentTasks > 0 && <Badge variant="destructive" className="ml-1.5 text-xs">{dShunterSummary.urgentTasks}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="gate-log">Gate Log</TabsTrigger>
        </TabsList>

        {/* ── Yard Map ── */}
        <TabsContent value="yard-map" className="space-y-4 mt-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: "Dock Door", color: "bg-blue-200 border-blue-300" },
              { label: "Parking", color: "bg-gray-200 border-gray-300" },
              { label: "Staging", color: "bg-purple-200 border-purple-300" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded border ${l.color}`} />
                <span className="text-gray-600">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border bg-white border-gray-200 flex items-center justify-center"><span className="text-green-500 text-xs">○</span></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border bg-white border-gray-200 flex items-center justify-center"><Truck className="w-2.5 h-2.5 text-gray-600" /></div>
              <span className="text-gray-600">Occupied</span>
            </div>
          </div>

          {/* Dock Doors */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Dock Doors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
              {dockDoors.map((loc) => (
                <div key={loc.id} className={`rounded-xl border-2 p-3 transition-all ${LOCATION_TYPE_COLOR[loc.locationType]} ${loc.isOccupied ? "opacity-100" : "opacity-60"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{loc.locationCode}</span>
                    {loc.isOccupied ? <Truck className="h-4 w-4 text-blue-600" /> : <span className="text-green-500 text-lg font-light">○</span>}
                  </div>
                  {loc.activeAppointment ? (
                    <>
                      <p className="text-xs font-medium truncate">{loc.activeAppointment.carrierName ?? "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{loc.activeAppointment.trailerNumber ?? loc.activeAppointment.vehicleNumber}</p>
                      <Badge className="mt-1 text-xs px-1.5 py-0" variant="outline">{loc.activeAppointment.status?.replace("_", " ")}</Badge>
                    </>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Available</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Parking Spots */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Parking Spots</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
              {parkingSpots.map((loc) => (
                <div key={loc.id} className={`rounded-xl border-2 p-3 transition-all ${LOCATION_TYPE_COLOR[loc.locationType]} ${loc.isOccupied ? "opacity-100" : "opacity-60"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{loc.locationCode}</span>
                    {loc.isOccupied ? <ParkingSquare className="h-4 w-4 text-gray-600" /> : <span className="text-green-500 text-lg font-light">○</span>}
                  </div>
                  {loc.activeAppointment ? (
                    <>
                      <p className="text-xs font-medium truncate">{loc.activeAppointment.carrierName ?? "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{loc.activeAppointment.trailerNumber ?? "—"}</p>
                    </>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Available</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Staging */}
          {stagingAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Staging Areas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stagingAreas.map((loc) => (
                  <div key={loc.id} className={`rounded-xl border-2 p-3 ${LOCATION_TYPE_COLOR[loc.locationType]} ${loc.isOccupied ? "opacity-100" : "opacity-60"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{loc.locationCode}</span>
                      {loc.isOccupied ? <Truck className="h-4 w-4 text-purple-600" /> : <span className="text-green-500 text-lg font-light">○</span>}
                    </div>
                    <p className="text-xs text-gray-500">{loc.locationName}</p>
                    {loc.activeAppointment && <p className="text-xs font-medium truncate">{loc.activeAppointment.carrierName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Shunter Dispatch ── */}
        <TabsContent value="shunter" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Pending Shunter Tasks
              </CardTitle>
              <CardDescription>Trailers to be moved between parking spots and dock doors — accept to dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              {dTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No pending shunter tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dTasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-4 p-4 rounded-lg border ${task.priority === "URGENT" ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold border ${task.priority === "URGENT" ? "bg-red-100 text-red-700 border-red-300" : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                        {task.priority}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{task.type === "PULL_TO_DOCK" ? "Pull to Dock" : "Spot Trailer"}</span>
                          <Badge variant="outline" className="text-xs">{task.appointmentNumber}</Badge>
                          {task.trailerNumber && <Badge variant="secondary" className="text-xs">{task.trailerNumber}</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{task.fromLocation}</span>
                          {" → "}
                          <span className="font-medium text-gray-700">{task.toLocation}</span>
                          {" · "}{task.carrier}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className={`font-bold ${task.priority === "URGENT" ? "text-red-600" : "text-gray-600"}`}>{minsUntil(task.scheduledStart)}</p>
                        <p className="text-gray-400">{new Date(task.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <Button size="sm" disabled={dispatching === task.id} onClick={() => dispatchShunter(task)} className={task.priority === "URGENT" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}>
                        {dispatching === task.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Zap className="h-3 w-3 mr-1" />Dispatch</>}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Gate Log ── */}
        <TabsContent value="gate-log" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Gate Log — Last 24 Hours
              </CardTitle>
              <CardDescription>All vehicle entries and exits with security verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 pr-4">Entry#</th>
                      <th className="text-left py-2 pr-4">Direction</th>
                      <th className="text-left py-2 pr-4">Vehicle</th>
                      <th className="text-left py-2 pr-4">Driver</th>
                      <th className="text-left py-2 pr-4">Carrier</th>
                      <th className="text-left py-2 pr-4">Appointment</th>
                      <th className="text-left py-2 pr-4">Time</th>
                      <th className="text-center py-2">Security</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dEntries.map((e) => (
                      <tr key={e.id} className={`border-b last:border-0 ${!e.securityCheckPassed ? "bg-red-50" : ""}`}>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-500">{e.entryNumber}</td>
                        <td className="py-2 pr-4">
                          <Badge className={`text-xs ${e.direction === "INBOUND" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                            {e.direction === "INBOUND" ? <ArrowDownToLine className="h-3 w-3 mr-1 inline" /> : <ArrowUpFromLine className="h-3 w-3 mr-1 inline" />}
                            {e.direction}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs"><span className="font-medium">{e.vehicleNumber}</span>{e.trailerNumber && <span className="text-gray-400"> / {e.trailerNumber}</span>}</td>
                        <td className="py-2 pr-4 text-xs">{e.driverName}</td>
                        <td className="py-2 pr-4 text-xs text-gray-600">{e.carrierName ?? "—"}</td>
                        <td className="py-2 pr-4 text-xs">{e.appointmentNumber ? <Badge variant="outline" className="text-xs">{e.appointmentNumber}</Badge> : <span className="text-gray-400">Walk-in</span>}</td>
                        <td className="py-2 pr-4 text-xs text-gray-400">{minsAgo(e.actualTime)}</td>
                        <td className="py-2 text-center">
                          {e.securityCheckPassed
                            ? <ShieldCheck className="h-4 w-4 text-green-500 mx-auto" />
                            : <XCircle className="h-4 w-4 text-red-500 mx-auto" title={e.securityNotes} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
