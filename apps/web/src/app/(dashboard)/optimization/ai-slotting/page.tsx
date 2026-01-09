"use client";

/**
 * AI-POWERED SLOTTING OPTIMIZATION DASHBOARD
 * ===========================================
 * 
 * System 7 - Outstanding ROI (589% ROI)
 * Investment: $28K → Savings: $165K/year
 * 
 * Features:
 * - AI-driven dynamic slotting recommendations
 * - Velocity-based ABC classification
 * - Golden zone optimization
 * - Automatic re-slotting suggestions
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Target,
} from "lucide-react";

interface SlottingStats {
  totalReslots: number;
  activerecommendations: number;
  completedThisMonth: number;
  totalSavings: number;
  avgSavingsPerMove: number;
}

interface Recommendation {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  currentLocation: string;
  currentZone: string;
  recommendedLocation: string;
  recommendedZone: string;
  velocityClass: string;
  picksPerMonth: number;
  expectedTimeReduction: number;
  expectedCostSavings: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export default function AISlottingPage() {
  const [stats, setStats] = useState<SlottingStats | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "recommendations">("overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch("/api/optimization/ai-slotting?action=stats"),
        fetch("/api/optimization/ai-slotting?action=config"),
      ]);

      const statsData = await statsRes.json();
      const configData = await configRes.json();

      setStats(statsData.stats);
      setConfig(configData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    if (!selectedWarehouse) {
      alert("Please select a warehouse");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/optimization/ai-slotting?action=analyze&warehouseId=${selectedWarehouse}`
      );
      const data = await res.json();
      setAnalysis(data.analysis);
      setActiveTab("analysis");
    } catch (error) {
      console.error("Error running analysis:", error);
      alert("Failed to run analysis");
    } finally {
      setLoading(false);
    }
  }

  async function executeReslot(rec: Recommendation) {
    try {
      const res = await fetch("/api/optimization/ai-slotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "executeReslot",
          data: {
            recommendationId: rec.id,
            productId: rec.productId,
            fromLocation: rec.currentLocation,
            toLocation: rec.recommendedLocation,
            movedBy: "current-user",
            notes: "AI recommendation executed",
          },
        }),
      });

      if (res.ok) {
        alert("Reslot completed successfully!");
        loadData();
      }
    } catch (error) {
      console.error("Error executing reslot:", error);
      alert("Failed to execute reslot");
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case "A":
        return "bg-red-100 text-red-800";
      case "B":
        return "bg-yellow-100 text-yellow-800";
      case "C":
        return "bg-blue-100 text-blue-800";
      case "D":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading slotting data...</p>
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
            <Target className="h-8 w-8 text-blue-500" />
            AI-Powered Slotting Optimization
          </h1>
          <p className="text-gray-600 mt-1">
            Dynamic warehouse slotting with AI-driven recommendations
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          ROI: 589% 🚀
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Recommendations</p>
                <p className="text-2xl font-bold">{stats?.activerecommendations || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold">{stats?.completedThisMonth || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reslots</p>
                <p className="text-2xl font-bold">{stats?.totalReslots || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold">
                  ${((stats?.totalSavings || 0) / 1000).toFixed(1)}K
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
                <p className="text-sm text-gray-600">Avg Savings/Move</p>
                <p className="text-2xl font-bold">
                  ${(stats?.avgSavingsPerMove || 0).toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
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
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 font-medium ${
            activeTab === "analysis"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Run Analysis
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2 font-medium ${
            activeTab === "recommendations"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && config && (
        <div className="space-y-6">
          {/* Zone Types */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(config.zones).map(([key, zone]: [string, any]) => (
                  <div
                    key={key}
                    className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{zone.name}</h3>
                      <Badge variant="outline">Priority {zone.priority}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pick Time:</span>
                        <span className="font-medium">{zone.pickTimeMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ergonomic:</span>
                        <span className="font-medium">{zone.ergonomicScore}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{zone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Velocity Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Velocity Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.velocityClasses).map(([key, vc]: [string, any]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getVelocityColor(key)}>{key}-Class</Badge>
                      <h3 className="font-semibold">{vc.name}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min Velocity:</span>
                        <span className="font-medium">{vc.velocityMin} picks/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium">{vc.pickFrequency}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {vc.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Run Slotting Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Warehouse
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Choose warehouse...</option>
                    <option value="WH-001">Main Warehouse</option>
                    <option value="WH-002">East Distribution Center</option>
                    <option value="WH-003">West Distribution Center</option>
                  </select>
                </div>

                <Button
                  onClick={runAnalysis}
                  disabled={!selectedWarehouse || loading}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {loading ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">
                        {analysis.totalProducts}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Total Products</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">
                        {analysis.misalignedProducts}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Misaligned</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        ${(analysis.expectedAnnualSavings / 1000).toFixed(1)}K
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Expected Savings</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">
                        {analysis.roi.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">ROI</p>
                    </div>
                  </div>

                  {/* Velocity Distribution */}
                  <div>
                    <h3 className="font-semibold mb-3">Velocity Distribution</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(analysis.velocityDistribution).map(
                        ([key, value]: [string, any]) => (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded">
                            <Badge className={getVelocityColor(key)}>{key}</Badge>
                            <p className="text-2xl font-bold mt-2">{value}</p>
                            <p className="text-xs text-gray-600">products</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Top Recommendations */}
                  <div>
                    <h3 className="font-semibold mb-3">
                      Top Recommendations ({analysis.recommendations.length})
                    </h3>
                    <div className="space-y-3">
                      {analysis.recommendations.slice(0, 10).map((rec: Recommendation) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getVelocityColor(rec.velocityClass)}>
                                {rec.velocityClass}
                              </Badge>
                              <span className="font-medium">{rec.sku}</span>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{rec.currentLocation}</span>
                              <ArrowRight className="h-4 w-4" />
                              <span className="font-medium text-green-600">
                                {rec.recommendedLocation}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {rec.picksPerMonth} picks/month • Save $
                              {rec.expectedCostSavings.toFixed(0)}/year
                            </p>
                          </div>
                          <Button
                            onClick={() => executeReslot(rec)}
                            size="sm"
                            variant="outline"
                          >
                            Execute
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Run an analysis to generate recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
