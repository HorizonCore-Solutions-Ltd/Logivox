"use client";

/**
 * WAVE PREDICTION & PRE-STAGING DASHBOARD
 * ========================================
 * 
 * System 13 - Outstanding ROI (949%)
 * Investment: $15K → Savings: $142K/year
 * 
 * Features:
 * - 24-hour wave demand forecasting
 * - Intelligent pre-staging
 * - Real-time wave tracking
 * - Staffing optimization
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
  Waves,
  TrendingUp,
  Clock,
  Users,
  Package,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface WaveForecast {
  id: string;
  date: Date;
  hour: number;
  dayOfWeek: string;
  predictedOrders: number;
  predictedLines: number;
  predictedUnits: number;
  predictedPickTime: number;
  confidence: number;
  staffingNeeded: number;
  waveStrategy: string;
  peakLoad: boolean;
}

interface PreStageRecommendation {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  currentLocation: string;
  stagingLocation: string;
  recommendedQuantity: number;
  currentStock: number;
  predictedDemand: number;
  priority: string;
  reason: string;
  netBenefit: number;
}

interface Stats {
  totalWavesMonth: number;
  avgWaveSize: number;
  avgWaveTime: number;
  targetWaveTime: number;
  forecastAccuracy: number;
  preStageAdoption: number;
  timeSaved: {
    perWave: number;
    daily: number;
    monthly: number;
  };
  efficiency: {
    withPreStage: number;
    withoutPreStage: number;
    improvement: number;
  };
  monthlySavings: number;
  yearlySavings: number;
  roi: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function WavePredictionDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [forecasts, setForecasts] = useState<WaveForecast[]>([]);
  const [preStageRecs, setPreStageRecs] = useState<PreStageRecommendation[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [statsRes, forecastsRes, preStageRes, performanceRes] = await Promise.all([
        fetch("/api/optimization/wave-prediction?action=stats"),
        fetch("/api/optimization/wave-prediction?action=forecasts"),
        fetch("/api/optimization/wave-prediction?action=prestage"),
        fetch("/api/optimization/wave-prediction?action=performance"),
      ]);

      const [statsData, forecastsData, preStageData, performanceData] = await Promise.all([
        statsRes.json(),
        forecastsRes.json(),
        preStageRes.json(),
        performanceRes.json(),
      ]);

      setStats(statsData);
      setForecasts(forecastsData.forecasts || []);
      setPreStageRecs(preStageData.recommendations || []);
      setPerformance(performanceData);
    } catch (error) {
      console.error("Failed to fetch wave data:", error);
      toast({
        title: "Error",
        description: "Failed to load wave prediction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function applyPreStage(rec: PreStageRecommendation) {
    try {
      const res = await fetch("/api/optimization/wave-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PRESTAGE",
          products: [
            {
              productId: rec.productId,
              productSku: rec.productSku,
              recommendedQuantity: rec.recommendedQuantity,
              stagingLocation: rec.stagingLocation,
              priority: rec.priority,
              reason: rec.reason,
            },
          ],
          targetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Pre-Stage Task Created",
          description: `${rec.recommendedQuantity} units of ${rec.productSku} scheduled for staging`,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to create pre-stage task");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = {
      LOW: "bg-gray-500 text-white",
      MEDIUM: "bg-blue-500 text-white",
      HIGH: "bg-orange-500 text-white",
      CRITICAL: "bg-red-500 text-white",
    };

    return <Badge className={colors[priority]}>{priority}</Badge>;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Wave Prediction Dashboard...</p>
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
            <Waves className="w-8 h-8 text-blue-600" />
            Wave Prediction & Pre-Staging
          </h1>
          <p className="text-gray-600 mt-1">
            Outstanding ROI • 949% ROI • $142K Annual Savings
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
                Forecast Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.forecastAccuracy}%</div>
              <Progress value={stats.forecastAccuracy} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Wave Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgWaveTime} min</div>
              <p className="text-xs text-gray-500 mt-1">Target: {stats.targetWaveTime} min</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Efficiency Gain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{stats.efficiency.improvement}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                With pre-staging: {stats.efficiency.withPreStage}%
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

      {/* Current Wave Status */}
      {performance?.currentWave && (
        <Card>
          <CardHeader>
            <CardTitle>Current Wave Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Wave Number</div>
                <div className="text-xl font-bold">{performance.currentWave.waveNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Orders / Lines</div>
                <div className="text-xl font-bold">
                  {performance.currentWave.orders} / {performance.currentWave.lines}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Progress</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={performance.currentWave.progressPercentage} className="flex-1" />
                  <span className="text-sm font-medium">
                    {performance.currentWave.progressPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge className="bg-green-500 text-white mt-1">
                  {performance.currentWave.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecasts">24-Hour Forecast</TabsTrigger>
          <TabsTrigger value="prestage">Pre-Stage Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* FORECASTS TAB */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Wave Forecast</CardTitle>
              <CardDescription>AI-powered demand prediction for optimal staffing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead>Predicted Load</TableHead>
                    <TableHead>Pick Time</TableHead>
                    <TableHead>Staffing</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.slice(0, 12).map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell>
                        <div className="font-medium">
                          {forecast.hour.toString().padStart(2, "0")}:00
                        </div>
                        <div className="text-xs text-gray-500">{forecast.dayOfWeek}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{forecast.predictedOrders} orders</div>
                          <div className="text-xs text-gray-500">
                            {forecast.predictedLines} lines / {forecast.predictedUnits} units
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {forecast.predictedPickTime} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {forecast.staffingNeeded} pickers
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {forecast.waveStrategy.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={forecast.confidence} className="w-16" />
                          <span className="text-sm">{forecast.confidence.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {forecast.peakLoad ? (
                          <Badge className="bg-orange-500 text-white">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Peak
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRE-STAGE TAB */}
        <TabsContent value="prestage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Stage Recommendations</CardTitle>
              <CardDescription>
                Move high-velocity items to pick face before wave starts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current → Staging</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Predicted Picks</TableHead>
                    <TableHead>Time Saved</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preStageRecs.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rec.productSku}</div>
                          <div className="text-xs text-gray-500">{rec.productName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rec.currentLocation} → {rec.stagingLocation}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rec.recommendedQuantity} units</div>
                          <div className="text-xs text-gray-500">
                            Current: {rec.currentStock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rec.predictedDemand} picks</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          {rec.netBenefit.toFixed(0)} min
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(rec.priority)}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => applyPreStage(rec)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Stage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Time Savings</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Per Wave</span>
                      <Badge variant="default">{stats.timeSaved.perWave} min</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily</span>
                      <Badge variant="default">{stats.timeSaved.daily} min</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly</span>
                      <Badge variant="default">
                        {(stats.timeSaved.monthly / 60).toFixed(0)} hours
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Savings</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.monthlySavings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Savings</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.yearlySavings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm">Return on Investment</span>
                      <Badge variant="default" className="text-lg">
                        {stats.roi}%
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
