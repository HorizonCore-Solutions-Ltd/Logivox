"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TruckIcon,
  PackageIcon,
  ClockIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

interface DashboardStats {
  totalAppointments: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalUnits: number;
  receivedUnits: number;
  shippedUnits: number;
  avgDwellTime: number;
  onTimePercentage: number;
  utilizationRate: number;
}

interface Appointment {
  id: string;
  appointmentNumber: string;
  type: string;
  status: string;
  priority: string;
  expectedArrival: string;
  targetShipDate: string;
  inboundCarrier?: string;
  outboundCarrier?: string;
  totalUnits: number;
  receivedUnits: number;
  sortedUnits: number;
  shippedUnits: number;
  dwellTimeMinutes?: number;
  maxDwellTimeHours: number;
}

export default function CrossDockDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch("/api/cross-dock/appointments/stats"),
        fetch(
          "/api/cross-dock/appointments?status=RECEIVING&status=SORTING&status=LOADING",
        ),
      ]);

      const statsData = await statsRes.json();
      const appointmentsData = await appointmentsRes.json();

      setStats(statsData);
      setActiveAppointments(appointmentsData.appointments || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "bg-blue-500",
      RECEIVING: "bg-yellow-500",
      SORTING: "bg-purple-500",
      STAGED: "bg-indigo-500",
      LOADING: "bg-orange-500",
      COMPLETED: "bg-green-500",
      CANCELLED: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: "destructive",
      HIGH: "destructive",
      MEDIUM: "default",
      LOW: "secondary",
    };
    return colors[priority] || "default";
  };

  const isDwellTimeWarning = (appointment: Appointment) => {
    if (!appointment.dwellTimeMinutes) return false;
    const maxMinutes = appointment.maxDwellTimeHours * 60;
    return appointment.dwellTimeMinutes > maxMinutes * 0.8;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cross-Docking Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time flow-through operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            Refresh
          </Button>
          <Button>Schedule Appointment</Button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Today
              </CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.COMPLETED || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.shippedUnits}/{stats.totalUnits}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUnits > 0
                  ? Math.round((stats.shippedUnits / stats.totalUnits) * 100)
                  : 0}
                % shipped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Dwell Time
              </CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.avgDwellTime / 60)}h {stats.avgDwellTime % 60}
                m
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; 4 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                On-Time Rate
              </CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.onTimePercentage)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.utilizationRate}% utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active appointments
            </div>
          ) : (
            <div className="space-y-4">
              {activeAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {appointment.appointmentNumber}
                        </span>
                        <Badge
                          variant={
                            getPriorityColor(appointment.priority) as any
                          }
                        >
                          {appointment.priority}
                        </Badge>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Badge variant="outline">{appointment.type}</Badge>
                        {isDwellTimeWarning(appointment) && (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertTriangleIcon className="h-3 w-3" />
                            Dwell Time Warning
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TruckIcon className="h-4 w-4" />
                          <span>In: {appointment.inboundCarrier || "N/A"}</span>
                        </div>
                        <ArrowRightIcon className="h-4 w-4" />
                        <div className="flex items-center gap-1">
                          <TruckIcon className="h-4 w-4" />
                          <span>
                            Out: {appointment.outboundCarrier || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Units: </span>
                          <span className="font-medium">
                            {appointment.receivedUnits}/{appointment.totalUnits}{" "}
                            received
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Sorted:{" "}
                          </span>
                          <span className="font-medium">
                            {appointment.sortedUnits}/
                            {appointment.receivedUnits}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Shipped:{" "}
                          </span>
                          <span className="font-medium">
                            {appointment.shippedUnits}/{appointment.totalUnits}
                          </span>
                        </div>
                      </div>

                      {appointment.dwellTimeMinutes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Dwell Time:{" "}
                          </span>
                          <span
                            className={
                              isDwellTimeWarning(appointment)
                                ? "text-destructive font-medium"
                                : ""
                            }
                          >
                            {Math.floor(appointment.dwellTimeMinutes / 60)}h{" "}
                            {appointment.dwellTimeMinutes % 60}m
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {appointment.maxDwellTimeHours}h max
                          </span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>
                            {appointment.totalUnits > 0
                              ? Math.round(
                                  (appointment.shippedUnits /
                                    appointment.totalUnits) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${
                                appointment.totalUnits > 0
                                  ? (appointment.shippedUnits /
                                      appointment.totalUnits) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
                      />
                      <span className="text-sm">{status}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
