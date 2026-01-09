"use client";

/**
 * WAREHOUSE TRAFFIC CONTROL DASHBOARD
 * ====================================
 * 
 * System 2 - High Impact (737% ROI)
 * Investment: $12K → Savings: $88K/year
 * 
 * Features:
 * - Real-time zone monitoring
 * - Live vehicle tracking
 * - Collision prevention alerts
 * - Route optimization
 * - Safety scoring
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Car,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Gauge,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface TrafficZone {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentVehicles: number;
  congestionLevel: string;
  speedLimit: number;
  safetyRating: number;
}

interface VehiclePosition {
  id: string;
  vehicleId: string;
  vehicleType: string;
  operatorId: string;
  operatorName: string;
  currentZone: string;
  speed: number;
  heading: number;
  timestamp: Date;
}

interface CollisionAlert {
  id: string;
  severity: string;
  vehicle1Id: string;
  vehicle2Id: string;
  zone: string;
  distance: number;
  timeToCollision: number;
  status: string;
  timestamp: Date;
}

interface TrafficMetrics {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  avgSpeed: number;
  congestionZones: number;
  activeAlerts: number;
  collisionsAvoided: number;
  safetyScore: number;
  throughput: number;
  efficiency: number;
}

interface Stats {
  totalZones: number;
  totalVehicles: number;
  activeAlerts: number;
  safetyScore: number;
  efficiency: number;
  collisionsAvoidedToday: number;
  collisionsAvoidedMonth: number;
  avgResponseTime: number;
  uptime: number;
  savings: {
    perCollisionAvoided: number;
    daily: number;
    monthly: number;
    yearly: number;
  };
  roi: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TrafficControlDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<TrafficZone[]>([]);
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [alerts, setAlerts] = useState<CollisionAlert[]>([]);
  const [metrics, setMetrics] = useState<TrafficMetrics | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [dashboardRes, statsRes] = await Promise.all([
        fetch("/api/optimization/traffic-control"),
        fetch("/api/optimization/traffic-control?action=stats"),
      ]);

      const [dashboardData, statsData] = await Promise.all([
        dashboardRes.json(),
        statsRes.json(),
      ]);

      setZones(dashboardData.zones || []);
      setVehicles(dashboardData.vehicles || []);
      setAlerts(dashboardData.alerts || []);
      setMetrics(dashboardData.metrics || null);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch traffic data:", error);
      toast({
        title: "Error",
        description: "Failed to load traffic control data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const res = await fetch("/api/optimization/traffic-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACKNOWLEDGE_ALERT",
          alertId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Alert Acknowledged",
          description: data.message,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to acknowledge alert");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      const res = await fetch("/api/optimization/traffic-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE_ALERT",
          alertId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Alert Resolved",
          description: data.message,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to resolve alert");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function getCongestionBadge(level: string) {
    const colors: Record<string, string> = {
      CLEAR: "bg-green-500 text-white",
      LIGHT: "bg-blue-500 text-white",
      MODERATE: "bg-yellow-500 text-white",
      HEAVY: "bg-orange-500 text-white",
      CRITICAL: "bg-red-500 text-white",
    };

    return <Badge className={colors[level] || "bg-gray-500"}>{level}</Badge>;
  }

  function getSeverityBadge(severity: string) {
    const colors: Record<string, string> = {
      LOW: "bg-blue-500 text-white",
      MEDIUM: "bg-yellow-500 text-white",
      HIGH: "bg-orange-500 text-white",
      CRITICAL: "bg-red-500 text-white animate-pulse",
    };

    return <Badge className={colors[severity] || "bg-gray-500"}>{severity}</Badge>;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Traffic Control Dashboard...</p>
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
            <Car className="w-8 h-8 text-blue-600" />
            Warehouse Traffic Control
          </h1>
          <p className="text-gray-600 mt-1">
            High Impact • 737% ROI • $88K Annual Savings
          </p>
        </div>
        <Button onClick={fetchData}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Safety Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.safetyScore.toFixed(1)}%
              </div>
              <Progress value={stats.safetyScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeVehicles}</div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.totalVehicles} total • {metrics.idleVehicles} idle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Collisions Avoided
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.collisionsAvoidedMonth}
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Annual Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.savings.yearly)}
              </div>
              <p className="text-xs text-gray-500 mt-1">ROI: {stats.roi}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts Banner */}
      {alerts.filter((a) => a.status === "ACTIVE").length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
              <div>
                <div className="font-bold text-red-900">
                  {alerts.filter((a) => a.status === "ACTIVE").length} Active Collision Alerts
                </div>
                <div className="text-sm text-red-700">Immediate attention required</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Traffic Zones</TabsTrigger>
          <TabsTrigger value="vehicles">Live Vehicles</TabsTrigger>
          <TabsTrigger value="alerts">Collision Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ZONES TAB */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Zone Status</CardTitle>
              <CardDescription>Real-time zone congestion and safety monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Congestion</TableHead>
                    <TableHead>Speed Limit</TableHead>
                    <TableHead>Safety Rating</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <div className="font-medium">{zone.name}</div>
                        <div className="text-xs text-gray-500">{zone.id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{zone.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {zone.currentVehicles} / {zone.capacity}
                          </div>
                          <Progress
                            value={(zone.currentVehicles / zone.capacity) * 100}
                            className="w-20 mt-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getCongestionBadge(zone.congestionLevel)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          {zone.speedLimit} km/h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={zone.safetyRating} className="w-16" />
                          <span className="text-sm">{zone.safetyRating.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {zone.safetyRating >= 80 ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Safe
                          </Badge>
                        ) : zone.safetyRating >= 60 ? (
                          <Badge className="bg-yellow-500 text-white">Caution</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Alert
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VEHICLES TAB */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Vehicle Tracking</CardTitle>
              <CardDescription>Real-time positions and speeds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Current Zone</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Heading</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="font-medium">{vehicle.vehicleId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vehicle.vehicleType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vehicle.operatorName}</div>
                          <div className="text-xs text-gray-500">{vehicle.operatorId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {zones.find((z) => z.id === vehicle.currentZone)?.name || vehicle.currentZone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          {vehicle.speed.toFixed(1)} km/h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Navigation
                            className="w-4 h-4 text-gray-400"
                            style={{ transform: `rotate(${vehicle.heading}deg)` }}
                          />
                          {vehicle.heading}°
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.speed > 0 ? (
                          <Badge className="bg-green-500 text-white">Moving</Badge>
                        ) : (
                          <Badge variant="secondary">Idle</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collision Prevention Alerts</CardTitle>
              <CardDescription>AI-powered collision detection and prevention</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <div className="text-lg font-medium text-green-600">All Clear</div>
                  <div className="text-sm text-gray-500">No collision alerts at this time</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Time to Collision</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {alert.vehicle1Id} & {alert.vehicle2Id}
                          </div>
                        </TableCell>
                        <TableCell>{alert.zone}</TableCell>
                        <TableCell>
                          <div className="font-medium">{alert.distance.toFixed(1)}m</div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={
                              alert.timeToCollision < 3
                                ? "font-bold text-red-600"
                                : "font-medium"
                            }
                          >
                            {alert.timeToCollision.toFixed(1)}s
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.status === "ACTIVE" ? (
                            <Badge className="bg-red-500 text-white">ACTIVE</Badge>
                          ) : alert.status === "ACKNOWLEDGED" ? (
                            <Badge className="bg-yellow-500 text-white">ACKNOWLEDGED</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white">RESOLVED</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {alert.status === "ACTIVE" && (
                              <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                                Acknowledge
                              </Button>
                            )}
                            {alert.status !== "RESOLVED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Safety Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collisions Avoided (Today)</span>
                      <Badge variant="default">{stats.collisionsAvoidedToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collisions Avoided (Month)</span>
                      <Badge variant="default">{stats.collisionsAvoidedMonth}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <Badge variant="default">{stats.avgResponseTime}s</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Uptime</span>
                      <Badge variant="default">{stats.uptime}%</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Savings</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.savings.daily)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Savings</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.savings.monthly)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Savings</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.savings.yearly)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm">Return on Investment</span>
                      <Badge variant="default" className="text-lg">
                        {stats.roi}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Avg Speed</div>
                    <div className="text-2xl font-bold">{metrics.avgSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Throughput</div>
                    <div className="text-2xl font-bold">{metrics.throughput} veh/hr</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.efficiency.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Congestion Zones</div>
                    <div className="text-2xl font-bold">
                      {metrics.congestionZones} / {zones.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
