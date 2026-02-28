"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  Thermometer,
  Droplets,
  Gauge,
  TrendingUp,
  TrendingDown,
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

interface SensorReading {
  id: string;
  deviceId: string;
  readingType: string;
  value: any;
  unit?: string;
  timestamp: string;
}

interface Device {
  id: string;
  name: string;
  deviceType: string;
  status: string;
}

export default function IoTMonitoringPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchReadings(selectedDevice);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (autoRefresh && selectedDevice) {
      const interval = setInterval(() => {
        fetchReadings(selectedDevice);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDevice]);

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/iot/devices");
      if (response.ok) {
        const data = await response.json();
        const sensorDevices = data.devices.filter((d: Device) =>
          ["TEMPERATURE_SENSOR", "HUMIDITY_SENSOR", "WEIGHT_SCALE"].includes(
            d.deviceType,
          ),
        );
        setDevices(sensorDevices);
        if (sensorDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(sensorDevices[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (deviceId: string) => {
    try {
      const response = await fetch(
        `/api/iot/devices/${deviceId}/readings?limit=50`,
      );
      if (response.ok) {
        const data = await response.json();
        setReadings(data.readings || []);
      }
    } catch (error) {
      console.error("Error fetching readings:", error);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "TEMPERATURE_SENSOR":
        return <Thermometer className="h-5 w-5 text-red-500" />;
      case "HUMIDITY_SENSOR":
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case "WEIGHT_SCALE":
        return <Gauge className="h-5 w-5 text-purple-500" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const prepareChartData = () => {
    return readings
      .slice()
      .reverse()
      .map((reading) => ({
        timestamp: new Date(reading.timestamp).toLocaleTimeString(),
        value:
          typeof reading.value === "object"
            ? reading.value.value
            : reading.value,
      }));
  };

  const getLatestReading = () => {
    if (readings.length === 0) return null;
    const latest = readings[0];
    return {
      value:
        typeof latest.value === "object" ? latest.value.value : latest.value,
      unit: latest.unit || "",
      timestamp: new Date(latest.timestamp).toLocaleString(),
    };
  };

  const calculateStats = () => {
    if (readings.length === 0) return null;

    const values = readings.map((r) =>
      typeof r.value === "object" ? r.value.value : r.value,
    );
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max };
  };

  const selectedDeviceInfo = devices.find((d) => d.id === selectedDevice);
  const latestReading = getLatestReading();
  const stats = calculateStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Real-Time Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor sensor readings and environmental conditions in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button
            onClick={() => selectedDevice && fetchReadings(selectedDevice)}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Device Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Device:</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose a sensor..." />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.deviceType)}
                      <span>{device.name}</span>
                      <Badge
                        className={
                          device.status === "ONLINE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !selectedDevice ? (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sensor devices available</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Reading */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Current Reading
                  </CardTitle>
                  {selectedDeviceInfo &&
                    getDeviceIcon(selectedDeviceInfo.deviceType)}
                </div>
              </CardHeader>
              <CardContent>
                {latestReading ? (
                  <>
                    <div className="text-4xl font-bold text-gray-900">
                      {latestReading.value.toFixed(1)}
                      <span className="text-lg text-gray-500 ml-2">
                        {latestReading.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {latestReading.timestamp}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">No readings available</p>
                )}
              </CardContent>
            </Card>

            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.avg.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-2">
                        {latestReading?.unit || ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Minimum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      {stats.min.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-2">
                        {latestReading?.unit || ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Maximum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      {stats.max.toFixed(1)}
                      <span className="text-sm text-gray-500 ml-2">
                        {latestReading?.unit || ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Reading History</CardTitle>
              <CardDescription>
                Last 50 readings from {selectedDeviceInfo?.name}
                {autoRefresh && " (Auto-refreshing every 5 seconds)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No readings available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={`Reading (${latestReading?.unit || ""})`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
