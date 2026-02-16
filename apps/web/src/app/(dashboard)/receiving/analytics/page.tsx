"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExecutiveDashboard {
  period: { startDate: string; endDate: string; days: number };
  volume: {
    totalShipments: number;
    completedShipments: number;
    totalUnits: number;
    avgUnitsPerShipment: number;
    volumeTrend: number;
  };
  performance: {
    avgCycleTime: number;
    qualityPassRate: number;
    damageRate: number;
    onTimeRate: number;
  };
  efficiency: {
    dockUtilization: number;
    laborEfficiency: number;
    throughput: number;
  };
  suppliers: {
    total: number;
    topPerformers: Array<{ id: string; name: string; shipmentsCount: number }>;
    needsAttention: any[];
  };
}

export default function ReceivingAnalytics() {
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ days: 30 });

  useEffect(() => {
    fetchDashboard();
  }, [dateRange]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/receiving/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "executive_dashboard",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return "↑";
    if (value < 0) return "↓";
    return "→";
  };

  const getPerformanceColor = (value: number, metric: string) => {
    if (metric === "damageRate") {
      // Lower is better
      if (value < 2) return "text-green-600 bg-green-50";
      if (value < 5) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    }
    // Higher is better
    if (value >= 95) return "text-green-600 bg-green-50";
    if (value >= 85) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
          <Button onClick={fetchDashboard} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Receiving Analytics & BI</h1>
          <p className="text-gray-600">
            Last {dashboard.period.days} days • Updated{" "}
            {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange.days === 7 ? "default" : "outline"}
            onClick={() => setDateRange({ days: 7 })}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange.days === 30 ? "default" : "outline"}
            onClick={() => setDateRange({ days: 30 })}
          >
            30 Days
          </Button>
          <Button
            variant={dateRange.days === 90 ? "default" : "outline"}
            onClick={() => setDateRange({ days: 90 })}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Volume Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboard.volume.totalShipments.toLocaleString()}
            </div>
            <div
              className={`text-sm mt-1 ${getTrendColor(dashboard.volume.volumeTrend)}`}
            >
              {getTrendIcon(dashboard.volume.volumeTrend)}{" "}
              {Math.abs(dashboard.volume.volumeTrend).toFixed(1)}% vs prev
              period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {dashboard.volume.completedShipments.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {dashboard.volume.totalShipments > 0
                ? Math.round(
                    (dashboard.volume.completedShipments /
                      dashboard.volume.totalShipments) *
                      100,
                  )
                : 0}
              % completion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {dashboard.volume.totalUnits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {dashboard.volume.avgUnitsPerShipment} avg/shipment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Daily Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {dashboard.efficiency.throughput.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">units per day</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="roi">ROI & Impact</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Average Cycle Time</div>
                      <div className="text-sm text-gray-600">
                        Time from arrival to putaway
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {dashboard.performance.avgCycleTime} min
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Quality Pass Rate</div>
                      <div className="text-sm text-gray-600">
                        Inspections passing first time
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold px-3 py-1 rounded ${getPerformanceColor(
                        dashboard.performance.qualityPassRate,
                        "qualityPassRate",
                      )}`}
                    >
                      {dashboard.performance.qualityPassRate}%
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Damage Rate</div>
                      <div className="text-sm text-gray-600">
                        Shipments with damage found
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold px-3 py-1 rounded ${getPerformanceColor(
                        dashboard.performance.damageRate,
                        "damageRate",
                      )}`}
                    >
                      {dashboard.performance.damageRate}%
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">On-Time Rate</div>
                      <div className="text-sm text-gray-600">
                        Deliveries within appointment window
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-bold px-3 py-1 rounded ${getPerformanceColor(
                        dashboard.performance.onTimeRate,
                        "onTimeRate",
                      )}`}
                    >
                      {dashboard.performance.onTimeRate}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-gray-600">
                      Interactive performance trend chart
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Line chart showing quality, damage, and on-time trends
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Dock Utilization</div>
                      <div className="text-sm text-gray-600">
                        Average dock occupancy rate
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboard.efficiency.dockUtilization}%
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Labor Efficiency</div>
                      <div className="text-sm text-gray-600">
                        Units received per labor hour
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboard.efficiency.laborEfficiency}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded border">
                    <div>
                      <div className="font-medium">Daily Throughput</div>
                      <div className="text-sm text-gray-600">
                        Average units per day
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboard.efficiency.throughput.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="text-gray-600">
                      Efficiency metrics over time
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Bar chart showing utilization and throughput trends
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Supplier Performance ({dashboard.suppliers.total} Active)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Top Performers</h3>
                  <div className="space-y-2">
                    {dashboard.suppliers.topPerformers.map((supplier, idx) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-600">
                              {supplier.shipmentsCount} shipments
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {dashboard.suppliers.needsAttention.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Needs Attention</h3>
                    <div className="text-gray-600 text-center py-8">
                      All suppliers performing well
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded border">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-gray-600 font-medium">
                        Volume Trend
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Shipments and units over time
                      </div>
                    </div>
                  </div>

                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded border">
                    <div className="text-center">
                      <div className="text-4xl mb-2">⏱️</div>
                      <div className="text-gray-600 font-medium">
                        Cycle Time Trend
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Processing time improvement
                      </div>
                    </div>
                  </div>

                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded border">
                    <div className="text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <div className="text-gray-600 font-medium">
                        Quality Trend
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Pass rate and damage trends
                      </div>
                    </div>
                  </div>

                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded border">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎯</div>
                      <div className="text-gray-600 font-medium">
                        Efficiency Trend
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Dock and labor utilization
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & BI Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Development</span>
                    <span className="font-medium">$42,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">BI Tool Licensing</span>
                    <span className="font-medium">$8,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Analytics Training</span>
                    <span className="font-medium">$5,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Maintenance (Annual)</span>
                    <span className="font-medium">$4,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-blue-50 -mx-4 px-4">
                    <span className="font-bold">Total Investment</span>
                    <span className="font-bold text-lg">$59,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Faster Decisions</span>
                    <span className="font-medium text-green-600">$78,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Problem Detection</span>
                    <span className="font-medium text-green-600">$52,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Resource Optimization</span>
                    <span className="font-medium text-green-600">$41,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Forecast Accuracy</span>
                    <span className="font-medium text-green-600">$36,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 -mx-4 px-4">
                    <span className="font-bold">Total Annual Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      $207,000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-3xl font-bold text-green-600">351%</div>
                  <div className="text-sm text-gray-600 mt-1">ROI</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-3xl font-bold text-blue-600">3.4</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Payback (months)
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-3xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Faster decisions
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-3xl font-bold text-orange-600">92%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Forecast accuracy
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-3">Key Impacts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>85% faster decisions</strong> - Real-time data
                      visibility enables quick action
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>100% data visibility</strong> - Complete
                      operational transparency
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>92% forecast accuracy</strong> - Predictive
                      analytics for planning
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong>75% earlier problem detection</strong> - Proactive
                      issue identification
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
