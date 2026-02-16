"use client";

/**
 * SUPPLIER INTEGRATION PLATFORM DASHBOARD
 * ========================================
 *
 * System 4 - Outstanding ROI (275% ROI)
 * Investment: $60K → Savings: $165K/year
 *
 * Features:
 * - EDI/API integrations
 * - Automated PO management
 * - Supplier performance tracking
 * - Real-time order monitoring
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Network,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
} from "lucide-react";

interface Stats {
  activeOrders: number;
  pendingApproval: number;
  totalOrders: number;
  totalSpend: number;
  avgOrderValue: number;
  activeSuppliers: number;
}

interface SupplierProfile {
  supplierId: string;
  supplierName: string;
  integrationType: string;
  isActive: boolean;
  performanceScore: number;
  tier: string;
  metrics: {
    onTimeDelivery: number;
    qualityScore: number;
    orderAccuracy: number;
    avgResponseTime: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    disputed: number;
  };
  spend: {
    last30Days: number;
    last90Days: number;
    yearToDate: number;
  };
}

interface Recommendation {
  productId: string;
  sku: string;
  supplierId: string;
  recommendedQty: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  estimatedCost: number;
}

export default function SupplierIntegrationPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierProfile[] | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "suppliers" | "orders"
  >("overview");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/optimization/supplier-integration?action=stats",
      );
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuppliers() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/optimization/supplier-integration?action=suppliers",
      );
      const data = await res.json();
      setSuppliers(data.suppliers);
      setActiveTab("suppliers");
    } catch (error) {
      console.error("Error loading suppliers:", error);
      alert("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/optimization/supplier-integration?action=recommendations",
      );
      const data = await res.json();
      setRecommendations(data);
      setActiveTab("orders");
    } catch (error) {
      console.error("Error loading recommendations:", error);
      alert("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }

  async function createPO(rec: Recommendation) {
    try {
      const res = await fetch("/api/optimization/supplier-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPO",
          data: {
            supplierId: rec.supplierId,
            items: [
              {
                productId: rec.productId,
                sku: rec.sku,
                quantity: rec.recommendedQty,
                unitPrice: rec.estimatedCost / rec.recommendedQty,
              },
            ],
            deliveryDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            warehouseId: "WH-001",
            notes: rec.reason,
          },
        }),
      });

      if (res.ok) {
        alert("Purchase order created successfully!");
        loadStats();
        loadRecommendations();
      }
    } catch (error) {
      console.error("Error creating PO:", error);
      alert("Failed to create purchase order");
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-100 text-purple-800";
      case "GOLD":
        return "bg-yellow-100 text-yellow-800";
      case "SILVER":
        return "bg-gray-100 text-gray-800";
      case "BRONZE":
        return "bg-orange-100 text-orange-800";
      case "PROBATION":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-purple-600";
    if (score >= 85) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="h-8 w-8 text-blue-500" />
            Supplier Integration Platform
          </h1>
          <p className="text-gray-600 mt-1">
            EDI/API integrations and automated procurement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            ROI: 275% 🚀
          </Badge>
          <Button onClick={loadSuppliers} disabled={loading}>
            <Users className="h-4 w-4 mr-2" />
            View Suppliers
          </Button>
          <Button
            onClick={loadRecommendations}
            disabled={loading}
            variant="outline"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            PO Recommendations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold">{stats?.activeOrders || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold">
                  {stats?.pendingApproval || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${((stats?.totalSpend || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  ${((stats?.avgOrderValue || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold">
                  {stats?.activeSuppliers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-4 py-2 font-medium ${
            activeTab === "suppliers"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-medium ${
            activeTab === "orders"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          PO Recommendations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Key Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>80% reduction in manual data entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>50% faster order processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>95% order accuracy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>30% reduction in stockouts</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Integration Types</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium">EDI</span>
                      <span className="text-xs text-gray-600">X12/EDIFACT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">API</span>
                      <span className="text-xs text-gray-600">
                        REST/GraphQL
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">Portal</span>
                      <span className="text-xs text-gray-600">Web Portal</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm font-medium">FTP</span>
                      <span className="text-xs text-gray-600">
                        File Transfer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === "suppliers" && suppliers && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.supplierId}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold">
                          {supplier.supplierName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {supplier.supplierId} • {supplier.integrationType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor(supplier.tier)}>
                        {supplier.tier}
                      </Badge>
                      <span
                        className={`text-2xl font-bold ${getScoreColor(supplier.performanceScore)}`}
                      >
                        {supplier.performanceScore}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">On-Time Delivery</p>
                      <p className="text-lg font-semibold">
                        {supplier.metrics.onTimeDelivery}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Quality Score</p>
                      <p className="text-lg font-semibold">
                        {supplier.metrics.qualityScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Order Accuracy</p>
                      <p className="text-lg font-semibold">
                        {supplier.metrics.orderAccuracy}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Response</p>
                      <p className="text-lg font-semibold">
                        {supplier.metrics.avgResponseTime}h
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-gray-600">Orders</p>
                      <p className="font-medium">
                        {supplier.orders.active} active /{" "}
                        {supplier.orders.total} total
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last 30 Days</p>
                      <p className="font-medium">
                        ${(supplier.spend.last30Days / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Year to Date</p>
                      <p className="font-medium">
                        ${(supplier.spend.yearToDate / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PO Recommendations Tab */}
      {activeTab === "orders" && recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>
              Purchase Order Recommendations ({recommendations.summary.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Critical Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {recommendations.summary.critical}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {recommendations.summary.high}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {(
                      recommendations.summary.estimatedTotalCost / 1000
                    ).toFixed(1)}
                    K
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.recommendations.map(
                (rec: Recommendation, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getUrgencyColor(rec.urgency)}>
                          {rec.urgency}
                        </Badge>
                        <span className="font-medium">{rec.sku}</span>
                        <span className="text-sm text-gray-600">
                          • {rec.supplierId}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span>
                          Qty: <strong>{rec.recommendedQty}</strong>
                        </span>
                        <span>
                          Cost: <strong>${rec.estimatedCost.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => createPO(rec)}
                      size="sm"
                      variant={
                        rec.urgency === "CRITICAL" ? "default" : "outline"
                      }
                    >
                      Create PO
                    </Button>
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
