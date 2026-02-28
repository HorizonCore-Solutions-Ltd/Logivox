"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ForecastViewer } from "@/components/forecasting/forecast-viewer";
import { ReorderAlerts } from "@/components/forecasting/reorder-alerts";
import { ABCAnalysis } from "@/components/forecasting/abc-analysis";
import { TurnoverAnalysis } from "@/components/forecasting/turnover-analysis";
import { StockOptimization } from "@/components/forecasting/stock-optimization";

interface ForecastData {
  productId: string;
  productName: string;
  currentStock: number;
  predictions: Array<{
    date: string;
    demand: number;
    confidence: { lower: number; upper: number };
  }>;
  trend: {
    direction: "increasing" | "decreasing" | "stable";
    slope: number;
    confidence: number;
  };
  seasonality?: {
    detected: boolean;
    pattern: "weekly" | "monthly" | "yearly";
    strength: number;
    peaks: number[];
    troughs: number[];
  };
  reorderPoint: number;
  safetyStock: number;
  optimalOrderQuantity: number;
  daysUntilReorder: number;
  confidence: number;
}

interface ReorderAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  daysUntilStockout: number;
  estimatedStockoutDate: string;
}

interface StockOptimizationData {
  overstock: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    optimalStock: number;
    excessUnits: number;
    estimatedCost: number;
  }>;
  understock: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    optimalStock: number;
    shortageUnits: number;
  }>;
  recommendations: Array<{
    productId: string;
    productName: string;
    action: "order" | "reduce" | "maintain";
    suggestedQuantity: number;
    priority: number;
  }>;
  totalSavings: number;
}

interface ABCCategory {
  category: "A" | "B" | "C";
  products: Array<{
    productId: string;
    productName: string;
    value: number;
    percentageOfTotal: number;
  }>;
  totalValue: number;
  percentageOfTotal: number;
  count: number;
}

interface TurnoverData {
  productId: string;
  productName: string;
  turnoverRate: number;
  daysInInventory: number;
  classification: "fast" | "medium" | "slow" | "obsolete";
  recommendation: string;
}

export default function ForecastingDashboard() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [optimization, setOptimization] =
    useState<StockOptimizationData | null>(null);
  const [abcAnalysis, setAbcAnalysis] = useState<ABCCategory[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all forecasting data in parallel
      const [forecastsRes, alertsRes, optimizationRes, abcRes, turnoverRes] =
        await Promise.all([
          fetch("/api/forecasting/bulk"),
          fetch("/api/forecasting/alerts"),
          fetch("/api/forecasting/optimization"),
          fetch("/api/forecasting/abc"),
          fetch("/api/forecasting/turnover"),
        ]);

      if (forecastsRes.ok) {
        const data = await forecastsRes.json();
        setForecasts(data.forecasts || []);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }

      if (optimizationRes.ok) {
        const data = await optimizationRes.json();
        setOptimization(data);
      }

      if (abcRes.ok) {
        const data = await abcRes.json();
        setAbcAnalysis(data.categories || []);
      }

      if (turnoverRes.ok) {
        const data = await turnoverRes.json();
        setTurnoverData(data.turnover || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading forecasting data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI Inventory Forecasting
          </h1>
          <p className="text-muted-foreground">
            Machine learning-powered demand prediction and stock optimization
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a) => a.urgency === "critical").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products Forecasted
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecasts.length}</div>
            <p className="text-xs text-muted-foreground">
              AI predictions generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${optimization?.totalSavings.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">From optimization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Confidence
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecasts.length > 0
                ? Math.round(
                    (forecasts.reduce((sum, f) => sum + f.confidence, 0) /
                      forecasts.length) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Forecast accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="alerts">
            Reorder Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="optimization">Stock Optimization</TabsTrigger>
          <TabsTrigger value="abc">ABC Analysis</TabsTrigger>
          <TabsTrigger value="turnover">Turnover Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Critical Alerts */}
          {alerts.filter(
            (a) => a.urgency === "critical" || a.urgency === "high",
          ).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Urgent Reorder Alerts
                </CardTitle>
                <CardDescription>
                  Products requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts
                    .filter(
                      (a) => a.urgency === "critical" || a.urgency === "high",
                    )
                    .slice(0, 5)
                    .map((alert) => (
                      <div
                        key={alert.productId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={getUrgencyColor(alert.urgency)}>
                            {alert.urgency.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{alert.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.daysUntilStockout} days until stockout
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Current: {alert.currentStock} units
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Order: {alert.suggestedOrderQuantity} units
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {alerts.filter(
                  (a) => a.urgency === "critical" || a.urgency === "high",
                ).length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setActiveTab("alerts")}
                  >
                    View All Alerts ({alerts.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Product Forecasts</CardTitle>
              <CardDescription>
                AI-powered demand predictions for next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecasts.slice(0, 5).map((forecast) => (
                  <div
                    key={forecast.productId}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedProduct(forecast.productId)}
                  >
                    <div className="flex items-center gap-3">
                      {getTrendIcon(forecast.trend.direction)}
                      <div>
                        <p className="font-medium">{forecast.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {forecast.seasonality?.detected && (
                            <Badge variant="outline" className="mr-2">
                              {forecast.seasonality.pattern} pattern
                            </Badge>
                          )}
                          Confidence: {Math.round(forecast.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Current: {forecast.currentStock} units
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reorder at: {forecast.reorderPoint} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {forecasts.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setActiveTab("forecasts")}
                >
                  View All Forecasts ({forecasts.length})
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Overstock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overstock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {optimization?.overstock.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Excess inventory value: $
                  {optimization?.overstock
                    .reduce((sum, item) => sum + item.estimatedCost, 0)
                    .toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            {/* Understock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Understock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {optimization?.understock.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items below optimal stock levels
                </p>
              </CardContent>
            </Card>

            {/* Slow Movers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slow Moving Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    turnoverData.filter(
                      (t) =>
                        t.classification === "slow" ||
                        t.classification === "obsolete",
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Consider liquidation or promotions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          {selectedProduct ? (
            <div>
              <Button
                variant="outline"
                onClick={() => setSelectedProduct(null)}
                className="mb-4"
              >
                ← Back to All Forecasts
              </Button>
              <ForecastViewer productId={selectedProduct} />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Product Forecasts</CardTitle>
                <CardDescription>
                  Click on a product to view detailed forecast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forecasts.map((forecast) => (
                    <div
                      key={forecast.productId}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProduct(forecast.productId)}
                    >
                      <div className="flex items-center gap-3">
                        {getTrendIcon(forecast.trend.direction)}
                        <div>
                          <p className="font-medium">{forecast.productName}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {forecast.trend.direction}
                            </Badge>
                            {forecast.seasonality?.detected && (
                              <Badge variant="secondary">
                                {forecast.seasonality.pattern}
                              </Badge>
                            )}
                            <Badge>
                              {Math.round(forecast.confidence * 100)}%
                              confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Stock: {forecast.currentStock} units
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reorder: {forecast.reorderPoint} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <ReorderAlerts alerts={alerts} onRefresh={loadDashboardData} />
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization">
          <StockOptimization data={optimization} />
        </TabsContent>

        {/* ABC Analysis Tab */}
        <TabsContent value="abc">
          <ABCAnalysis categories={abcAnalysis} />
        </TabsContent>

        {/* Turnover Analysis Tab */}
        <TabsContent value="turnover">
          <TurnoverAnalysis data={turnoverData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
