"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface KPI {
  label: string;
  value: string | number;
  trend: "up" | "down" | "flat";
  delta: string;
  good: boolean;
}

interface ParetoItem {
  defectType: string;
  count: number;
  percentage: number;
  cumulative: number;
}

interface TrendPoint {
  period: string;
  passRate: number;
  defectRate: number;
  inspections: number;
}

const MOCK_KPIS: KPI[] = [
  {
    label: "First-Pass Yield",
    value: "94.2%",
    trend: "up",
    delta: "+1.3% vs last month",
    good: true,
  },
  {
    label: "Defect Rate",
    value: "5.8%",
    trend: "down",
    delta: "−1.3% vs last month",
    good: true,
  },
  {
    label: "Inspection Cycle Time (avg)",
    value: "2.4 hrs",
    trend: "down",
    delta: "−0.3 hrs",
    good: true,
  },
  {
    label: "Cost of Poor Quality",
    value: "$18,450",
    trend: "up",
    delta: "+$1,200 vs last month",
    good: false,
  },
  {
    label: "Supplier Reject Rate",
    value: "3.1%",
    trend: "flat",
    delta: "No change",
    good: true,
  },
  {
    label: "Open NCRs",
    value: 14,
    trend: "up",
    delta: "+2 this week",
    good: false,
  },
];

const MOCK_PARETO: ParetoItem[] = [
  { defectType: "Dimensional OOT", count: 42, percentage: 31, cumulative: 31 },
  { defectType: "Surface Finish", count: 28, percentage: 21, cumulative: 52 },
  { defectType: "Wrong Material", count: 21, percentage: 16, cumulative: 68 },
  {
    defectType: "Missing Components",
    count: 17,
    percentage: 13,
    cumulative: 81,
  },
  { defectType: "Labelling Error", count: 12, percentage: 9, cumulative: 90 },
  { defectType: "Other", count: 14, percentage: 10, cumulative: 100 },
];

const MOCK_TREND: TrendPoint[] = [
  { period: "Sep 25", passRate: 91.0, defectRate: 9.0, inspections: 180 },
  { period: "Oct 25", passRate: 92.4, defectRate: 7.6, inspections: 195 },
  { period: "Nov 25", passRate: 91.8, defectRate: 8.2, inspections: 210 },
  { period: "Dec 25", passRate: 93.1, defectRate: 6.9, inspections: 188 },
  { period: "Jan 26", passRate: 92.9, defectRate: 7.1, inspections: 223 },
  { period: "Feb 26", passRate: 94.2, defectRate: 5.8, inspections: 241 },
];

export default function QCAnalyticsPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pareto, setPareto] = useState<ParetoItem[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6m");

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, paretoRes, trendRes] = await Promise.all([
        fetch(`/api/qc/analytics/kpis?range=${range}`),
        fetch(`/api/qc/analytics/pareto?range=${range}`),
        fetch(`/api/qc/analytics/trends?range=${range}`),
      ]);
      const [kpiData, paretoData, trendData] = await Promise.all([
        kpiRes.json(),
        paretoRes.json(),
        trendRes.json(),
      ]);
      setKpis(kpiData.kpis ?? MOCK_KPIS);
      setPareto(paretoData.pareto ?? MOCK_PARETO);
      setTrend(trendData.trend ?? MOCK_TREND);
    } catch {
      setKpis(MOCK_KPIS);
      setPareto(MOCK_PARETO);
      setTrend(MOCK_TREND);
    } finally {
      setLoading(false);
    }
  };

  const trendIcon = (t: KPI["trend"], good: boolean) => {
    if (t === "up")
      return good ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-red-500" />
      );
    if (t === "down")
      return good ? (
        <TrendingDown className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      );
    return <span className="h-4 w-4 inline-block text-gray-400">—</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/qc")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> QC
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="h-7 w-7 text-indigo-600" />
                QC Analytics
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                KPIs, Pareto analysis, and quality trends
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["1m", "3m", "6m", "12m"].map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {kpi.value}
                        </p>
                        <p
                          className={`text-xs mt-1 ${kpi.good ? "text-green-600" : "text-red-500"}`}
                        >
                          {kpi.delta}
                        </p>
                      </div>
                      <div className="mt-1">
                        {trendIcon(kpi.trend, kpi.good)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pareto Chart (visual bar) */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">
                  Defect Pareto — Top Defect Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pareto.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.defectType}</span>
                        <span className="text-gray-500 font-mono">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${i < 3 ? "bg-red-500" : "bg-orange-300"}`}
                          style={{ width: `${item.percentage * 3}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Cumulative: {item.cumulative}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Monthly Quality Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-gray-600">
                          Period
                        </th>
                        <th className="text-right py-2 px-4 font-medium text-gray-600">
                          Inspections
                        </th>
                        <th className="text-right py-2 px-4 font-medium text-gray-600">
                          Pass Rate
                        </th>
                        <th className="text-right py-2 px-4 font-medium text-gray-600">
                          Defect Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trend.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="py-2 pr-4 text-gray-800">
                            {row.period}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-600">
                            {row.inspections}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span
                              className={`font-medium ${row.passRate >= 93 ? "text-green-600" : row.passRate >= 90 ? "text-yellow-600" : "text-red-500"}`}
                            >
                              {row.passRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span
                              className={`font-medium ${row.defectRate <= 7 ? "text-green-600" : row.defectRate <= 9 ? "text-yellow-600" : "text-red-500"}`}
                            >
                              {row.defectRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
