/**
 * Dock Scheduling Dashboard
 * Real-time dock appointment management with live status tracking
 *
 * Features:
 * - Real-time dock utilization monitoring
 * - Appointment booking and management
 * - Carrier check-in workflow
 * - Dwell time tracking
 * - Dock door assignment
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
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
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
import { toast } from "sonner";
import { AppointmentBookingForm } from "@/components/dock/appointment-booking-form";
import { CarrierCheckInForm } from "@/components/dock/carrier-check-in-form";

interface DockLocation {
  id: string;
  locationName: string;
  locationCode: string;
  locationType: string;
  status: string;
  currentAppointment: DockAppointment | null;
}

interface DockAppointment {
  id: string;
  appointmentNumber: string;
  appointmentType: string;
  status: string;
  carrierName: string | null;
  driverName: string | null;
  vehiclePlate: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  actualArrival: string | null;
  actualDeparture: string | null;
  yardLocation: {
    locationName: string;
    locationCode: string;
  } | null;
}

interface DockStats {
  totalDocks: number;
  occupiedDocks: number;
  availableDocks: number;
  utilizationRate: number;
  todaysAppointments: number;
  inProgress: number;
  overdue: number;
  avgDwellTime: number;
}

export default function DockSchedulingDashboard() {
  const [stats, setStats] = useState<DockStats>({
    totalDocks: 0,
    occupiedDocks: 0,
    availableDocks: 0,
    utilizationRate: 0,
    todaysAppointments: 0,
    inProgress: 0,
    overdue: 0,
    avgDwellTime: 0,
  });
  const [dockLocations, setDockLocations] = useState<DockLocation[]>([]);
  const [appointments, setAppointments] = useState<DockAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<DockAppointment | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dock status
      const statusRes = await fetch("/api/dock/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStats(statusData.statistics);
        setDockLocations(statusData.dockLocations);
      }

      // Fetch appointments
      const apptRes = await fetch("/api/dock/appointments");
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      CHECKED_IN: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      NO_SHOW: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDwellTime = (
    arrival: string | null,
    departure: string | null,
  ) => {
    if (!arrival) return "N/A";
    const start = new Date(arrival);
    const end = departure ? new Date(departure) : new Date();
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dock scheduling...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dock Scheduling</h1>
          <p className="text-gray-500 mt-1">
            Real-time dock management and appointment tracking
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Docks</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableDocks} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilization Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedDocks} docks in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Dwell Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDwellTime.toFixed(0)} min
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdue} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Live Status</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Live Status Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dock Status Overview</CardTitle>
              <CardDescription>
                Real-time status of all dock doors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dockLocations.map((dock) => (
                  <Card
                    key={dock.id}
                    className={`${
                      dock.currentAppointment
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {dock.locationName}
                          </CardTitle>
                          <CardDescription>{dock.locationCode}</CardDescription>
                        </div>
                        <Badge
                          className={
                            dock.currentAppointment
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {dock.currentAppointment ? "Occupied" : "Available"}
                        </Badge>
                      </div>
                    </CardHeader>
                    {dock.currentAppointment && (
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {dock.currentAppointment.carrierName ||
                                "Unknown Carrier"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>
                              {dock.currentAppointment.driverName ||
                                "Unknown Driver"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>
                              Dwell:{" "}
                              {calculateDwellTime(
                                dock.currentAppointment.actualArrival,
                                dock.currentAppointment.actualDeparture,
                              )}
                            </span>
                          </div>
                          <Badge
                            className={getStatusColor(
                              dock.currentAppointment.status,
                            )}
                          >
                            {dock.currentAppointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Appointments</CardTitle>
                  <CardDescription>
                    Manage and track dock appointments
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setBookingFormOpen(true)}>
                    New Appointment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Dock</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments
                    .filter(
                      (appt) =>
                        statusFilter === "all" || appt.status === statusFilter,
                    )
                    .map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.appointmentNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {appointment.appointmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {appointment.carrierName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {appointment.yardLocation?.locationName ||
                            "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatDate(appointment.scheduledStart)}</div>
                            <div className="text-sm text-gray-500">
                              {formatTime(appointment.scheduledStart)} -{" "}
                              {formatTime(appointment.scheduledEnd)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                            {appointment.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setCheckInFormOpen(true);
                                }}
                              >
                                Check In
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

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                View and manage upcoming appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Calendar view coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AppointmentBookingForm
        open={bookingFormOpen}
        onOpenChange={setBookingFormOpen}
        dockLocations={dockLocations.map((d) => ({
          id: d.id,
          locationName: d.locationName,
          locationCode: d.locationCode,
        }))}
        onSuccess={fetchDashboardData}
      />

      <CarrierCheckInForm
        open={checkInFormOpen}
        onOpenChange={setCheckInFormOpen}
        appointment={selectedAppointment}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
