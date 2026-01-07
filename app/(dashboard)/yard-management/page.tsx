/**
 * Yard Management Dashboard
 * Comprehensive UI for dock scheduling, yard operations, and gate management
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  DoorOpen,
  Package,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface DockAppointment {
  id: string;
  appointmentNumber: string;
  carrierName: string;
  driverName: string;
  truckNumber: string;
  appointmentType: "INBOUND" | "OUTBOUND" | "LIVE_LOAD" | "DROP_TRAILER";
  scheduledTime: string;
  status:
    | "SCHEDULED"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  dockDoor: string;
  yardLocation: string;
  estimatedDuration: number;
  actualDuration?: number;
}

interface YardLocation {
  id: string;
  locationCode: string;
  type: "DOCK_DOOR" | "YARD_SPOT" | "STAGING";
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
  currentOccupant?: string;
  capacity: number;
  zone: string;
}

interface GateActivity {
  id: string;
  truckNumber: string;
  carrierName: string;
  driverName: string;
  direction: "IN" | "OUT";
  timestamp: string;
  appointmentNumber: string;
  gateId: string;
}

interface YardStats {
  totalDocks: number;
  availableDocks: number;
  totalYardSpots: number;
  availableYardSpots: number;
  todayAppointments: number;
  activeAppointments: number;
  avgDwellTime: number;
  utilizationRate: number;
  onTimePerformance: number;
}

interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  totalAppointments: number;
  onTimeAppointments: number;
  lateAppointments: number;
  avgDwellTime: number;
  onTimeRate: number;
}

export default function YardManagementDashboard() {
  const [appointments, setAppointments] = useState<DockAppointment[]>([]);
  const [locations, setLocations] = useState<YardLocation[]>([]);
  const [gateActivities, setGateActivities] = useState<GateActivity[]>([]);
  const [carriers, setCarriers] = useState<CarrierPerformance[]>([]);
  const [stats, setStats] = useState<YardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [newApptCarrier, setNewApptCarrier] = useState("");
  const [newApptType, setNewApptType] = useState<
    "INBOUND" | "OUTBOUND" | "LIVE_LOAD" | "DROP_TRAILER"
  >("INBOUND");
  const [newApptTime, setNewApptTime] = useState("");

  useEffect(() => {
    loadDashboardData();
    // Poll for updates every 20 seconds
    const interval = setInterval(loadDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load appointments
      const apptsResponse = await fetch(
        "/api/yard-management?action=appointments",
      );
      const apptsData = await apptsResponse.json();
      setAppointments(apptsData.appointments || []);

      // Load statistics
      const statsResponse = await fetch(
        "/api/yard-management?action=statistics",
      );
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load yard utilization
      const utilizationResponse = await fetch(
        "/api/yard-management?action=yard-utilization",
      );
      const utilizationData = await utilizationResponse.json();
      setLocations(utilizationData.locations || []);

      // Load gate activity
      const gateResponse = await fetch(
        "/api/yard-management?action=gate-activity",
      );
      const gateData = await gateResponse.json();
      setGateActivities(gateData.activities || []);

      // Load carrier performance
      const carrierResponse = await fetch(
        "/api/yard-management?action=carrier-performance",
      );
      const carrierData = await carrierResponse.json();
      setCarriers(carrierData.carriers || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    try {
      const response = await fetch("/api/yard-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-appointment",
          carrierId: newApptCarrier,
          appointmentType: newApptType,
          scheduledTime: new Date(newApptTime).toISOString(),
          warehouseId: "default-warehouse",
        }),
      });

      if (response.ok) {
        setNewApptCarrier("");
        setNewApptTime("");
        loadDashboardData();
        setActiveTab("appointments");
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
    }
  };

  const assignLocation = async (appointmentId: string, locationId: string) => {
    try {
      const response = await fetch("/api/yard-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-location",
          appointmentId,
          locationId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to assign location:", error);
    }
  };

  const checkIn = async (appointmentId: string) => {
    try {
      const response = await fetch("/api/yard-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-in",
          appointmentId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to check in:", error);
    }
  };

  const checkOut = async (appointmentId: string) => {
    try {
      const response = await fetch("/api/yard-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-out",
          appointmentId,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Failed to check out:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { variant: "secondary" as const, icon: Calendar },
      CHECKED_IN: { variant: "default" as const, icon: DoorOpen },
      IN_PROGRESS: { variant: "default" as const, icon: Truck },
      COMPLETED: { variant: "success" as const, icon: CheckCircle },
      CANCELLED: { variant: "destructive" as const, icon: AlertCircle },
      AVAILABLE: { variant: "success" as const, icon: CheckCircle },
      OCCUPIED: { variant: "warning" as const, icon: Package },
      RESERVED: { variant: "default" as const, icon: Clock },
      MAINTENANCE: { variant: "destructive" as const, icon: AlertCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.SCHEDULED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      INBOUND: "bg-blue-500",
      OUTBOUND: "bg-green-500",
      LIVE_LOAD: "bg-purple-500",
      DROP_TRAILER: "bg-orange-500",
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-500"}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading yard management dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Yard Management
          </h1>
          <p className="text-muted-foreground">
            Manage dock appointments, yard locations, and gate operations
          </p>
        </div>
        <Button onClick={() => setActiveTab("create-appointment")}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Docks
              </CardTitle>
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableDocks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDocks} total docks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Yard Capacity
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.availableYardSpots}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalYardSpots} total spots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Appointments
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayAppointments} scheduled today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.utilizationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.avgDwellTime.toFixed(0)} min avg dwell
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="dock-schedule">Dock Schedule</TabsTrigger>
          <TabsTrigger value="yard-map">Yard Map</TabsTrigger>
          <TabsTrigger value="gate">Gate Activity</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="create-appointment">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>Scheduled dock activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.slice(0, 5).map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell>
                          {new Date(appt.scheduledTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {appt.carrierName}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(appt.appointmentType)}
                        </TableCell>
                        <TableCell>{appt.dockDoor}</TableCell>
                        <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Gate Activity</CardTitle>
                <CardDescription>Truck movements</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Direction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateActivities.slice(0, 5).map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {activity.truckNumber}
                        </TableCell>
                        <TableCell>{activity.carrierName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              activity.direction === "IN"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {activity.direction}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>Manage dock appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Dock/Yard</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="font-medium">
                        {appt.appointmentNumber}
                      </TableCell>
                      <TableCell>{appt.carrierName}</TableCell>
                      <TableCell>{appt.driverName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {appt.truckNumber}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(appt.appointmentType)}
                      </TableCell>
                      <TableCell>
                        {new Date(appt.scheduledTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {appt.dockDoor || appt.yardLocation || "-"}
                      </TableCell>
                      <TableCell>
                        {appt.actualDuration
                          ? `${appt.actualDuration} min`
                          : `~${appt.estimatedDuration} min`}
                      </TableCell>
                      <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {appt.status === "SCHEDULED" && (
                            <Button size="sm" onClick={() => checkIn(appt.id)}>
                              Check In
                            </Button>
                          )}
                          {appt.status === "IN_PROGRESS" && (
                            <Button size="sm" onClick={() => checkOut(appt.id)}>
                              Check Out
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dock-schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dock Schedule</CardTitle>
              <CardDescription>
                Dock door assignments and schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations
                  .filter((l) => l.type === "DOCK_DOOR")
                  .map((dock) => (
                    <div key={dock.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {dock.locationCode}
                          </span>
                          {getStatusBadge(dock.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {dock.zone}
                        </span>
                      </div>
                      {dock.currentOccupant && (
                        <div className="text-sm text-muted-foreground">
                          Current: {dock.currentOccupant}
                        </div>
                      )}
                      <div className="mt-2">
                        {appointments
                          .filter((a) => a.dockDoor === dock.locationCode)
                          .map((appt) => (
                            <div
                              key={appt.id}
                              className="text-sm py-1 border-l-2 border-primary pl-2"
                            >
                              {new Date(
                                appt.scheduledTime,
                              ).toLocaleTimeString()}{" "}
                              - {appt.carrierName}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yard-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yard Map</CardTitle>
              <CardDescription>
                Yard location status and occupancy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`border rounded p-2 text-center ${
                      location.status === "AVAILABLE"
                        ? "bg-green-50"
                        : location.status === "OCCUPIED"
                          ? "bg-yellow-50"
                          : location.status === "RESERVED"
                            ? "bg-blue-50"
                            : "bg-red-50"
                    }`}
                  >
                    <div className="font-bold text-sm">
                      {location.locationCode}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {location.type}
                    </div>
                    <div className="text-xs mt-1">
                      {getStatusBadge(location.status)}
                    </div>
                    {location.currentOccupant && (
                      <div className="text-xs mt-1 truncate">
                        {location.currentOccupant}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gate Activity Log</CardTitle>
              <CardDescription>
                All truck movements through the gate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Truck Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Appointment #</TableHead>
                    <TableHead>Gate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        {activity.truckNumber}
                      </TableCell>
                      <TableCell>{activity.carrierName}</TableCell>
                      <TableCell>{activity.driverName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            activity.direction === "IN"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {activity.direction === "IN"
                            ? "CHECK IN"
                            : "CHECK OUT"}
                        </Badge>
                      </TableCell>
                      <TableCell>{activity.appointmentNumber}</TableCell>
                      <TableCell>{activity.gateId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Carrier on-time performance and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Total Appointments</TableHead>
                    <TableHead>On-Time</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Avg Dwell Time</TableHead>
                    <TableHead>On-Time Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers.map((carrier) => (
                    <TableRow key={carrier.carrierId}>
                      <TableCell className="font-medium">
                        {carrier.carrierName}
                      </TableCell>
                      <TableCell>{carrier.totalAppointments}</TableCell>
                      <TableCell className="text-green-600">
                        {carrier.onTimeAppointments}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {carrier.lateAppointments}
                      </TableCell>
                      <TableCell>
                        {carrier.avgDwellTime.toFixed(0)} min
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={carrier.onTimeRate}
                            className="h-2 w-16"
                          />
                          <span className="text-sm font-bold">
                            {carrier.onTimeRate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-appointment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
              <CardDescription>Create a dock appointment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier ID</Label>
                  <Input
                    id="carrier"
                    placeholder="CARRIER-001"
                    value={newApptCarrier}
                    onChange={(e) => setNewApptCarrier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-type">Appointment Type</Label>
                  <Select
                    value={newApptType}
                    onValueChange={(v: any) => setNewApptType(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INBOUND">Inbound</SelectItem>
                      <SelectItem value="OUTBOUND">Outbound</SelectItem>
                      <SelectItem value="LIVE_LOAD">Live Load</SelectItem>
                      <SelectItem value="DROP_TRAILER">Drop Trailer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="time">Scheduled Time</Label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={newApptTime}
                    onChange={(e) => setNewApptTime(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={createAppointment}
                disabled={!newApptCarrier || !newApptTime}
              >
                Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
