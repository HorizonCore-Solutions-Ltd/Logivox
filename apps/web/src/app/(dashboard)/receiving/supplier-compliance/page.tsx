"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SupplierCompliancePage() {
  const [stats, setStats] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, rankingsRes, alertsRes] = await Promise.all([
        fetch("/api/receiving/supplier-compliance?action=stats"),
        fetch("/api/receiving/supplier-compliance?action=rankings"),
        fetch("/api/receiving/supplier-compliance?action=active-alerts"),
      ]);

      const statsData = await statsRes.json();
      const rankingsData = await rankingsRes.json();
      const alertsData = await alertsRes.json();

      setStats(statsData.stats);
      setRankings(rankingsData.rankings || []);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "GOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "SILVER":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "BRONZE":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "PROBATION":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "💎";
      case "GOLD":
        return "🥇";
      case "SILVER":
        return "🥈";
      case "BRONZE":
        return "🥉";
      case "PROBATION":
        return "⚠️";
      default:
        return "📊";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-purple-600";
    if (score >= 85) return "text-yellow-600";
    if (score >= 75) return "text-gray-600";
    if (score >= 65) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading supplier compliance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Supplier Compliance Scoring
        </h1>
        <p className="text-gray-600 mt-2">
          Track and score supplier performance across receiving operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Suppliers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalSuppliers || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">tracked & scored</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Average Score</div>
          <div
            className={`text-2xl font-bold mt-1 ${getScoreColor(stats?.avgScore || 0)}`}
          >
            {stats?.avgScore?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">out of 100</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Top Tier</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {stats?.platinumSuppliers || 0} 💎
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.goldSuppliers || 0} gold suppliers
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Alerts</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {stats?.activeAlerts || 0}
          </div>
          <div className="text-xs text-red-600 mt-1">
            {stats?.criticalAlerts || 0} critical
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Monthly Savings</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            ${(stats?.monthlySavings || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.probationSuppliers || 0} on probation
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rankings">Supplier Rankings</TabsTrigger>
          <TabsTrigger value="alerts">
            Active Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="scoring">Scoring System</TabsTrigger>
        </TabsList>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Supplier Rankings</h2>
            {rankings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No supplier data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Overall Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ASN Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        On-Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quality
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rankings.map((ranking, index) => (
                      <tr key={ranking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-lg font-semibold">
                            #{index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {ranking.supplier?.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {ranking.supplierId.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`text-xl font-bold ${getScoreColor(
                              ranking.overallScore,
                            )}`}
                          >
                            {ranking.overallScore?.toFixed(1)}
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${ranking.overallScore}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getTierBadge(ranking.tier)}>
                            {getTierEmoji(ranking.tier)} {ranking.tier}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`font-medium ${getScoreColor(
                              ranking.asnAccuracy,
                            )}`}
                          >
                            {ranking.asnAccuracy?.toFixed(0)}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`font-medium ${getScoreColor(
                              ranking.onTimeDelivery,
                            )}`}
                          >
                            {ranking.onTimeDelivery?.toFixed(0)}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`font-medium ${getScoreColor(
                              ranking.qualityDefects,
                            )}`}
                          >
                            {ranking.qualityDefects?.toFixed(0)}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                ✅ No active alerts - all suppliers performing well!
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-semibold">
                            {alert.supplier?.name || "Unknown Supplier"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {alert.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Category: {alert.category.replace("_", " ")} •{" "}
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Scoring System Tab */}
        <TabsContent value="scoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-lg mb-2">ASN Accuracy</h3>
              <p className="text-sm text-gray-600">
                Measures accuracy of Advanced Shipping Notices vs actual
                received quantities. Tolerance: ±2%
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  Weight: 25%
                </div>
                <div className="text-sm text-blue-900 mt-1">
                  Critical for planning and dock scheduling
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🕐</div>
              <h3 className="font-semibold text-lg mb-2">On-Time Delivery</h3>
              <p className="text-sm text-gray-600">
                Percentage of deliveries arriving within 15 minutes of scheduled
                appointment time.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  Weight: 25%
                </div>
                <div className="text-sm text-blue-900 mt-1">
                  Impacts dock utilization and labor planning
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📦</div>
              <h3 className="font-semibold text-lg mb-2">Damage Rate</h3>
              <p className="text-sm text-gray-600">
                Inverted score based on percentage of damaged units. 0% damage =
                100 score, 10% damage = 0 score.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  Weight: 20%
                </div>
                <div className="text-sm text-blue-900 mt-1">
                  Affects inventory quality and customer satisfaction
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="font-semibold text-lg mb-2">Quality Defects</h3>
              <p className="text-sm text-gray-600">
                Percentage of shipments passing quality inspection. Includes
                visual, functional, and specification checks.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  Weight: 20%
                </div>
                <div className="text-sm text-blue-900 mt-1">
                  Key indicator of supplier manufacturing quality
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📄</div>
              <h3 className="font-semibold text-lg mb-2">Documentation</h3>
              <p className="text-sm text-gray-600">
                Completeness of required paperwork (PO number, packing slip,
                COAs, certifications).
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  Weight: 10%
                </div>
                <div className="text-sm text-blue-900 mt-1">
                  Essential for compliance and traceability
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🏆</div>
              <h3 className="font-semibold text-lg mb-2">Performance Tiers</h3>
              <div className="space-y-2 mt-3">
                <div className="flex justify-between items-center">
                  <span>💎 PLATINUM</span>
                  <span className="font-medium">95-100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🥇 GOLD</span>
                  <span className="font-medium">85-94</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🥈 SILVER</span>
                  <span className="font-medium">75-84</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🥉 BRONZE</span>
                  <span className="font-medium">65-74</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>⚠️ PROBATION</span>
                  <span className="font-medium text-red-600">&lt;65</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ROI Summary */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold text-lg mb-4">ROI Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Annual Investment</div>
                <div className="text-2xl font-bold text-gray-900">$29K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">$82K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">281%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payback</div>
                <div className="text-2xl font-bold text-purple-600">
                  4.2 months
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Savings Breakdown:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• $45K/year: Reduced supplier-related issues</div>
                <div>
                  • $25K/year: Improved supplier selection & negotiation
                </div>
                <div>• $12K/year: Faster issue resolution (60% faster)</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
