"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, Calendar, TrendingDown } from "lucide-react";

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

interface ReorderAlertsProps {
  alerts: ReorderAlert[];
  onRefresh?: () => void;
}

export function ReorderAlerts({ alerts, onRefresh }: ReorderAlertsProps) {
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

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Reorder Alerts</p>
            <p className="text-muted-foreground mt-2">
              All products are adequately stocked
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
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter((a) => a.urgency === "critical").length}
            </div>
            <p className="text-xs text-muted-foreground">≤3 days until stockout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter((a) => a.urgency === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">≤7 days until stockout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter((a) => a.urgency === "medium").length}
            </div>
            <p className="text-xs text-muted-foreground">≤14 days until stockout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {alerts.filter((a) => a.urgency === "low").length}
            </div>
            <p className="text-xs text-muted-foreground">&gt;14 days until stockout</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reorder Alerts</CardTitle>
              <CardDescription>
                Products below reorder point - sorted by urgency
              </CardDescription>
            </div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.productId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Urgency Icon */}
                  <div>{getUrgencyIcon(alert.urgency)}</div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{alert.productName}</p>
                      <Badge variant={getUrgencyColor(alert.urgency)}>
                        {alert.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>Current: {alert.currentStock} units</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        <span>Reorder point: {alert.reorderPoint} units</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {alert.daysUntilStockout} days until stockout
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Suggested Order
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {alert.suggestedOrderQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>

                  {/* Action Button */}
                  <Button size="sm" className="ml-4">
                    Create Order
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Stockout Timeline</CardTitle>
          <CardDescription>
            Estimated stockout dates for critical items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAlerts
              .filter((a) => a.urgency === "critical" || a.urgency === "high")
              .map((alert) => (
                <div
                  key={alert.productId}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{alert.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated stockout: {new Date(alert.estimatedStockoutDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={getUrgencyColor(alert.urgency)}>
                    {alert.daysUntilStockout} days
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
