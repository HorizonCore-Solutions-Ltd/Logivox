"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, CheckCircle, Plus } from "lucide-react";

interface SPCChart {
  id: string;
  chartId: string;
  processName: string;
  characteristic: string;
  unit: string;
  usl: number;
  lsl: number;
  ucl: number;
  lcl: number;
  mean: number;
  cpk: number;
  cp: number;
  status: "IN_CONTROL" | "WARNING" | "OUT_OF_CONTROL";
  lastUpdated: string;
  sampleSize: number;
  recentValues: number[];
  violatedRules: string[];
}

const MOCK: SPCChart[] = [
  {
    id: "1",
    chartId: "SPC-001",
    processName: "CNC Turning — Shaft OD",
    characteristic: "Shaft Outer Diameter",
    unit: "mm",
    usl: 25.05,
    lsl: 24.95,
    ucl: 25.03,
    lcl: 24.97,
    mean: 25.0,
    cpk: 1.45,
    cp: 1.67,
    status: "IN_CONTROL",
    lastUpdated: "2026-03-02T08:00:00Z",
    sampleSize: 5,
    recentValues: [25.01, 24.99, 25.0, 25.02, 24.98, 25.01, 25.0, 24.99],
    violatedRules: [],
  },
  {
    id: "2",
    chartId: "SPC-002",
    processName: "Injection Moulding — Wall Thickness",
    characteristic: "Wall Thickness",
    unit: "mm",
    usl: 3.5,
    lsl: 2.5,
    ucl: 3.3,
    lcl: 2.7,
    mean: 3.0,
    cpk: 0.85,
    cp: 1.0,
    status: "WARNING",
    lastUpdated: "2026-03-02T07:30:00Z",
    sampleSize: 5,
    recentValues: [3.1, 3.2, 3.15, 3.18, 3.25, 3.28, 3.22, 3.3],
    violatedRules: ["Rule 2: 7 points trending up"],
  },
  {
    id: "3",
    chartId: "SPC-003",
    processName: "Welding — Penetration Depth",
    characteristic: "Weld Penetration",
    unit: "mm",
    usl: 8.0,
    lsl: 5.0,
    ucl: 7.5,
    lcl: 5.5,
    mean: 6.5,
    cpk: 0.55,
    cp: 0.83,
    status: "OUT_OF_CONTROL",
    lastUpdated: "2026-03-01T16:00:00Z",
    sampleSize: 3,
    recentValues: [6.8, 7.1, 7.6, 7.9, 8.1, 7.8, 8.2, 7.7],
    violatedRules: ["Rule 1: Point beyond UCL", "Rule 3: 2 of 3 points >2σ"],
  },
];

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.FC<{ className?: string }>; bg: string }
> = {
  IN_CONTROL: {
    color: "text-green-700",
    icon: CheckCircle,
    bg: "bg-green-50 border-green-200",
  },
  WARNING: {
    color: "text-yellow-700",
    icon: AlertTriangle,
    bg: "bg-yellow-50 border-yellow-200",
  },
  OUT_OF_CONTROL: {
    color: "text-red-700",
    icon: AlertTriangle,
    bg: "bg-red-50 border-red-200",
  },
};

const CPK_COLOR = (cpk: number) =>
  cpk >= 1.33
    ? "text-green-600"
    : cpk >= 1.0
      ? "text-yellow-600"
      : "text-red-600";

export default function SPCPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<SPCChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/qc/spc")
      .then((r) => r.json())
      .then((d) =>
        setCharts(Array.isArray(d.charts ?? d) ? (d.charts ?? d) : MOCK),
      )
      .catch(() => setCharts(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: charts.length,
    inControl: charts.filter((c) => c.status === "IN_CONTROL").length,
    warning: charts.filter((c) => c.status === "WARNING").length,
    ooc: charts.filter((c) => c.status === "OUT_OF_CONTROL").length,
  };
  const filtered =
    filter === "all" ? charts : charts.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/qc")}
              className="text-sm text-blue-600 hover:underline mb-1"
            >
              ← Quality Control
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Statistical Process Control
            </h1>
            <p className="mt-1 text-gray-600">
              Monitor process capability and detect out-of-control conditions.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New SPC Chart
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Charts",
              value: stats.total,
              color: "text-gray-900",
            },
            {
              label: "In Control",
              value: stats.inControl,
              color: "text-green-600",
            },
            {
              label: "Warning",
              value: stats.warning,
              color: "text-yellow-600",
            },
            {
              label: "Out of Control",
              value: stats.ooc,
              color: "text-red-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2">
          {["all", "IN_CONTROL", "WARNING", "OUT_OF_CONTROL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              Loading SPC charts…
            </div>
          ) : (
            filtered.map((chart) => {
              const cfg = STATUS_CONFIG[chart.status];
              const Icon = cfg.icon;
              return (
                <Card key={chart.id} className={`border ${cfg.bg}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="font-mono text-sm text-gray-500">
                            {chart.chartId}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {chart.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {chart.processName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {chart.characteristic} ({chart.unit})
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-500 text-xs mb-1">
                          Updated {new Date(chart.lastUpdated).toLocaleString()}
                        </div>
                        <div
                          className={`text-lg font-bold ${CPK_COLOR(chart.cpk)}`}
                        >
                          Cpk {chart.cpk.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cp {chart.cp.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Control limits */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4 text-center">
                      {[
                        { label: "USL", val: chart.usl },
                        { label: "UCL", val: chart.ucl },
                        { label: "Mean", val: chart.mean },
                        { label: "LCL", val: chart.lcl },
                        { label: "LSL", val: chart.lsl },
                        { label: "n", val: chart.sampleSize },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-white rounded p-2 shadow-sm"
                        >
                          <div className="text-xs text-gray-500">
                            {stat.label}
                          </div>
                          <div className="font-semibold text-gray-800">
                            {stat.val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mini run chart */}
                    <div className="flex items-end gap-1 h-12 bg-white rounded p-2 mb-3">
                      {chart.recentValues.map((v, i) => {
                        const range = chart.ucl - chart.lcl;
                        const pct = Math.max(
                          0,
                          Math.min(100, ((v - chart.lcl) / range) * 100),
                        );
                        const isOOC = v > chart.ucl || v < chart.lcl;
                        return (
                          <div key={i} className="flex-1 flex items-end">
                            <div
                              style={{ height: `${pct}%` }}
                              className={`w-full rounded-sm ${isOOC ? "bg-red-500" : "bg-blue-400"}`}
                              title={`${v} ${chart.unit}`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Violated rules */}
                    {chart.violatedRules.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          Western Electric Rules Violated:
                        </p>
                        {chart.violatedRules.map((r, i) => (
                          <p key={i} className="text-xs text-red-600">
                            {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
