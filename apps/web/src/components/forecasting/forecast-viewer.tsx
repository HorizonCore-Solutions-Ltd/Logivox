"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, AlertCircle, Download } from "lucide-react";
import { ForecastCharts } from "./forecast-charts";

interface ForecastData {
  productId: string;
  productName: string;
  currentStock: number;
  historicalSales: Array<{ date: string; quantity: number }>;
  predictions: Array<{ 
    date: string; 
    demand: number; 
    confidence: { lower: number; upper: number } 
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

interface ForecastViewerProps {
  productId: string;
}

export function ForecastViewer({ productId }: ForecastViewerProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, [productId]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forecasting/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setForecast(data.forecast);
      }
    } catch (error) {
      console.error("Error loading forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportForecast = () => {
    if (!forecast) return;

    const csvData = [
      ["Date", "Predicted Demand", "Lower Bound", "Upper Bound"],
      ...forecast.predictions.map((p) => [
        p.date,
        p.demand.toString(),
        p.confidence.lower.toString(),
        p.confidence.upper.toString(),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast-${forecast.productName}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Forecast not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case "increasing":
        return "text-green-600";
      case "decreasing":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return <TrendingUp className="h-5 w-5" />;
      case "decreasing":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <div className="h-5 w-5" />;
    }
  };

  const nextPrediction = forecast.predictions[0];
  const totalPredictedDemand = forecast.predictions.reduce((sum, p) => sum + p.demand, 0);

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{forecast.productName}</CardTitle>
              <CardDescription>AI-Powered Demand Forecast</CardDescription>
            </div>
            <Button onClick={exportForecast} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{forecast.currentStock}</p>
              <p className="text-xs text-muted-foreground">units</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reorder Point</p>
              <p className="text-2xl font-bold">{forecast.reorderPoint}</p>
              <p className="text-xs text-muted-foreground">
                {forecast.daysUntilReorder > 0
                  ? `${forecast.daysUntilReorder} days until reorder`
                  : "Reorder now"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Safety Stock</p>
              <p className="text-2xl font-bold">{forecast.safetyStock}</p>
              <p className="text-xs text-muted-foreground">units buffer</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Quantity</p>
              <p className="text-2xl font-bold">{forecast.optimalOrderQuantity}</p>
              <p className="text-xs text-muted-foreground">EOQ recommendation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className={getTrendColor(forecast.trend.direction)}>
                {getTrendIcon(forecast.trend.direction)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trend Direction</p>
                <p className="font-medium capitalize">{forecast.trend.direction}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(forecast.trend.slope).toFixed(2)} units/day
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Forecast Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{ width: `${forecast.confidence * 100}%` }}
                  />
                </div>
                <span className="font-medium">{Math.round(forecast.confidence * 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {forecast.confidence >= 0.8
                  ? "High accuracy"
                  : forecast.confidence >= 0.6
                    ? "Moderate accuracy"
                    : "Lower confidence"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Seasonality</p>
              {forecast.seasonality?.detected ? (
                <div className="mt-1">
                  <Badge variant="secondary">
                    {forecast.seasonality.pattern} pattern
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strength: {Math.round(forecast.seasonality.strength * 100)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm mt-1">No seasonal pattern detected</p>
              )}
            </div>
          </div>

          {forecast.seasonality?.detected && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Seasonal Insights</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Peak Periods</p>
                  <p className="text-sm">
                    {forecast.seasonality.pattern === "weekly"
                      ? forecast.seasonality.peaks.map((p) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][p]).join(", ")
                      : forecast.seasonality.pattern === "monthly"
                        ? forecast.seasonality.peaks.map((p) => `Week ${p + 1}`).join(", ")
                        : forecast.seasonality.peaks.map((p) => `Month ${p + 1}`).join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Low Periods</p>
                  <p className="text-sm">
                    {forecast.seasonality.pattern === "weekly"
                      ? forecast.seasonality.troughs.map((p) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][p]).join(", ")
                      : forecast.seasonality.pattern === "monthly"
                        ? forecast.seasonality.troughs.map((p) => `Week ${p + 1}`).join(", ")
                        : forecast.seasonality.troughs.map((p) => `Month ${p + 1}`).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Charts */}
      <ForecastCharts forecast={forecast} />

      {/* Next 30 Days Prediction */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Demand Forecast</CardTitle>
          <CardDescription>
            Total predicted demand: {Math.round(totalPredictedDemand)} units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {forecast.predictions.map((prediction, index) => (
              <div
                key={prediction.date}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(prediction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Day {index + 1} of 30
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{Math.round(prediction.demand)} units</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {Math.round(prediction.confidence.lower)} -{" "}
                    {Math.round(prediction.confidence.upper)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {forecast.daysUntilReorder <= 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Immediate Reorder Required
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Current stock ({forecast.currentStock} units) is below the reorder point (
                  {forecast.reorderPoint} units). Order {forecast.optimalOrderQuantity} units
                  immediately to prevent stockout.
                </p>
              </div>
            </div>
          )}

          {forecast.trend.direction === "increasing" && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Increasing Demand Detected
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Demand is trending upward at {Math.abs(forecast.trend.slope).toFixed(2)}{" "}
                  units/day. Consider increasing safety stock levels or ordering more frequently.
                </p>
              </div>
            </div>
          )}

          {forecast.trend.direction === "decreasing" && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Decreasing Demand Detected
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Demand is trending downward at {Math.abs(forecast.trend.slope).toFixed(2)}{" "}
                  units/day. Consider reducing order quantities or extending order intervals to
                  avoid excess inventory.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Optimal Stock Strategy</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Maintain safety stock of {forecast.safetyStock} units to cover demand
                  variability
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Reorder when stock reaches {forecast.reorderPoint} units
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Order {forecast.optimalOrderQuantity} units per order for optimal cost efficiency
                  (EOQ)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Expected total demand over next 30 days: {Math.round(totalPredictedDemand)} units
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
