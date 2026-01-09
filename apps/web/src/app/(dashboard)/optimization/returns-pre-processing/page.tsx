"use client";

/**
 * RETURNS PRE-PROCESSING DASHBOARD
 * =================================
 * 
 * System 8 - Excellent ROI (713%)
 * Investment: $6K → Savings: $43K/year
 * 
 * Features:
 * - AI-powered return classification
 * - Automated disposition routing
 * - Instant credit processing
 * - Recovery optimization
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
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface PendingReturn {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  totalValue: number;
  receivedDate: Date;
  status: string;
  priority: string;
  estimatedProcessingTime: number;
}

interface DispositionRecommendation {
  id: string;
  returnId: string;
  orderNumber: string;
  productSku: string;
  productName: string;
  returnReason: string;
  condition: string;
  recommendedDisposition: string;
  confidence: number;
  estimatedRecovery: number;
  processingTime: number;
  requiresInspection: boolean;
}

interface Stats {
  totalReturns: number;
  pendingReturns: number;
  processedToday: number;
  avgProcessingTime: number;
  targetProcessingTime: number;
  autoProcessedRate: number;
  dispositionBreakdown: {
    restock: number;
    refurbish: number;
    liquidate: number;
    vendorReturn: number;
    warrantyClaim: number;
    scrap: number;
  };
  recoveryMetrics: {
    avgRecoveryRate: number;
    totalValueRecovered: number;
    potentialValue: number;
  };
  timesSavings: {
    manualProcessingTime: number;
    automatedProcessingTime: number;
    timeSaved: number;
  };
  monthlySavings: number;
  yearlySavings: number;
  roi: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReturnsPreProcessingDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingReturns, setPendingReturns] = useState<PendingReturn[]>([]);
  const [recommendations, setRecommendations] = useState<DispositionRecommendation[]>([]);

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [statsRes, pendingRes, recommendationsRes] = await Promise.all([
        fetch("/api/optimization/returns-pre-processing?action=stats"),
        fetch("/api/optimization/returns-pre-processing?action=pending"),
        fetch("/api/optimization/returns-pre-processing?action=recommendations"),
      ]);

      const [statsData, pendingData, recommendationsData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        recommendationsRes.json(),
      ]);

      setStats(statsData);
      setPendingReturns(pendingData.returns || []);
      setRecommendations(recommendationsData.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch returns data:", error);
      toast({
        title: "Error",
        description: "Failed to load returns pre-processing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ACTIONS
  // ============================================

  async function applyDisposition(rec: DispositionRecommendation) {
    try {
      const res = await fetch("/api/optimization/returns-pre-processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_DISPOSITION",
          returnId: rec.returnId,
          itemId: rec.id,
          decision: rec.recommendedDisposition,
          reason: `AI recommendation: ${rec.confidence}% confidence`,
          estimatedValue: rec.estimatedRecovery,
          processingTime: rec.processingTime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Disposition Applied",
          description: `${rec.productName} routed to ${rec.recommendedDisposition}`,
        });
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to apply disposition");
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

  function getDispositionBadge(disposition: string) {
    const colors: Record<string, string> = {
      RESTOCK: "bg-green-500 text-white",
      REFURBISH: "bg-blue-500 text-white",
      LIQUIDATE: "bg-yellow-500 text-white",
      VENDOR_RETURN: "bg-purple-500 text-white",
      WARRANTY_CLAIM: "bg-orange-500 text-white",
      SCRAP: "bg-red-500 text-white",
    };

    return <Badge className={colors[disposition] || ""}>{disposition.replace("_", " ")}</Badge>;
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING_INSPECTION: "bg-yellow-500 text-white",
      AUTO_PROCESSED: "bg-green-500 text-white",
      PENDING_DISPOSITION: "bg-orange-500 text-white",
    };

    return <Badge className={colors[status] || ""}>{status.replace("_", " ")}</Badge>;
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

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          <p className="mt-4 text-gray-600">Loading Returns Pre-Processing Dashboard...</p>
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
            <RefreshCw className="w-8 h-8 text-blue-600" />
            Returns Pre-Processing
          </h1>
          <p className="text-gray-600 mt-1">
            Excellent ROI • 713% ROI • $43K Annual Savings
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
                Pending Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReturns}</div>
              <p className="text-xs text-gray-500 mt-1">
                Processed today: {stats.processedToday}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProcessingTime} min</div>
              <p className="text-xs text-gray-500 mt-1">
                Target: {stats.targetProcessingTime} min
              </p>
              <Progress
                value={(stats.targetProcessingTime / stats.avgProcessingTime) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recovery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.recoveryMetrics.avgRecoveryRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(stats.recoveryMetrics.totalValueRecovered)} recovered
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
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Returns</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* PENDING RETURNS TAB */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Returns Queue</CardTitle>
              <CardDescription>Returns awaiting processing and disposition</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Est. Time</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReturns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">{ret.orderNumber}</TableCell>
                      <TableCell>{ret.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ret.itemCount} items</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(ret.totalValue)}
                      </TableCell>
                      <TableCell>{formatDate(ret.receivedDate)}</TableCell>
                      <TableCell>{getStatusBadge(ret.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {ret.estimatedProcessingTime} min
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ret.priority)}</TableCell>
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
              <CardTitle>AI Disposition Recommendations</CardTitle>
              <CardDescription>
                Automated routing based on condition, reason, and value analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Reason / Condition</TableHead>
                    <TableHead>Recommended</TableHead>
                    <TableHead>Recovery</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rec.productSku}</div>
                          <div className="text-xs text-gray-500">{rec.productName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{rec.returnReason.replace("_", " ")}</div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {rec.condition}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{getDispositionBadge(rec.recommendedDisposition)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rec.estimatedRecovery} className="w-16" />
                          <span className="text-sm font-medium">{rec.estimatedRecovery}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{rec.processingTime} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rec.confidence} className="w-16" />
                          <span className="text-sm">{rec.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => applyDisposition(rec)}>
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

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Disposition Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    {Object.entries(stats.dispositionBreakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace("_", " ")}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(value / stats.totalReturns) * 100}
                            className="w-24"
                          />
                          <Badge variant="outline">{value}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Savings</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Manual Processing</span>
                      <span className="font-medium">
                        {Math.round(stats.timesSavings.manualProcessingTime)} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Automated Processing</span>
                      <span className="font-medium text-green-600">
                        {Math.round(stats.timesSavings.automatedProcessingTime)} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Time Saved</span>
                      <Badge variant="default">
                        {Math.round(stats.timesSavings.timeSaved)} min
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-Process Rate</span>
                      <Badge variant="default">{stats.autoProcessedRate}%</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recovery Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Potential Value</span>
                      <span className="font-medium">
                        {formatCurrency(stats.recoveryMetrics.potentialValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Value Recovered</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(stats.recoveryMetrics.totalValueRecovered)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm">Recovery Rate</span>
                      <Badge variant="default">{stats.recoveryMetrics.avgRecoveryRate}%</Badge>
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
