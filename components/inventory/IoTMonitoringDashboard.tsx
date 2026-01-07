/**
 * IoT Monitoring Dashboard
 * Real-time IoT device monitoring and alerts
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  AlertTriangle,
  Battery,
  Signal,
  Thermometer,
  Droplets,
  Radio,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function IoTMonitoringDashboard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [environmentalData, setEnvironmentalData] = useState<any>(null);
  const [digitalTwinStatus, setDigitalTwinStatus] = useState<any>(null);

  // Load devices
  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/iot/devices");
      const data = await response.json();
      if (data.success) {
        setDevices(data.data.devices || []);
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
    setLoading(false);
  };

  // Load alerts
  const loadAlerts = async () => {
    try {
      const response = await fetch(
        "/api/inventory/iot/alerts?severity=HIGH&resolved=false",
      );
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  // Load environmental data
  const loadEnvironmental = async () => {
    try {
      const response = await fetch(
        "/api/inventory/iot/environmental/reading?hours=24",
      );
      const data = await response.json();
      if (data.success) {
        setEnvironmentalData(data.data);
      }
    } catch (error) {
      console.error("Failed to load environmental data:", error);
    }
  };

  // Load digital twin status
  const loadDigitalTwin = async () => {
    try {
      const response = await fetch("/api/inventory/iot/digital-twin/sync");
      const data = await response.json();
      if (data.success) {
        setDigitalTwinStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to load digital twin status:", error);
    }
  };

  useEffect(() => {
    loadDevices();
    loadAlerts();
    loadEnvironmental();
    loadDigitalTwin();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDevices();
      loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const deviceStats = devices.reduce((acc: any, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IoT Device Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time sensor data and device health
          </p>
        </div>
        <Button onClick={loadDevices} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Online Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deviceStats.ACTIVE || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(((deviceStats.ACTIVE || 0) / devices.length) * 100)}%
              uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter((a) => a.severity === "CRITICAL").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {devices.filter((d) => d.health?.maintenance?.required).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scheduled maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id} variant="destructive">
                  <AlertDescription>
                    <strong>{alert.device?.name}:</strong> {alert.message}
                    <span className="float-right text-sm">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environmental Monitoring */}
      {environmentalData && (
        <Card>
          <CardHeader>
            <CardTitle>Environmental Monitoring (Last 24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Thermometer className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-2xl font-bold">
                    {environmentalData.statistics?.temperature?.current?.toFixed(
                      1,
                    )}
                    °C
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Range:{" "}
                    {environmentalData.statistics?.temperature?.min?.toFixed(1)}
                    °C -{" "}
                    {environmentalData.statistics?.temperature?.max?.toFixed(1)}
                    °C
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Droplets className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="text-2xl font-bold">
                    {environmentalData.statistics?.humidity?.current?.toFixed(
                      1,
                    )}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Range:{" "}
                    {environmentalData.statistics?.humidity?.min?.toFixed(1)}% -{" "}
                    {environmentalData.statistics?.humidity?.max?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {environmentalData.statistics?.violations > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {environmentalData.statistics.violations} environmental
                  violations detected in the last 24 hours
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>IoT Devices</CardTitle>
          <CardDescription>Device health and status monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <Radio
                      className={`h-5 w-5 ${device.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.deviceType} •{" "}
                      {device.location?.name || "Unknown location"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {device.batteryLevel !== null && (
                      <div className="flex items-center gap-2">
                        <Battery
                          className={`h-4 w-4 ${device.batteryLevel < 20 ? "text-red-600" : "text-green-600"}`}
                        />
                        <span className="text-sm">{device.batteryLevel}%</span>
                      </div>
                    )}
                    {device.signalStrength !== null && (
                      <div className="flex items-center gap-2">
                        <Signal
                          className={`h-4 w-4 ${device.signalStrength < 30 ? "text-red-600" : "text-green-600"}`}
                        />
                        <span className="text-sm">
                          {device.signalStrength}%
                        </span>
                      </div>
                    )}
                    <Badge
                      variant={
                        device.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {device.status}
                    </Badge>
                    {device.health?.maintenance?.required && (
                      <Badge variant="destructive">Maintenance Due</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Digital Twin Status */}
      {digitalTwinStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Digital Twin Synchronization</CardTitle>
            <CardDescription>
              Physical-digital inventory state comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Average Confidence
                </p>
                <p className="text-3xl font-bold">
                  {digitalTwinStatus.statistics?.avgConfidence}%
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Needs Sync</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {digitalTwinStatus.statistics?.needsSync}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  High Confidence
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {digitalTwinStatus.statistics?.highConfidence}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
