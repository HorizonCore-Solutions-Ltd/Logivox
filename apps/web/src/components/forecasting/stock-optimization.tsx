"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from "lucide-react";

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

interface StockOptimizationProps {
  data: StockOptimizationData | null;
}

export function StockOptimization({ data }: StockOptimizationProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Optimization Data</p>
            <p className="text-muted-foreground mt-2">
              Analyzing stock levels...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "order":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "reduce":
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "order":
        return "default";
      case "reduce":
        return "secondary";
      default:
        return "outline";
    }
  };

  const sortedRecommendations = [...data.recommendations].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From optimization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overstock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.overstock.length}</div>
            <p className="text-xs text-muted-foreground">Excess inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Understock Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.understock.length}</div>
            <p className="text-xs text-muted-foreground">Below optimal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions Needed</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.recommendations.filter((r) => r.action !== "maintain").length}
            </div>
            <p className="text-xs text-muted-foreground">Recommendations</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Actions</CardTitle>
          <CardDescription>
            Recommended actions sorted by priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedRecommendations
              .filter((rec) => rec.action !== "maintain")
              .slice(0, 10)
              .map((rec) => (
                <div
                  key={rec.productId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getActionIcon(rec.action)}
                    <div className="flex-1">
                      <p className="font-medium">{rec.productName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getActionBadge(rec.action) as any}>
                          {rec.action.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Priority: {rec.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {rec.action === "order" ? "+" : rec.action === "reduce" ? "-" : ""}
                      {Math.abs(rec.suggestedQuantity)} units
                    </p>
                    <Button size="sm" className="mt-2">
                      {rec.action === "order" ? "Create Order" : "Adjust Stock"}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Overstock Details */}
      {data.overstock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-500" />
              Overstock Analysis
              <Badge variant="secondary">{data.overstock.length} items</Badge>
            </CardTitle>
            <CardDescription>
              Products with excess inventory - reduce to optimal levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.overstock.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Current: {item.currentStock} units</span>
                      <span>Optimal: {item.optimalStock} units</span>
                      <span className="text-yellow-600">Excess: {item.excessUnits} units</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Holding Cost</p>
                    <p className="text-lg font-bold text-yellow-600">
                      ${item.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Total Excess Holding Cost: $
                {data.overstock.reduce((sum, item) => sum + item.estimatedCost, 0).toLocaleString()}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Reduce inventory to optimal levels to free up capital and reduce storage costs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Understock Details */}
      {data.understock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Understock Analysis
              <Badge variant="destructive">{data.understock.length} items</Badge>
            </CardTitle>
            <CardDescription>
              Products below optimal levels - risk of stockouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.understock.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Current: {item.currentStock} units</span>
                      <span>Optimal: {item.optimalStock} units</span>
                      <span className="text-red-600">Shortage: {item.shortageUnits} units</span>
                    </div>
                  </div>
                  <Button size="sm">Order Now</Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                Total Shortage: {data.understock.reduce((sum, item) => sum + item.shortageUnits, 0)}{" "}
                units across {data.understock.length} products
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Increase inventory to prevent stockouts and lost sales opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Current State</p>
              <ul className="space-y-1 text-sm">
                <li>• {data.overstock.length} overstocked products</li>
                <li>• {data.understock.length} understocked products</li>
                <li>
                  • ${data.overstock.reduce((sum, item) => sum + item.estimatedCost, 0).toLocaleString()}{" "}
                  in excess holding costs
                </li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-900 dark:text-green-100 mb-2">
                After Optimization
              </p>
              <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <li>• Optimal stock levels for all products</li>
                <li>• Reduced holding costs by ${data.totalSavings.toLocaleString()}</li>
                <li>• Minimized stockout risk</li>
                <li>• Improved cash flow and working capital</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Next Steps
            </p>
            <ol className="space-y-1 text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside">
              <li>Review and approve priority recommendations above</li>
              <li>Create purchase orders for understocked items</li>
              <li>Plan promotions or liquidation for overstocked items</li>
              <li>Monitor inventory levels weekly and adjust as needed</li>
              <li>Re-run optimization monthly to maintain optimal levels</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
