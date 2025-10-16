"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";

interface TurnoverData {
  productId: string;
  productName: string;
  turnoverRate: number;
  daysInInventory: number;
  classification: "fast" | "medium" | "slow" | "obsolete";
  recommendation: string;
}

interface TurnoverAnalysisProps {
  data: TurnoverData[];
}

export function TurnoverAnalysis({ data }: TurnoverAnalysisProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "fast":
        return "default";
      case "medium":
        return "secondary";
      case "slow":
        return "outline";
      case "obsolete":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case "fast":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "medium":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "slow":
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case "obsolete":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const fastMovers = data.filter((d) => d.classification === "fast");
  const mediumMovers = data.filter((d) => d.classification === "medium");
  const slowMovers = data.filter((d) => d.classification === "slow");
  const obsolete = data.filter((d) => d.classification === "obsolete");

  // Chart data
  const chartData = [
    { name: "Fast", count: fastMovers.length, fill: "hsl(var(--chart-1))" },
    { name: "Medium", count: mediumMovers.length, fill: "hsl(var(--chart-2))" },
    { name: "Slow", count: slowMovers.length, fill: "hsl(var(--chart-3))" },
    { name: "Obsolete", count: obsolete.length, fill: "hsl(var(--destructive))" },
  ];

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Turnover Data</p>
            <p className="text-muted-foreground mt-2">
              Insufficient sales data for analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Fast Movers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fastMovers.length}</div>
            <p className="text-xs text-muted-foreground">&lt;30 days in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Medium Movers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{mediumMovers.length}</div>
            <p className="text-xs text-muted-foreground">30-90 days in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              Slow Movers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{slowMovers.length}</div>
            <p className="text-xs text-muted-foreground">90-180 days in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Obsolete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{obsolete.length}</div>
            <p className="text-xs text-muted-foreground">&gt;180 days in inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Turnover Distribution</CardTitle>
          <CardDescription>
            Number of products by turnover classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Legend />
              <Bar dataKey="count" name="Products" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fast Movers */}
      {fastMovers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Fast Moving Products
              <Badge variant="default">{fastMovers.length}</Badge>
            </CardTitle>
            <CardDescription>
              High turnover - ensure adequate stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fastMovers.slice(0, 5).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getClassificationIcon(item.classification)}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.turnoverRate.toFixed(2)}x</p>
                    <p className="text-xs text-muted-foreground">
                      {item.daysInInventory} days in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Movers and Obsolete */}
      {(slowMovers.length > 0 || obsolete.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Slow Moving & Obsolete Products
              <Badge variant="destructive">{slowMovers.length + obsolete.length}</Badge>
            </CardTitle>
            <CardDescription>
              Consider liquidation, promotions, or discontinuation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...slowMovers, ...obsolete].slice(0, 10).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getClassificationIcon(item.classification)}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                    </div>
                    <Badge variant={getClassificationColor(item.classification)}>
                      {item.classification}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.turnoverRate.toFixed(2)}x</p>
                    <p className="text-xs text-muted-foreground">
                      {item.daysInInventory} days in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Turnover Optimization Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fastMovers.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                Fast Movers ({fastMovers.length} products)
              </p>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <li>• Increase safety stock to prevent stockouts</li>
                <li>• Consider more frequent reorder cycles</li>
                <li>• Negotiate better pricing with suppliers for bulk orders</li>
                <li>• Monitor for demand spikes and seasonal patterns</li>
              </ul>
            </div>
          )}

          {slowMovers.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Slow Movers ({slowMovers.length} products)
              </p>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• Reduce order quantities to minimize holding costs</li>
                <li>• Consider promotional campaigns to increase sales</li>
                <li>• Evaluate pricing strategy and profit margins</li>
                <li>• Monitor for further decline in demand</li>
              </ul>
            </div>
          )}

          {obsolete.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                Obsolete Items ({obsolete.length} products)
              </p>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                <li>• Liquidate through clearance sales or bulk discounts</li>
                <li>• Consider donation for tax benefits</li>
                <li>• Stop reordering and discontinue product line</li>
                <li>• Analyze why product failed to sell</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
