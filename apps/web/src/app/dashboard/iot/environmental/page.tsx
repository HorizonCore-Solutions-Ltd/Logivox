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
import { Thermometer, Droplets, AlertTriangle, Activity, RefreshCw, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface SensorDevice {
  id: string;
  name: string;
  location: string;
  type: string;
  status: string;
  lastReading: number | null;
  unit: string;
  minThreshold: number | null;
  maxThreshold: number | null;
  complianceStatus: "compliant" | "warning" | "breach" | "offline";
  activeAlerts: number;
  trend: Array<{ time: string; value: number }>;
}

interface EnvSummary {
  totalSensors: number;
  compliant: number;
  warnings: number;
  breaches: number;
  offline: number;
  overallCompliancePct: number;
}

const STATUS_CONFIG = {
  compliant: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2, iconColor: "text-green-500", label: "Compliant" },
  warning: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, iconColor: "text-yellow-500", label: "Warning" },
  breach: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, iconColor: "text-red-500", label: "Breach" },
  offline: { color: "bg-gray-100 text-gray-600 border-gray-300", icon: XCircle, iconColor: "text-gray-400", label: "Offline" },
};

const DEMO_SENSORS: SensorDevice[] = [
  { id: "S1", name: "Freezer Zone A", location: "Cold Storage - A", type: "TEMPERATURE_SENSOR", status: "ACTIVE", lastReading: -18.4, unit: "°C", minThreshold: -22, maxThreshold: -15, complianceStatus: "compliant", activeAlerts: 0, trend: [{ time: "12:00", value: -18.2 }, { time: "12:30", value: -18.5 }, { time: "13:00", value: -18.3 }, { time: "13:30", value: -18.4 }, { time: "14:00", value: -18.6 }, { time: "14:30", value: -18.4 }] },
  { id: "S2", name: "Chilled Zone B", location: "Cold Storage - B", type: "TEMPERATURE_SENSOR", status: "ACTIVE", lastReading: 2.1, unit: "°C", minThreshold: 0, maxThreshold: 4, complianceStatus: "compliant", activeAlerts: 0, trend: [{ time: "12:00", value: 2.3 }, { time: "12:30", value: 2.0 }, { time: "13:00", value: 2.2 }, { time: "13:30", value: 2.1 }, { time: "14:00", value: 1.9 }, { time: "14:30", value: 2.1 }] },
  { id: "S3", name: "Warehouse Floor", location: "Main Floor", type: "TEMPERATURE_SENSOR", status: "ACTIVE", lastReading: 22.8, unit: "°C", minThreshold: 15, maxThreshold: 30, complianceStatus: "compliant", activeAlerts: 0, trend: [{ time: "12:00", value: 21.5 }, { time: "12:30", value: 22.0 }, { time: "13:00", value: 22.4 }, { time: "13:30", value: 22.8 }, { time: "14:00", value: 23.1 }, { time: "14:30", value: 22.8 }] },
  { id: "S4", name: "Receiving Dock", location: "Dock Area", type: "TEMPERATURE_SENSOR", status: "ACTIVE", lastReading: 31.2, unit: "°C", minThreshold: 10, maxThreshold: 30, complianceStatus: "warning", activeAlerts: 1, trend: [{ time: "12:00", value: 26.1 }, { time: "12:30", value: 27.5 }, { time: "13:00", value: 28.9 }, { time: "13:30", value: 30.1 }, { time: "14:00", value: 30.8 }, { time: "14:30", value: 31.2 }] },
  { id: "H1", name: "Humidity - Zone A", location: "Cold Storage - A", type: "HUMIDITY_SENSOR", status: "ACTIVE", lastReading: 85.2, unit: "%RH", minThreshold: 70, maxThreshold: 95, complianceStatus: "compliant", activeAlerts: 0, trend: [{ time: "12:00", value: 84.1 }, { time: "12:30", value: 84.8 }, { time: "13:00", value: 85.0 }, { time: "13:30", value: 85.2 }, { time: "14:00", value: 85.5 }, { time: "14:30", value: 85.2 }] },
  { id: "H2", name: "Humidity - Main Floor", location: "Main Floor", type: "HUMIDITY_SENSOR", status: "ACTIVE", lastReading: 96.8, unit: "%RH", minThreshold: 40, maxThreshold: 90, complianceStatus: "breach", activeAlerts: 2, trend: [{ time: "12:00", value: 88.5 }, { time: "12:30", value: 90.1 }, { time: "13:00", value: 92.4 }, { time: "13:30", value: 93.9 }, { time: "14:00", value: 95.5 }, { time: "14:30", value: 96.8 }] },
];

