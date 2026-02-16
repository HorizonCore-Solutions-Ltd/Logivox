"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReceivingPerformanceMetricsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, shiftsRes, performersRes] = await Promise.all([
        fetch("/api/receiving/performance-metrics?action=dashboard"),
        fetch("/api/receiving/performance-metrics?action=shift-comparison"),
        fetch("/api/receiving/performance-metrics?action=top-performers"),
      ]);

      const dashboardData = await dashboardRes.json();
      const shiftsData = await shiftsRes.json();
      const performersData = await performersRes.json();

      setDashboard(dashboardData.dashboard);
      setShifts(shiftsData.shifts || []);
      setTopPerformers(performersData.topPerformers || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const getPerformanceColor = (value: number, metric: string) => {
    // Define thresholds for each metric
    const thresholds: Record<string, { good: number; warning: number }> = {
      velocity: { good: 40, warning: 30 },
      dockUtilization: { good: 80, warning: 60 },
      productivity: { good: 40, warning: 30 },
      cycleTime: { good: 45, warning: 60 }, // Lower is better
      slaCompliance: { good: 95, warning: 85 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "text-gray-900";

    // For cycle time, lower is better
    if (metric === "cycleTime") {
      if (value <= threshold.good) return "text-green-600";
      if (value <= threshold.warning) return "text-yellow-600";
      return "text-red-600";
    }

    // For others, higher is better
    if (value >= threshold.good) return "text-green-600";
    if (value >= threshold.warning) return "text-yellow-600";
    return "text-red-600";
  };

  const getShiftBadgeColor = (shift: string) => {
    switch (shift) {
      case "DAY":
        return "bg-yellow-100 text-yellow-800";
      case "EVENING":
        return "bg-orange-100 text-orange-800";
      case "NIGHT":
        return "bg-blue-100 text-blue-800";
      case "WEEKEND":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Receiving Performance Metrics
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time KPIs and performance tracking
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Receiving Velocity</div>
          <div
            className={`text-2xl font-bold mt-1 ${getPerformanceColor(
              dashboard?.velocity || 0,
              "velocity",
            )}`}
          >
            {dashboard?.velocity?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">units/hour</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${Math.min((dashboard?.velocity / 50) * 100, 100)}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Dock Utilization</div>
          <div
            className={`text-2xl font-bold mt-1 ${getPerformanceColor(
              dashboard?.dockUtilization || 0,
              "dockUtilization",
            )}`}
          >
            {dashboard?.dockUtilization?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">of capacity</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${dashboard?.dockUtilization || 0}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Worker Productivity</div>
          <div
            className={`text-2xl font-bold mt-1 ${getPerformanceColor(
              dashboard?.productivity || 0,
              "productivity",
            )}`}
          >
            {dashboard?.productivity?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">units/worker-hour</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{
                width: `${Math.min((dashboard?.productivity / 50) * 100, 100)}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Cycle Time</div>
          <div
            className={`text-2xl font-bold mt-1 ${getPerformanceColor(
              dashboard?.cycleTime || 0,
              "cycleTime",
            )}`}
          >
            {dashboard?.cycleTime?.toFixed(0) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">minutes/shipment</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, ((90 - (dashboard?.cycleTime || 0)) / 90) * 100)}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">SLA Compliance</div>
          <div
            className={`text-2xl font-bold mt-1 ${getPerformanceColor(
              dashboard?.slaCompliance || 0,
              "slaCompliance",
            )}`}
          >
            {dashboard?.slaCompliance?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">on-time completion</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${dashboard?.slaCompliance || 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shifts">Shift Comparison</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Performance Targets
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Receiving Velocity</div>
                    <div className="text-sm text-gray-600">
                      Target: 40 units/hour
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor(
                      dashboard?.velocity || 0,
                      "velocity",
                    )}`}
                  >
                    {dashboard?.velocity >= 40 ? "✓" : "○"}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Dock Utilization</div>
                    <div className="text-sm text-gray-600">Target: 80%</div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor(
                      dashboard?.dockUtilization || 0,
                      "dockUtilization",
                    )}`}
                  >
                    {dashboard?.dockUtilization >= 80 ? "✓" : "○"}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Worker Productivity</div>
                    <div className="text-sm text-gray-600">
                      Target: 40 units/worker-hour
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor(
                      dashboard?.productivity || 0,
                      "productivity",
                    )}`}
                  >
                    {dashboard?.productivity >= 40 ? "✓" : "○"}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Cycle Time</div>
                    <div className="text-sm text-gray-600">
                      Target: ≤45 minutes/shipment
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor(
                      dashboard?.cycleTime || 0,
                      "cycleTime",
                    )}`}
                  >
                    {dashboard?.cycleTime <= 45 ? "✓" : "○"}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">SLA Compliance</div>
                    <div className="text-sm text-gray-600">Target: ≥95%</div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getPerformanceColor(
                      dashboard?.slaCompliance || 0,
                      "slaCompliance",
                    )}`}
                  >
                    {dashboard?.slaCompliance >= 95 ? "✓" : "○"}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900 mb-1">
                    📈 Velocity Trend
                  </div>
                  <div className="text-sm text-blue-800">
                    {dashboard?.velocity >= 40
                      ? "Exceeding target. Excellent throughput performance."
                      : "Below target. Consider optimizing workflows or adding resources."}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 mb-1">
                    🚪 Dock Capacity
                  </div>
                  <div className="text-sm text-green-800">
                    {dashboard?.dockUtilization >= 95
                      ? "Near capacity. Consider expanding dock doors or extending hours."
                      : dashboard?.dockUtilization >= 80
                        ? "Good utilization. Operating efficiently."
                        : "Underutilized. Opportunity for more appointments."}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-medium text-purple-900 mb-1">
                    👥 Workforce
                  </div>
                  <div className="text-sm text-purple-800">
                    {dashboard?.productivity >= 40
                      ? "High productivity. Workers performing well."
                      : "Productivity opportunity. Review training or tools."}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-yellow-900 mb-1">
                    ⏱️ Speed
                  </div>
                  <div className="text-sm text-yellow-800">
                    {dashboard?.cycleTime <= 45
                      ? "Meeting cycle time targets. Fast processing."
                      : "Slower than target. Identify bottlenecks."}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Monthly Savings */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold text-lg mb-2">Financial Impact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Monthly Savings</div>
                <div className="text-2xl font-bold text-green-600">
                  ${(dashboard?.monthlySavings || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${((dashboard?.monthlySavings || 0) * 12).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-purple-600">295%</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Shift Comparison Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shift Performance</h2>
            {shifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No shift data available
              </div>
            ) : (
              <div className="space-y-4">
                {shifts.map((shift) => (
                  <div
                    key={shift.shift}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getShiftBadgeColor(shift.shift)}>
                          {shift.shift}
                        </Badge>
                        <div>
                          <div className="font-semibold">
                            {shift.avgProductivity?.toFixed(1)}{" "}
                            units/worker-hour
                          </div>
                          <div className="text-sm text-gray-600">
                            Average productivity
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Data points</div>
                        <div className="font-medium">{shift.dataPoints}</div>
                      </div>
                    </div>

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.min((shift.avgProductivity / 50) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="performers" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Top Performers (7 Days)
            </h2>
            {topPerformers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No performance data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Worker ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Productivity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Peak Performance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topPerformers.map((performer, index) => (
                      <tr key={performer.workerId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-2xl">
                            {index === 0
                              ? "🥇"
                              : index === 1
                                ? "🥈"
                                : index === 2
                                  ? "🥉"
                                  : `#${index + 1}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {performer.workerId}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-green-600">
                            {performer.avgProductivity?.toFixed(1)} units/hr
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {performer.peakProductivity?.toFixed(1)} units/hr
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {performer.dataPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Last updated:{" "}
        {dashboard?.lastUpdated
          ? new Date(dashboard.lastUpdated).toLocaleString()
          : "N/A"}{" "}
        • Auto-refresh every 30s
      </div>
    </div>
  );
}
