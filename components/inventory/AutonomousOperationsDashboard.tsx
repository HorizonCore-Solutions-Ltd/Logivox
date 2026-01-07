/**
 * Autonomous Operations Dashboard
 * Monitor AI-driven inventory decisions
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#22c55e", "#eab308", "#ef4444", "#8b5cf6"];

export default function AutonomousOperationsDashboard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Load performance metrics
  const loadPerformance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/inventory/autonomous/performance?period=30",
      );
      const data = await response.json();
      if (data.success) {
        setPerformance(data.data);
      }
    } catch (error) {
      console.error("Failed to load performance:", error);
    }
    setLoading(false);
  };

  // Load recent decisions
  const loadDecisions = async () => {
    try {
      const response = await fetch(
        "/api/inventory/autonomous/reorder/decisions?limit=20",
      );
      const data = await response.json();
      if (data.success) {
        setDecisions(data.data.decisions || []);
        setPendingApprovals(
          data.data.decisions.filter((d: any) => d.result === "PENDING") || [],
        );
      }
    } catch (error) {
      console.error("Failed to load decisions:", error);
    }
  };

  // Execute autonomous reorders
  const executeReorders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/inventory/autonomous/reorder/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const data = await response.json();
      if (data.success) {
        alert(`Executed ${data.data.summary.executed} autonomous reorders!`);
        loadDecisions();
        loadPerformance();
      }
    } catch (error) {
      console.error("Failed to execute reorders:", error);
    }
    setLoading(false);
  };

  // Approve decision
  const approveDecision = async (decisionId: string) => {
    try {
      const response = await fetch(
        `/api/inventory/autonomous/reorder/${decisionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        },
      );
      if (response.ok) {
        alert("Decision approved successfully!");
        loadDecisions();
      }
    } catch (error) {
      console.error("Failed to approve decision:", error);
    }
  };

  useEffect(() => {
    loadPerformance();
    loadDecisions();
  }, []);

  // Prepare decision type distribution
  const decisionTypeData = performance?.byType
    ? [
        {
          name: "Reorders",
          value: performance.byType.reorders?.total || 0,
          fill: COLORS[0],
        },
        {
          name: "Transfers",
          value: performance.byType.transfers?.total || 0,
          fill: COLORS[1],
        },
        {
          name: "Adjustments",
          value: performance.byType.adjustments?.total || 0,
          fill: COLORS[2],
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Autonomous Operations</h1>
          <p className="text-muted-foreground">
            Zero-touch inventory automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadPerformance}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={executeReorders} disabled={loading}>
            <Package className="h-4 w-4 mr-2" />
            Execute Reorders
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.overall?.successRate}
              </div>
              <Badge
                variant={
                  parseInt(performance.overall?.successRate) >= 85
                    ? "default"
                    : "secondary"
                }
                className="mt-2"
              >
                Target: 85%+
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Automation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.overall?.automationRate}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {performance.overall?.executed} / {performance.overall?.total}{" "}
                executed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {performance.overall?.totalSavings}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Annual: {performance.annualProjection?.totalSavings}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.overall?.roi}
              </div>
              <Badge variant="outline" className="mt-2">
                Target: 200%+
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {performance.overall?.performance === "EXCELLENT" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-lg font-semibold">
                  {performance.overall?.performance}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recent Decisions */}
        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Autonomous Decisions</CardTitle>
              <CardDescription>
                Latest AI-driven inventory actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {decisions.slice(0, 15).map((decision) => (
                  <div
                    key={decision.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        {decision.result === "SUCCESS" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : decision.result === "PENDING" ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {decision.product?.product?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {decision.decisionType} • Confidence:{" "}
                          {Math.round(decision.confidence)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${decision.estimatedCost?.toLocaleString()}
                        </p>
                        {decision.estimatedSavings && (
                          <p className="text-xs text-green-600">
                            Save ${decision.estimatedSavings?.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          decision.result === "SUCCESS"
                            ? "default"
                            : decision.result === "PENDING"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {decision.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                High-value decisions requiring manual review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((decision) => (
                    <div
                      key={decision.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-lg">
                            {decision.product?.product?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {decision.product?.product?.sku}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          Confidence: {Math.round(decision.confidence)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Decision Type</p>
                          <p className="font-medium">{decision.decisionType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Estimated Cost
                          </p>
                          <p className="font-medium">
                            ${decision.estimatedCost?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Estimated Savings
                          </p>
                          <p className="font-medium text-green-600">
                            ${decision.estimatedSavings?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveDecision(decision.id)}
                          size="sm"
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Decision Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={decisionTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {decisionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance?.topPerformers
                    ?.slice(0, 5)
                    .map((product: any, index: number) => (
                      <div
                        key={product.productId}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {product.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.decisions} decisions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            {product.savings}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.avgConfidence}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
