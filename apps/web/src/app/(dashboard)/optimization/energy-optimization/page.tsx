"use client";

/**
 * ENERGY OPTIMIZATION DASHBOARD
 * ==============================
 * 
 * System 9 - Outstanding ROI (918%)
 * Investment: $4K → Savings: $37K/year
 * 
 * Features:
 * - Real-time energy monitoring
 * - Peak/off-peak optimization
 * - Equipment scheduling
 * - Cost savings tracking
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface EnergyConsumption {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  currentPower: number;
  avgPower: number;
  peakPower: number;
  dailyConsumption: number;
  monthlyCost: number;
  efficiency: number;
  status: "OPTIMAL" | "INEFFICIENT" | "CRITICAL";
}

interface OptimizationRecommendation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  currentSchedule: string;
  recommendedSchedule: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  savingsPercentage: number;
  priority: string;
  reason: string;
  implementation: string;
}

interface Stats {
  totalEquipment: number;
  monitoredEquipment: number;
  totalDailyConsumption: number;
  totalMonthlyConsumption: number;
  totalMonthlyCost: number;
  avgCostPerKwh: number;
  peakUsageReduction: number;
  offPeakShiftPercentage: number;
  carbonFootprint: number;
  carbonReduction: number;
  monthlySavings: number;
  yearlySavings: number;
  roi: number;
  efficiency: {
    current: number;
    target: number;
    improvement: number;
  };
}

interface HourlyData {
  hour: number;
  rateType: string;
  rate: number;
  consumption: number;
  cost: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EnergyOptimizationDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [consumption, setConsumption] = useState<EnergyConsumption[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [statsRes, consumptionRes, recommendationsRes, hourlyRes] = await Promise.all([
        fetch("/api/optimization/energy-optimization?action=stats"),
        fetch("/api/optimization/energy-optimization?action=consumption"),
        fetch("/api/optimization/energy-optimization?action=recommendations"),
        fetch("/api/optimization/energy-optimization?action=hourly"),
      ]);

      const [statsData, consumptionData, recommendationsData, hourlyDataRes] = await Promise.all([
        statsRes.json(),
        consumptionRes.json(),
        recommendationsRes.json(),
        hourlyRes.json(),
      ]);

      setStats(statsData);
      setConsumption(consumptionData.consumption || []);
      setRecommendations(recommendationsData.recommendations || []);
      setHourlyData(hourlyDataRes.hourly || []);
    } catch (error) {
      console.error("Failed to fetch energy data:", error);
      toast({
        title: "Error",
        description: "Failed to load energy optimization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ACTIONS
  // ============================================

  async function applyRecommendation(rec: OptimizationRecommendation) {
    try {
      const res = await fetch("/api/optimization/energy-optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_RECOMMENDATION",
          recommendationId: rec.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Recommendation Applied",
          description: `${rec.equipmentName} scheduled for optimal energy usage`,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to apply recommendation");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getStatusBadge(status: string) {
    const colors = {
      OPTIMAL: "bg-green-500 text-white",
      INEFFICIENT: "bg-yellow-500 text-white",
      CRITICAL: "bg-red-500 text-white",
    };

    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>;
  }

  function getRateColor(rateType: string) {
    const colors = {
      PEAK: "bg-red-100 text-red-800",
      OFF_PEAK: "bg-yellow-100 text-yellow-800",
      SUPER_OFF_PEAK: "bg-green-100 text-green-800",
    };

    return colors[rateType as keyof typeof colors] || "";
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Energy Optimization Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            Energy Optimization
          </h1>
          <p className="text-gray-600 mt-1">
            Outstanding ROI • 918% ROI • $37K Annual Savings
          </p>
        </div>
        <Button onClick={fetchData}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Daily Consumption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalDailyConsumption.toLocaleString()} kWh
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {stats.avgCostPerKwh.toFixed(3)}$/kWh
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Peak Reduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.peakUsageReduction}%
              </div>
              <Progress value={stats.peakUsageReduction} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Carbon Footprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.carbonFootprint / 1000).toFixed(1)}t CO₂
              </div>
              <p className="text-xs text-green-600 mt-1">
                Reduced: {(stats.carbonReduction / 1000).toFixed(1)}t/month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Annual Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.yearlySavings)}
              </div>
              <p className="text-xs text-gray-500 mt-1">ROI: {stats.roi}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">Equipment</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Rates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* EQUIPMENT CONSUMPTION TAB */}
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Energy Consumption</CardTitle>
              <CardDescription>Real-time monitoring of all warehouse equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Current Power</TableHead>
                    <TableHead>Daily Usage</TableHead>
                    <TableHead>Monthly Cost</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumption.map((equip) => (
                    <TableRow key={equip.equipmentId}>
                      <TableCell className="font-medium">{equip.equipmentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{equip.equipmentType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{equip.currentPower} kW</div>
                          <div className="text-xs text-gray-500">
                            Avg: {equip.avgPower} kW | Peak: {equip.peakPower} kW
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{equip.dailyConsumption.toLocaleString()} kWh</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(equip.monthlyCost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={equip.efficiency} className="w-16" />
                          <span className="text-sm">{equip.efficiency}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(equip.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECOMMENDATIONS TAB */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to reduce energy costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Current Schedule</TableHead>
                    <TableHead>Recommended</TableHead>
                    <TableHead>Current Cost</TableHead>
                    <TableHead>Projected Cost</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.equipmentName}</TableCell>
                      <TableCell className="text-sm">{rec.currentSchedule}</TableCell>
                      <TableCell className="text-sm text-green-600">
                        {rec.recommendedSchedule}
                      </TableCell>
                      <TableCell>{formatCurrency(rec.currentCost)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(rec.projectedCost)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(rec.savings)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rec.savingsPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rec.priority === "HIGH" ? "destructive" : "default"}
                        >
                          {rec.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => applyRecommendation(rec)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HOURLY RATES TAB */}
        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Energy Rate Schedule</CardTitle>
              <CardDescription>
                Optimize operations based on time-of-use pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {hourlyData.map((hour) => (
                  <div
                    key={hour.hour}
                    className={`p-3 rounded-lg ${getRateColor(hour.rateType)}`}
                  >
                    <div className="text-xs font-medium">
                      {hour.hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="text-lg font-bold mt-1">${hour.rate}</div>
                    <div className="text-xs mt-1">{hour.consumption.toFixed(0)} kWh</div>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {hour.rateType.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Current Efficiency</span>
                        <span className="font-bold">{stats.efficiency.current}%</span>
                      </div>
                      <Progress value={stats.efficiency.current} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Target Efficiency</span>
                        <span className="font-bold text-green-600">
                          {stats.efficiency.target}%
                        </span>
                      </div>
                      <Progress value={stats.efficiency.target} className="bg-green-200" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm">Improvement Potential</span>
                      <Badge variant="default">{stats.efficiency.improvement}%</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Footprint</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {(stats.carbonFootprint / 1000).toFixed(1)}t CO₂
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CO₂ Reduced</span>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {(stats.carbonReduction / 1000).toFixed(1)}t
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                        Equivalent Trees
                      </span>
                      <Badge variant="default">
                        {Math.round((stats.carbonReduction / 1000) * 45)} trees
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
