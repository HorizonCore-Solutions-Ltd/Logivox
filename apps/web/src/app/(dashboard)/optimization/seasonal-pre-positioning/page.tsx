"use client";

/**
 * SEASONAL PRE-POSITIONING DASHBOARD
 * ===================================
 * 
 * System 10 - Exceptional ROI (1,556%)
 * Investment: $8K → Savings: $125K/year
 * 
 * Features:
 * - Seasonal demand forecasting
 * - Pre-positioning recommendations
 * - Transfer optimization
 * - Regional trend analysis
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
  TrendingUp,
  TrendingDown,
  Snowflake,
  Sun,
  Calendar,
  ArrowRight,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface SeasonalForecast {
  productId: string;
  productSku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  season: string;
  currentStock: number;
  predictedDemand: number;
  recommendedStock: number;
  gap: number;
  confidence: number;
  seasonStart: Date;
  seasonEnd: Date;
  trend: "INCREASING" | "STABLE" | "DECREASING";
}

interface PrePositionRecommendation {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  currentQuantitySource: number;
  currentQuantityTarget: number;
  recommendedTransfer: number;
  targetDate: Date;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedCostSavings: number;
  estimatedFreightCost: number;
  netSavings: number;
  confidence: number;
}

interface Stats {
  totalProducts: number;
  trackedProducts: number;
  activeForecasts: number;
  pendingRecommendations: number;
  implementedTransfers: number;
  avgForecastAccuracy: number;
  totalUnitsSaved: number;
  expeditedShipmentsSaved: number;
  monthlySavings: number;
  yearlySavings: number;
  roi: number;
  nextSeasonalEvent: {
    name: string;
    date: string;
    daysUntil: number;
    productsAffected: number;
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SeasonalPrePositioningDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [forecasts, setForecasts] = useState<SeasonalForecast[]>([]);
  const [recommendations, setRecommendations] = useState<PrePositionRecommendation[]>([]);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [statsRes, forecastsRes, recommendationsRes] = await Promise.all([
        fetch("/api/optimization/seasonal-pre-positioning?action=stats"),
        fetch("/api/optimization/seasonal-pre-positioning?action=forecasts"),
        fetch("/api/optimization/seasonal-pre-positioning?action=recommendations"),
      ]);

      const [statsData, forecastsData, recommendationsData] = await Promise.all([
        statsRes.json(),
        forecastsRes.json(),
        recommendationsRes.json(),
      ]);

      setStats(statsData);
      setForecasts(forecastsData.forecasts || []);
      setRecommendations(recommendationsData.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch seasonal data:", error);
      toast({
        title: "Error",
        description: "Failed to load seasonal pre-positioning data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ACTIONS
  // ============================================

  async function approveRecommendation(rec: PrePositionRecommendation) {
    try {
      const res = await fetch("/api/optimization/seasonal-pre-positioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_RECOMMENDATION",
          recommendationId: rec.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Transfer Scheduled",
          description: `${rec.recommendedTransfer} units will be moved from ${rec.sourceWarehouse} to ${rec.targetWarehouse}`,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to approve recommendation");
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

  function getSeasonIcon(season: string) {
    switch (season) {
      case "WINTER":
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      case "SUMMER":
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case "SPRING":
        return <Sun className="w-4 h-4 text-green-500" />;
      case "FALL":
        return <TrendingDown className="w-4 h-4 text-orange-500" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  }

  function getPriorityBadge(priority: string) {
    const colors = {
      LOW: "bg-gray-500 text-white",
      MEDIUM: "bg-blue-500 text-white",
      HIGH: "bg-orange-500 text-white",
      CRITICAL: "bg-red-500 text-white",
    };

    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>;
  }

  function getTrendIcon(trend: string) {
    if (trend === "INCREASING") {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === "DECREASING") {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Seasonal Pre-Positioning Dashboard...</p>
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
            <Calendar className="w-8 h-8 text-purple-600" />
            Seasonal Pre-Positioning
          </h1>
          <p className="text-gray-600 mt-1">
            Exceptional ROI Optimization • 1,556% ROI • $125K Annual Savings
          </p>
        </div>
        <Button onClick={fetchData}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeForecasts}</div>
              <p className="text-xs text-gray-500 mt-1">
                Tracking {stats.trackedProducts} of {stats.totalProducts} products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Forecast Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.avgForecastAccuracy}%
              </div>
              <Progress value={stats.avgForecastAccuracy} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Next Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stats.nextSeasonalEvent.name}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.nextSeasonalEvent.daysUntil} days ({stats.nextSeasonalEvent.productsAffected} products)
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
              <p className="text-xs text-gray-500 mt-1">
                ROI: {stats.roi.toLocaleString()}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* RECOMMENDATIONS TAB */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Positioning Recommendations</CardTitle>
              <CardDescription>
                Optimized transfer recommendations to reduce expedited shipping costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Transfer Route</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rec.productSku}</div>
                          <div className="text-xs text-gray-500">{rec.productName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{rec.sourceWarehouse}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{rec.targetWarehouse}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rec.recommendedTransfer.toLocaleString()} units
                          </div>
                          <div className="text-xs text-gray-500">
                            Source: {rec.currentQuantitySource.toLocaleString()} → Target: {rec.currentQuantityTarget.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(rec.targetDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(rec.netSavings)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Freight: {formatCurrency(rec.estimatedFreightCost)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rec.confidence} className="w-16" />
                          <span className="text-sm">{rec.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(rec.priority)}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => approveRecommendation(rec)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORECASTS TAB */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Demand Forecasts</CardTitle>
              <CardDescription>
                ML-powered predictions for seasonal inventory needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Predicted Demand</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((forecast) => (
                    <TableRow key={`${forecast.productId}-${forecast.warehouseId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{forecast.productSku}</div>
                          <div className="text-xs text-gray-500">{forecast.productName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{forecast.warehouseName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeasonIcon(forecast.season)}
                          <span>{forecast.season}</span>
                        </div>
                      </TableCell>
                      <TableCell>{forecast.currentStock.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        {forecast.predictedDemand.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {forecast.gap > 0 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Need {forecast.gap.toLocaleString()}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Package className="w-3 h-3 mr-1" />
                            Surplus {Math.abs(forecast.gap).toLocaleString()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(forecast.trend)}
                          <span className="text-sm">{forecast.trend}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={forecast.confidence} className="w-16" />
                          <span className="text-sm">{forecast.confidence}%</span>
                        </div>
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
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Implemented Transfers</span>
                      <Badge variant="default">{stats.implementedTransfers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expedited Shipments Saved</span>
                      <Badge variant="default">{stats.expeditedShipmentsSaved}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Units Saved</span>
                      <Badge variant="default">{stats.totalUnitsSaved.toLocaleString()}</Badge>
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Return on Investment</span>
                      <span className="text-lg font-bold text-blue-600">
                        {stats.roi.toLocaleString()}%
                      </span>
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
