/**
 * ABC Analysis Dashboard
 * Velocity classification and optimization
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Play, RefreshCw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CLASS_COLORS = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#eab308",
  D: "#ef4444",
};

export default function ABCAnalysisDashboard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);

  // Run ABC Analysis
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/abc-analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
        loadResults();
      }
    } catch (error) {
      console.error("Failed to run analysis:", error);
    }
    setLoading(false);
  };

  // Load ABC results
  const loadResults = async () => {
    try {
      const response = await fetch(
        "/api/inventory/abc-analysis/results?limit=100",
      );
      const data = await response.json();
      if (data.success) {
        setClassifications(data.data.results || []);
        setStatistics(data.data.statistics || []);
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  // Prepare distribution data
  const distributionData = results?.distribution
    ? [
        {
          name: "A Items",
          value: results.distribution.A || 0,
          fill: CLASS_COLORS.A,
        },
        {
          name: "B Items",
          value: results.distribution.B || 0,
          fill: CLASS_COLORS.B,
        },
        {
          name: "C Items",
          value: results.distribution.C || 0,
          fill: CLASS_COLORS.C,
        },
        {
          name: "D Items",
          value: results.distribution.D || 0,
          fill: CLASS_COLORS.D,
        },
      ]
    : [];

  // Prepare revenue contribution chart
  const revenueData = statistics.map((stat) => ({
    class: stat.velocityClass,
    revenue: stat.totalRevenue,
    avgRevenue: stat.avgAnnualRevenue,
    fill: CLASS_COLORS[stat.velocityClass as keyof typeof CLASS_COLORS],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ABC Velocity Analysis</h1>
          <p className="text-muted-foreground">
            Optimize inventory based on turnover velocity
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={loading}>
          <Play className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Run Analysis
        </Button>
      </div>

      {/* Distribution Overview */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Velocity Distribution</CardTitle>
            <CardDescription>
              Product classification by turnover velocity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div
                  className="border rounded-lg p-4"
                  style={{ borderColor: CLASS_COLORS.A }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">
                      A Items - High Velocity
                    </h3>
                    <Badge style={{ backgroundColor: CLASS_COLORS.A }}>
                      {results.distribution.A}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Top 20% revenue generators. Daily cycle counts, 30 days
                    safety stock, CRITICAL priority.
                  </p>
                </div>

                <div
                  className="border rounded-lg p-4"
                  style={{ borderColor: CLASS_COLORS.B }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">
                      B Items - Medium Velocity
                    </h3>
                    <Badge style={{ backgroundColor: CLASS_COLORS.B }}>
                      {results.distribution.B}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next 30% revenue. Weekly counts, 21 days safety stock, HIGH
                    priority.
                  </p>
                </div>

                <div
                  className="border rounded-lg p-4"
                  style={{ borderColor: CLASS_COLORS.C }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">
                      C Items - Low Velocity
                    </h3>
                    <Badge style={{ backgroundColor: CLASS_COLORS.C }}>
                      {results.distribution.C}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next 40% revenue. Monthly counts, 14 days safety stock,
                    MEDIUM priority.
                  </p>
                </div>

                <div
                  className="border rounded-lg p-4"
                  style={{ borderColor: CLASS_COLORS.D }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">
                      D Items - Very Low Velocity
                    </h3>
                    <Badge style={{ backgroundColor: CLASS_COLORS.D }}>
                      {results.distribution.D}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bottom 10% revenue. Quarterly counts, 7 days safety stock,
                    LOW priority.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Contribution */}
      {revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Contribution by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" name="Total Revenue" fill="#8884d8">
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-4 gap-4 mt-6">
              {statistics.map((stat) => (
                <div
                  key={stat.velocityClass}
                  className="text-center p-3 border rounded-lg"
                >
                  <Badge
                    style={{
                      backgroundColor:
                        CLASS_COLORS[
                          stat.velocityClass as keyof typeof CLASS_COLORS
                        ],
                    }}
                    className="mb-2"
                  >
                    Class {stat.velocityClass}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Avg Revenue</p>
                  <p className="text-lg font-bold">
                    ${(stat.avgAnnualRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg Turnover: {(stat.avgTurnoverRate || 0).toFixed(1)}x
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {results?.topPerformers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers (A Items)
            </CardTitle>
            <CardDescription>
              Highest velocity products driving revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.topPerformers
                .slice(0, 10)
                .map((item: any, index: number) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">
                          {item.product?.product?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product?.product?.sku}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Velocity Score
                        </p>
                        <p className="text-lg font-bold">
                          {item.velocityScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Turnover
                        </p>
                        <p className="text-lg font-bold">
                          {item.turnoverRate.toFixed(1)}x
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Annual Revenue
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ${item.annualRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Movers */}
      {results?.slowMovers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Slow Movers (D Items)
            </CardTitle>
            <CardDescription>
              Low velocity products requiring optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.slowMovers.slice(0, 10).map((item: any) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                >
                  <div>
                    <p className="font-medium">{item.product?.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.product?.product?.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Velocity Score
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {item.velocityScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Turnover</p>
                      <p className="text-lg font-bold text-red-600">
                        {item.turnoverRate.toFixed(1)}x
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Days on Hand
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {item.daysOnHand.toFixed(0)}
                      </p>
                    </div>
                    <Badge variant="destructive">Consider Liquidation</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {results?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(results.recommendations).map(
                ([classKey, rec]: [string, any]) => (
                  <div
                    key={classKey}
                    className="p-4 border rounded-lg"
                    style={{
                      borderColor:
                        CLASS_COLORS[classKey as keyof typeof CLASS_COLORS],
                    }}
                  >
                    <h3 className="font-bold mb-2">
                      Class {classKey} Recommendations
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        • <strong>Count Frequency:</strong> {rec.countFrequency}
                      </li>
                      <li>
                        • <strong>Safety Stock:</strong> {rec.safetyStockDays}{" "}
                        days
                      </li>
                      <li>
                        • <strong>Reorder Priority:</strong>{" "}
                        {rec.reorderPriority}
                      </li>
                      <li>
                        • <strong>Review Cycle:</strong> {rec.reviewCycle}
                      </li>
                    </ul>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
