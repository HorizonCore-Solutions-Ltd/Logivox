"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, Activity } from "lucide-react";

interface IoTDevice {
  id: string;
  deviceId: string;
  name: string;
  deviceType:
    | "SCANNER"
    | "PRINTER"
    | "RFID_READER"
    | "SCALE"
    | "SENSOR"
    | "GATEWAY"
    | "OTHER";
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "ERROR";
  warehouse: { name: string; code: string };
  location?: { name: string; code: string };
  lastSeen: string;
  firmwareVersion?: string;
  _count: { alerts: number };
}

export default function IoTDevicesPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchDevices = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/iot/devices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      console.error("Error fetching IoT devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ONLINE":
        return <Wifi className="w-5 h-5 text-green-600" />;
      case "OFFLINE":
        return <WifiOff className="w-5 h-5 text-gray-400" />;
      case "ERROR":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "MAINTENANCE":
        return <Activity className="w-5 h-5 text-yellow-600" />;
      default:
        return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ONLINE: "bg-green-100 text-green-800",
      OFFLINE: "bg-gray-100 text-gray-800",
      MAINTENANCE: "bg-yellow-100 text-yellow-800",
      ERROR: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || colors.OFFLINE;
  };

  const getTimeSince = (dateStr: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const onlineCount = devices.filter((d) => d.status === "ONLINE").length;
  const offlineCount = devices.filter((d) => d.status === "OFFLINE").length;
  const errorCount = devices.filter((d) => d.status === "ERROR").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IoT Devices</h1>
          <p className="text-gray-600 mt-1">
            Monitor warehouse hardware and sensors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Devices</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
            </div>
            <Wifi className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">{offlineCount}</p>
            </div>
            <WifiOff className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="ERROR">Error</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Loading...
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No devices found
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {device.name}
                  </h3>
                  <p className="text-sm text-gray-600">{device.deviceId}</p>
                  <p className="text-xs text-gray-500">{device.deviceType}</p>
                </div>
                {getStatusIcon(device.status)}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Warehouse:</span>
                  <span className="font-medium">{device.warehouse.name}</span>
                </div>
                {device.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{device.location.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium">
                    {getTimeSince(device.lastSeen)}
                  </span>
                </div>
                {device.firmwareVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Firmware:</span>
                    <span className="font-medium">
                      {device.firmwareVersion}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                    device.status,
                  )}`}
                >
                  {device.status}
                </span>
                {device._count.alerts > 0 && (
                  <span className="text-xs text-red-600 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {device._count.alerts} alerts
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