export default function EnvironmentalPage() {
  const { toast } = useToast();
  const [sensors, setSensors] = useState<SensorDevice[]>([]);
  const [summary, setSummary] = useState<EnvSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [expandedSensor, setExpandedSensor] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/iot/environmental");
      if (res.ok) {
        const data = await res.json();
        setSensors(data.sensors ?? []);
        setSummary(data.summary ?? null);
        setLastUpdated(new Date().toLocaleTimeString());

        const breaches = (data.sensors ?? []).filter((s: SensorDevice) => s.complianceStatus === "breach");
        if (breaches.length > 0) {
          toast({
            title: "🚨 Environmental Breach",
            description: `${breaches.map((s: SensorDevice) => s.name).join(", ")} exceed compliance thresholds`,
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 30_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const displaySensors = sensors.length > 0 ? sensors : DEMO_SENSORS;
  const displaySummary: EnvSummary = summary ?? {
    totalSensors: displaySensors.length,
    compliant: displaySensors.filter((s) => s.complianceStatus === "compliant").length,
    warnings: displaySensors.filter((s) => s.complianceStatus === "warning").length,
    breaches: displaySensors.filter((s) => s.complianceStatus === "breach").length,
    offline: displaySensors.filter((s) => s.complianceStatus === "offline").length,
    overallCompliancePct: Math.round(
      (displaySensors.filter((s) => s.complianceStatus === "compliant").length /
        Math.max(displaySensors.length, 1)) * 100,
    ),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-blue-500" />
            Environmental Monitoring
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cold-chain compliance · Temperature & Humidity sensors
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">· Updated: {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className={autoRefresh ? "border-green-400 text-green-700" : ""}
          >
            <Activity className="h-4 w-4 mr-1" />
            {autoRefresh ? "Live (30s)" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary + Compliance bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
                <p className="text-4xl font-bold text-blue-700">{displaySummary.overallCompliancePct}%</p>
              </div>
              <ShieldCheck className="h-10 w-10 text-blue-400" />
            </div>
            <Progress value={displaySummary.overallCompliancePct} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Compliant</p>
            <p className="text-3xl font-bold text-green-600">{displaySummary.compliant}</p>
          </CardContent>
        </Card>
        <Card className={displaySummary.warnings > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-3xl font-bold text-yellow-600">{displaySummary.warnings}</p>
          </CardContent>
        </Card>
        <Card className={displaySummary.breaches > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Breaches</p>
            <p className="text-3xl font-bold text-red-600">{displaySummary.breaches}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displaySensors.map((sensor) => {
          const cfg = STATUS_CONFIG[sensor.complianceStatus];
          const Icon = sensor.type === "TEMPERATURE_SENSOR" ? Thermometer : Droplets;
          const StatusIcon = cfg.icon;
          const isExpanded = expandedSensor === sensor.id;
          const hasThresholds = sensor.minThreshold !== null && sensor.maxThreshold !== null;

          return (
            <Card
              key={sensor.id}
              className={`border-2 cursor-pointer transition-all ${cfg.color.includes("red") ? "border-red-300" : cfg.color.includes("yellow") ? "border-yellow-300" : "border-gray-200"} ${isExpanded ? "ring-2 ring-blue-300" : ""}`}
              onClick={() => setExpandedSensor(isExpanded ? null : sensor.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${sensor.type === "TEMPERATURE_SENSOR" ? "text-red-400" : "text-blue-400"}`} />
                    <CardTitle className="text-sm font-semibold">{sensor.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sensor.activeAlerts > 0 && (
                      <Badge variant="destructive" className="text-xs">{sensor.activeAlerts} alert{sensor.activeAlerts > 1 ? "s" : ""}</Badge>
                    )}
                    <StatusIcon className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>
                </div>
                <CardDescription className="text-xs">{sensor.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-3xl font-bold">
                      {sensor.lastReading !== null ? sensor.lastReading.toFixed(1) : "—"}
                    </span>
                    <span className="text-lg text-muted-foreground ml-1">{sensor.unit}</span>
                  </div>
                  <Badge className={`${cfg.color} border`}>{cfg.label}</Badge>
                </div>
                {hasThresholds && (
                  <p className="text-xs text-gray-400 mb-3">
                    Range: {sensor.minThreshold}{sensor.unit} – {sensor.maxThreshold}{sensor.unit}
                  </p>
                )}

                {/* Trend chart — shown when expanded or breach */}
                {(isExpanded || sensor.complianceStatus === "breach" || sensor.complianceStatus === "warning") && sensor.trend.length > 0 && (
                  <div className="mt-3 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensor.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                        <YAxis
                          domain={[
                            (Math.min(...sensor.trend.map((t) => t.value)) * 0.98),
                            (Math.max(...sensor.trend.map((t) => t.value)) * 1.02),
                          ]}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12 }}
                          formatter={(v: number) => [`${v.toFixed(1)} ${sensor.unit}`, "Reading"]}
                        />
                        {sensor.maxThreshold !== null && (
                          <ReferenceLine y={sensor.maxThreshold} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Max", fontSize: 10 }} />
                        )}
                        {sensor.minThreshold !== null && (
                          <ReferenceLine y={sensor.minThreshold} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "Min", fontSize: 10 }} />
                        )}
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={sensor.complianceStatus === "breach" ? "#ef4444" : sensor.complianceStatus === "warning" ? "#f59e0b" : "#22c55e"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
