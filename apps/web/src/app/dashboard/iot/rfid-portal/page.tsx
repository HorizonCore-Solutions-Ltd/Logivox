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
import { Activity, RefreshCw, Radio, Wifi, WifiOff, ScanLine, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface RFIDReader {
  id: string;
  name: string;
  location: string;
  status: string;
  scanRate: number;
  scansToday: number;
  activeAlerts: number;
  hourlyTrend: Array<{ hour: string; scans: number }>;
}

interface ScanEvent {
  time: string;
  reader: string;
  tag: string;
  product: string;
  location: string;
}

interface RFIDSummary {
  totalReaders: number;
  onlineReaders: number;
  offlineReaders: number;
  totalScansToday: number;
  avgScanRatePerHr: number;
}

const DEMO_READERS: RFIDReader[] = [
  { id: "R1", name: "Dock Door 1", location: "Receiving Dock - Door 1", status: "ACTIVE", scanRate: 142, scansToday: 1892, activeAlerts: 0, hourlyTrend: [{ hour: "08:00", scans: 90 }, { hour: "09:00", scans: 145 }, { hour: "10:00", scans: 178 }, { hour: "11:00", scans: 203 }, { hour: "12:00", scans: 165 }, { hour: "13:00", scans: 142 }, { hour: "14:00", scans: 158 }] },
  { id: "R2", name: "Dock Door 2", location: "Receiving Dock - Door 2", status: "ACTIVE", scanRate: 98, scansToday: 1244, activeAlerts: 0, hourlyTrend: [{ hour: "08:00", scans: 60 }, { hour: "09:00", scans: 98 }, { hour: "10:00", scans: 130 }, { hour: "11:00", scans: 155 }, { hour: "12:00", scans: 120 }, { hour: "13:00", scans: 98 }, { hour: "14:00", scans: 88 }] },
  { id: "R3", name: "Pick Zone A", location: "Aisle A Entry", status: "ACTIVE", scanRate: 67, scansToday: 834, activeAlerts: 0, hourlyTrend: [{ hour: "08:00", scans: 40 }, { hour: "09:00", scans: 68 }, { hour: "10:00", scans: 82 }, { hour: "11:00", scans: 95 }, { hour: "12:00", scans: 70 }, { hour: "13:00", scans: 67 }, { hour: "14:00", scans: 74 }] },
  { id: "R4", name: "Shipping Gate", location: "Outbound Dock", status: "ACTIVE", scanRate: 210, scansToday: 2610, activeAlerts: 0, hourlyTrend: [{ hour: "08:00", scans: 120 }, { hour: "09:00", scans: 198 }, { hour: "10:00", scans: 245 }, { hour: "11:00", scans: 310 }, { hour: "12:00", scans: 280 }, { hour: "13:00", scans: 210 }, { hour: "14:00", scans: 220 }] },
  { id: "R5", name: "Cold Storage Entry", location: "Cold Storage Gate", status: "INACTIVE", scanRate: 0, scansToday: 0, activeAlerts: 1, hourlyTrend: [] },
];

const DEMO_SCAN_FEED: ScanEvent[] = [
  { time: "14:33:21", reader: "Shipping Gate", tag: "EPC-A8F3329", product: "SKU-7734 / 24pk Beverages", location: "SHIP-OUT" },
  { time: "14:33:18", reader: "Shipping Gate", tag: "EPC-B2C4418", product: "SKU-2291 / Apparel Box A", location: "SHIP-OUT" },
  { time: "14:33:10", reader: "Dock Door 1", tag: "EPC-C9E1104", product: "SKU-8812 / Electronics Kit", location: "RECV-IN" },
  { time: "14:33:05", reader: "Pick Zone A", tag: "EPC-D4A7723", product: "SKU-1107 / Medical Supply", location: "PICK" },
  { time: "14:32:58", reader: "Shipping Gate", tag: "EPC-E6F0091", product: "SKU-3354 / Books Carton", location: "SHIP-OUT" },
  { time: "14:32:45", reader: "Dock Door 2", tag: "EPC-F1G8807", product: "SKU-5561 / Grocery Pallet", location: "RECV-IN" },
  { time: "14:32:31", reader: "Pick Zone A", tag: "EPC-G3H2215", product: "SKU-9920 / Sporting Goods", location: "PICK" },
  { time: "14:32:20", reader: "Shipping Gate", tag: "EPC-H5I4432", product: "SKU-6643 / Hardware Kit", location: "SHIP-OUT" },
];

export default function RFIDPortalPage() {
  const { toast } = useToast();
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [scanFeed, setScanFeed] = useState<ScanEvent[]>([]);
  const [summary, setSummary] = useState<RFIDSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedReader, setSelectedReader] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/iot/rfid-portal");
      if (res.ok) {
        const data = await res.json();
        setReaders(data.readers ?? []);
        setScanFeed(data.scanFeed ?? []);
        setSummary(data.summary ?? null);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const i = setInterval(fetchData, 15_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const displayReaders = readers.length > 0 ? readers : DEMO_READERS;
  const displayFeed = scanFeed.length > 0 ? scanFeed : DEMO_SCAN_FEED;
  const displaySummary: RFIDSummary = summary ?? {
    totalReaders: displayReaders.length,
    onlineReaders: displayReaders.filter((r) => r.status === "ACTIVE").length,
    offlineReaders: displayReaders.filter((r) => r.status !== "ACTIVE").length,
    totalScansToday: displayReaders.reduce((s, r) => s + r.scansToday, 0),
    avgScanRatePerHr: Math.round(
      displayReaders.filter((r) => r.status === "ACTIVE").reduce((s, r) => s + r.scanRate, 0) /
        Math.max(displayReaders.filter((r) => r.status === "ACTIVE").length, 1),
    ),
  };

  const activeReader = displayReaders.find((r) => r.id === selectedReader);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6 text-indigo-500" />
            RFID Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reader status, scan rates, and live tag feed
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
            {autoRefresh ? "Live (15s)" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Readers</p>
            <p className="text-3xl font-bold">{displaySummary.totalReaders}</p>
            <p className="text-xs mt-1 text-green-600">{displaySummary.onlineReaders} online · <span className="text-gray-400">{displaySummary.offlineReaders} offline</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Scans Today</p>
            <p className="text-3xl font-bold text-indigo-600">{displaySummary.totalScansToday.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Avg Scan Rate</p>
            <p className="text-3xl font-bold text-blue-600">{displaySummary.avgScanRatePerHr}</p>
            <p className="text-xs text-gray-400 mt-0.5">scans / hr per reader</p>
          </CardContent>
        </Card>
        <Card className={displaySummary.offlineReaders > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Network Health</p>
            <p className={`text-3xl font-bold ${displaySummary.offlineReaders > 0 ? "text-orange-600" : "text-green-600"}`}>
              {Math.round((displaySummary.onlineReaders / Math.max(displaySummary.totalReaders, 1)) * 100)}%
            </p>
            <p className="text-xs text-gray-400 mt-0.5">readers online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Reader Status Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Reader Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayReaders.map((reader) => (
              <button
                key={reader.id}
                onClick={() => setSelectedReader(selectedReader === reader.id ? null : reader.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-gray-50 ${selectedReader === reader.id ? "ring-2 ring-blue-300 bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {reader.status === "ACTIVE" ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-400" />
                    )}
                    <span className="font-medium text-sm">{reader.name}</span>
                    {reader.activeAlerts > 0 && (
                      <Badge variant="destructive" className="text-xs">!</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-bold ${reader.status === "ACTIVE" ? "text-indigo-600" : "text-gray-300"}`}>
                      {reader.scanRate}
                    </span>
                    <span className="text-xs text-gray-400"> /hr</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 ml-6">{reader.location}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chart or Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {activeReader ? (
                <><TrendingUp className="h-4 w-4" /> {activeReader.name} — Hourly Trend</>
              ) : (
                <><Radio className="h-4 w-4" /> Live Scan Feed</>
              )}
            </CardTitle>
            {activeReader && (
              <CardDescription>{activeReader.scansToday.toLocaleString()} total scans today</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {activeReader && activeReader.hourlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeReader.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, "Scans"]} />
                  <Bar dataKey="scans" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {displayFeed.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{event.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.product}</p>
                      <p className="text-xs text-gray-400">{event.reader} · {event.tag}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{event.location}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
