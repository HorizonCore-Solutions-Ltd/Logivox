"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  Battery,
  Plus,
  Radio,
  RefreshCw,
  Thermometer,
  Wifi,
} from "lucide-react";
import Link from "next/link";

interface IoTDevice {
  id: string;
  deviceType: string;
  deviceId: string;
  name: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  status: string;
  lastHeartbeat?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  warehouse?: {
    id: string;
    name: string;
  };
  _count: {
    readings: number;
    alerts: number;
  };
}

export default function IoTDevicesPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0,
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/iot/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        
        // Calculate stats
        const total = data.devices.length;
        const online = data.devices.filter((d: IoTDevice) => d.status === "ONLINE").length;
        const offline = data.devices.filter((d: IoTDevice) => d.status === "OFFLINE").length;
        const error = data.devices.filter((d: IoTDevice) => d.status === "ERROR").length;
        
        setStats({ total, online, offline, error });
      }
    } catch (error) {
      console.error("Error fetching IoT devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      ONLINE: { color: "bg-green-100 text-green-800", icon: Wifi },
      OFFLINE: { color: "bg-gray-100 text-gray-800", icon: Wifi },
      ERROR: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      MAINTENANCE: { color: "bg-yellow-100 text-yellow-800", icon: Activity },
    };

    const statusConfig = (config[status as keyof typeof config] || config.OFFLINE) as { color: string; icon: any };
    const { color, icon: Icon } = statusConfig;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "TEMPERATURE_SENSOR":
        return <Thermometer className="h-5 w-5" />;
      case "RFID_READER":
        return <Radio className="h-5 w-5" />;
      case "GATEWAY":
        return <Wifi className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IoT Device Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all IoT sensors, RFID readers, and connected devices
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDevices} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/iot/devices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Devices
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Online
            </CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.online}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Offline
            </CardTitle>
            <Wifi className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            All IoT devices registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No IoT devices registered</p>
              <Link href="/dashboard/iot/devices/new">
                <Button>Add Your First Device</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Readings</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-500">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{device.name}</p>
                          <p className="text-sm text-gray-500 font-mono">{device.deviceId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {device.deviceType.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{device.location || "—"}</p>
                        {device.warehouse && (
                          <p className="text-xs text-gray-500">{device.warehouse.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      {device.batteryLevel !== null && device.batteryLevel !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <Battery
                            className={`h-4 w-4 ${
                              device.batteryLevel > 50
                                ? "text-green-600"
                                : device.batteryLevel > 20
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          />
                          <span className="text-sm">{device.batteryLevel}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{device._count.readings.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {device._count.alerts > 0 ? (
                        <Badge className="bg-red-100 text-red-800">
                          {device._count.alerts}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.lastHeartbeat ? (
                        <span className="text-sm">
                          {new Date(device.lastHeartbeat).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/iot/devices/${device.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
