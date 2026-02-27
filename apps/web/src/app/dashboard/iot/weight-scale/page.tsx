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
import { Activity, RefreshCw, CheckCircle2, XCircle, Scale, Package, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface ScaleDevice {
  id: string;
  name: string;
  location: string;
  status: string;
  passCount: number;
  failCount: number;
  passRate: number;
  lastWeight: number | null;
}

interface VerificationEvent {
  time: string;
  scale: string;
  product: string;
  expected: number;
  actual: number;
  variance: number;
  result: "pass" | "fail";
}

interface ScaleSummary {
  totalScales: number;
  activeScales: number;
  totalVerificationsToday: number;
  totalPasses: number;
  totalFails: number;
  overallPassRate: number;
}

const DEMO_SCALES: ScaleDevice[] = [
  { id: "SC1", name: "Pack Station 1", location: "Packing Area - Station 1", status: "ACTIVE", passCount: 312, failCount: 14, passRate: 95.7, lastWeight: 2.34 },
  { id: "SC2", name: "Pack Station 2", location: "Packing Area - Station 2", status: "ACTIVE", passCount: 287, failCount: 8, passRate: 97.3, lastWeight: 1.12 },
  { id: "SC3", name: "Pack Station 3", location: "Packing Area - Station 3", status: "ACTIVE", passCount: 198, failCount: 31, passRate: 86.5, lastWeight: 3.77 },
  { id: "SC4", name: "Receiving Scale", location: "Receiving Dock", status: "ACTIVE", passCount: 155, failCount: 3, passRate: 98.1, lastWeight: 18.50 },
  { id: "SC5", name: "Outbound Check", location: "Shipping Dock", status: "INACTIVE", passCount: 0, failCount: 0, passRate: 0, lastWeight: null },
];

const DEMO_FEED: VerificationEvent[] = [
  { time: "14:33:42", scale: "Pack Station 1", product: "SKU-7734 / 24pk Beverages", expected: 11.2, actual: 11.18, variance: -0.02, result: "pass" },
  { time: "14:33:38", scale: "Pack Station 2", product: "SKU-2291 / Apparel Box A", expected: 1.8, actual: 3.21, variance: 1.41, result: "fail" },
  { time: "14:33:29", scale: "Pack Station 3", product: "SKU-8812 / Electronics Kit", expected: 2.5, actual: 2.49, variance: -0.01, result: "pass" },
  { time: "14:33:14", scale: "Pack Station 1", product: "SKU-1107 / Medical Supply", expected: 0.9, actual: 0.91, variance: 0.01, result: "pass" },
  { time: "14:33:02", scale: "Receiving Scale", product: "SKU-3354 / Books Carton", expected: 18.0, actual: 23.5, variance: 5.5, result: "fail" },
  { time: "14:32:55", scale: "Pack Station 2", product: "SKU-5561 / Grocery Pallet", expected: 3.1, actual: 3.12, variance: 0.02, result: "pass" },
  { time: "14:32:44", scale: "Pack Station 3", product: "SKU-9920 / Sporting Goods", expected: 4.4, actual: 4.42, variance: 0.02, result: "pass" },
  { time: "14:32:30", scale: "Pack Station 1", product: "SKU-6643 / Hardware Kit", expected: 7.6, actual: 7.64, variance: 0.04, result: "pass" },
];

export default function WeightScalePage() {
  const [scales, setScales] = useState<ScaleDevice[]>([]);
  const [feed, setFeed] = useState<VerificationEvent[]>([]);
  const [summary, setSummary] = useState<ScaleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/iot/weight-scale");
      if (res.ok) {
        const data = await res.json();
        setScales(data.scales ?? []);
        setFeed(data.verificationFeed ?? []);
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
    const i = setInterval(fetchData, 30_000);
    return () => clearInterval(i);
  }, [autoRefresh, fetchData]);

  const displayScales = scales.length > 0 ? scales : DEMO_SCALES;
  const displayFeed = feed.length > 0 ? feed : DEMO_FEED;
  const displaySummary: ScaleSummary = summary ?? {
    totalScales: displayScales.length,
    activeScales: displayScales.filter((s) => s.status === "ACTIVE").length,
    totalVerificationsToday: displayScales.reduce((acc, s) => acc + s.passCount + s.failCount, 0),
    totalPasses: displayScales.reduce((acc, s) => acc + s.passCount, 0),
    totalFails: displayScales.reduce((acc, s) => acc + s.failCount, 0),
    overallPassRate: (() => {
      const total = displayScales.reduce((acc, s) => acc + s.passCount + s.failCount, 0);
      const pass = displayScales.reduce((acc, s) => acc + s.passCount, 0);
      return total > 0 ? Math.round((pass / total) * 100 * 10) / 10 : 0;
    })(),
  };

  const pieData = [
    { name: "Pass", value: displaySummary.totalPasses },
    { name: "Fail", value: displaySummary.totalFails },
  ];

  const barData = displayScales
    .filter((s) => s.passCount + s.failCount > 0)
    .map((s) => ({
      name: s.name.replace("Pack Station", "PS"),
      pass: s.passCount,
      fail: s.failCount,
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-teal-500" />
            Weight & Scale Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Packing station accuracy · Pass/fail rates per scale
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-teal-200 bg-teal-50 col-span-2 md:col-span-1">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Overall Pass Rate</p>
            <p className="text-4xl font-bold text-teal-700">{displaySummary.overallPassRate}%</p>
            <Progress value={displaySummary.overallPassRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Verifications Today</p>
            <p className="text-3xl font-bold">{displaySummary.totalVerificationsToday.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Passed</p>
            <p className="text-3xl font-bold text-green-600">{displaySummary.totalPasses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={displaySummary.totalFails > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className={`text-3xl font-bold ${displaySummary.totalFails > 0 ? "text-red-600" : "text-gray-400"}`}>
              {displaySummary.totalFails.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Per-scale cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Scale Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayScales.map((scale) => {
              const total = scale.passCount + scale.failCount;
              const needsAttention = scale.passRate > 0 && scale.passRate < 90;
              return (
                <div
                  key={scale.id}
                  className={`p-3 rounded-lg border ${needsAttention ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        {needsAttention && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        {scale.name}
                      </span>
                      <p className="text-xs text-gray-400">{scale.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={scale.status === "ACTIVE" ? "default" : "secondary"}
                        className={`text-xs ${scale.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}`}
                      >
                        {scale.status}
                      </Badge>
                      {scale.lastWeight !== null && (
                        <p className="text-xs text-gray-400 mt-0.5">Last: {scale.lastWeight} kg</p>
                      )}
                    </div>
                  </div>
                  {total > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <Progress
                          value={scale.passRate}
                          className={`h-1.5 flex-1 ${needsAttention ? "bg-red-100" : ""}`}
                        />
                        <span className={`text-xs font-bold ${needsAttention ? "text-red-600" : "text-green-600"}`}>
                          {scale.passRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="text-green-600">{scale.passCount} pass</span>
                        <span className="text-red-500">{scale.failCount} fail</span>
                        <span>{total} total</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">No verifications today</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today&apos;s Pass/Fail Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Pass: <strong>{displaySummary.totalPasses.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Fail: <strong>{displaySummary.totalFails.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar chart per scale */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass/Fail by Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="pass" stackId="a" fill="#22c55e" />
                  <Bar dataKey="fail" stackId="a" fill="#ef4444" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Verification Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Live Verification Feed
          </CardTitle>
          <CardDescription>Most recent weight checks — ± 5% tolerance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-1.5 pr-4">Time</th>
                  <th className="text-left py-1.5 pr-4">Scale</th>
                  <th className="text-left py-1.5 pr-4">Product</th>
                  <th className="text-right py-1.5 pr-4">Expected</th>
                  <th className="text-right py-1.5 pr-4">Actual</th>
                  <th className="text-right py-1.5 pr-4">Variance</th>
                  <th className="text-center py-1.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {displayFeed.map((event, i) => (
                  <tr key={i} className={`border-b last:border-0 ${event.result === "fail" ? "bg-red-50" : ""}`}>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">{event.time}</td>
                    <td className="py-2 pr-4 text-xs text-gray-600">{event.scale}</td>
                    <td className="py-2 pr-4 text-xs font-medium max-w-xs truncate">{event.product}</td>
                    <td className="py-2 pr-4 text-right text-xs">{event.expected} kg</td>
                    <td className="py-2 pr-4 text-right text-xs font-medium">{event.actual} kg</td>
                    <td className={`py-2 pr-4 text-right text-xs font-bold ${Math.abs(event.variance) > 0.5 ? "text-red-600" : "text-gray-400"}`}>
                      {event.variance > 0 ? "+" : ""}{event.variance.toFixed(2)} kg
                    </td>
                    <td className="py-2 text-center">
                      {event.result === "pass" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
