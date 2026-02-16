"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QuantityVerificationPage() {
  const [stats, setStats] = useState<any>(null);
  const [activeVerifications, setActiveVerifications] = useState<any[]>([]);
  const [recentDiscrepancies, setRecentDiscrepancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, verificationsRes, discrepanciesRes] = await Promise.all([
        fetch("/api/receiving/quantity-verification?action=stats"),
        fetch(
          "/api/receiving/quantity-verification?action=active-verifications",
        ),
        fetch(
          "/api/receiving/quantity-verification?action=recent-discrepancies",
        ),
      ]);

      const statsData = await statsRes.json();
      const verificationsData = await verificationsRes.json();
      const discrepanciesData = await discrepanciesRes.json();

      setStats(statsData.stats);
      setActiveVerifications(verificationsData.verifications || []);
      setRecentDiscrepancies(discrepanciesData.discrepancies || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      MANUAL_COUNT: "bg-blue-100 text-blue-800",
      BARCODE_SCAN: "bg-green-100 text-green-800",
      SCALE_WEIGHT: "bg-purple-100 text-purple-800",
      STATISTICAL_SAMPLE: "bg-orange-100 text-orange-800",
      VISUAL_ESTIMATE: "bg-gray-100 text-gray-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  const getDiscrepancyTypeColor = (type: string) => {
    switch (type) {
      case "SHORTAGE":
        return "bg-red-100 text-red-800";
      case "OVERAGE":
        return "bg-yellow-100 text-yellow-800";
      case "MISMATCH":
        return "bg-orange-100 text-orange-800";
      case "DAMAGED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading quantity verification data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Quantity Verification
        </h1>
        <p className="text-gray-600 mt-2">
          Automated count validation during receiving
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Verifications</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalVerifications || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.matches || 0} perfect matches
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Count Accuracy</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats?.accuracy?.toFixed(1) || 99.8}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.withinTolerance || 0} within tolerance
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Variance</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ±{stats?.avgVariance?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            {stats?.variances || 0} discrepancies found
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Monthly Savings</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ${(stats?.monthlySavings || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg time: {stats?.avgDuration?.toFixed(1) || 0} min
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Verifications</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
        </TabsList>

        {/* Active Verifications Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Active Verifications</h2>
            {activeVerifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active verifications
              </div>
            ) : (
              <div className="space-y-4">
                {activeVerifications.map((verification) => {
                  const variance = verification.variance || 0;
                  const variancePercentage =
                    verification.variancePercentage || 0;

                  return (
                    <div
                      key={verification.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-lg">
                            {verification.itemSKU}
                          </div>
                          <div className="text-sm text-gray-600">
                            Supplier:{" "}
                            {verification.receiving?.supplier?.name || "N/A"}
                          </div>
                        </div>
                        <Badge className={getMethodBadge(verification.method)}>
                          {verification.method.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-600">Expected</div>
                          <div className="text-lg font-semibold">
                            {verification.expectedQuantity}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Actual</div>
                          <div className="text-lg font-semibold">
                            {verification.actualQuantity || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Variance</div>
                          <div
                            className={`text-lg font-semibold ${
                              variance === 0
                                ? "text-green-600"
                                : variance < 0
                                  ? "text-red-600"
                                  : "text-orange-600"
                            }`}
                          >
                            {variance !== null
                              ? variance > 0
                                ? `+${variance}`
                                : variance
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Status</div>
                          <Badge
                            className={
                              verification.status === "MATCH"
                                ? "bg-green-100 text-green-800"
                                : verification.status === "VARIANCE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {verification.status}
                          </Badge>
                        </div>
                      </div>

                      {verification.method === "STATISTICAL_SAMPLE" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-3">
                          <div className="text-sm text-blue-800 font-medium">
                            📊 Statistical Sample
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            Confidence: {verification.confidence || 95}% •
                            Margin of Error: ±{verification.marginOfError || 0}%
                          </div>
                        </div>
                      )}

                      {verification.discrepancies &&
                        verification.discrepancies.length > 0 && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="text-sm text-yellow-800 font-medium">
                              ⚠️ {verification.discrepancies.length} Discrepanc
                              {verification.discrepancies.length === 1
                                ? "y"
                                : "ies"}{" "}
                              Found
                            </div>
                            <div className="text-xs text-yellow-700 mt-1">
                              {verification.discrepancies[0].type}:{" "}
                              {verification.discrepancies[0].description}
                            </div>
                          </div>
                        )}

                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Started:{" "}
                          {new Date(verification.startedAt).toLocaleString()}
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Discrepancies Tab */}
        <TabsContent value="discrepancies" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Discrepancies</h2>
            {recentDiscrepancies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No discrepancies recorded
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Variance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Resolution
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentDiscrepancies.map((discrepancy) => (
                      <tr key={discrepancy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Badge
                            className={getDiscrepancyTypeColor(
                              discrepancy.type,
                            )}
                          >
                            {discrepancy.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {discrepancy.verification?.itemSKU || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {discrepancy.verification?.receiving?.supplier
                            ?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-semibold ${
                              discrepancy.type === "SHORTAGE"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {discrepancy.type === "SHORTAGE" ? "-" : "+"}
                            {discrepancy.varianceQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {discrepancy.resolutionAction ? (
                            <Badge variant="outline">
                              {discrepancy.resolutionAction.replace("_", " ")}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              discrepancy.status === "RESOLVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {discrepancy.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(
                            discrepancy.detectedAt,
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-2xl mb-3">🖐️</div>
              <h3 className="font-semibold text-lg mb-2">Manual Count</h3>
              <p className="text-sm text-gray-600">
                Physical count by hand. Most accurate but time-consuming. Best
                for small quantities (&lt;50 units) or high-value items.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  When to Use
                </div>
                <div className="text-sm text-blue-900">
                  • Small quantities
                  <br />
                  • High-value items
                  <br />• First-time suppliers
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-semibold text-lg mb-2">Barcode Scan</h3>
              <p className="text-sm text-gray-600">
                Scan each unit's barcode. Highly accurate and fast. Best for
                barcoded items with quantities between 50-200 units.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  When to Use
                </div>
                <div className="text-sm text-blue-900">
                  • Barcoded items
                  <br />
                  • 50-200 units
                  <br />• Serialized tracking
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">⚖️</div>
              <h3 className="font-semibold text-lg mb-2">Scale Weight</h3>
              <p className="text-sm text-gray-600">
                Weight-based counting using calibrated scales. Ideal for uniform
                small parts (fasteners, bolts, components). 99%+ accuracy.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  When to Use
                </div>
                <div className="text-sm text-blue-900">
                  • Bulk/small parts
                  <br />
                  • Uniform weight
                  <br />• High quantities
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-lg mb-2">Statistical Sample</h3>
              <p className="text-sm text-gray-600">
                Count a sample, extrapolate to total. Reduces time by 80% for
                large shipments. Uses AQL sampling standards (50-315 sample
                size).
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  When to Use
                </div>
                <div className="text-sm text-blue-900">
                  • Large quantities (&gt;200)
                  <br />
                  • Trusted suppliers
                  <br />• Time-sensitive receiving
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">👁️</div>
              <h3 className="font-semibold text-lg mb-2">Visual Estimate</h3>
              <p className="text-sm text-gray-600">
                Quick visual check without detailed count. Only for highly
                trusted suppliers (98%+ accuracy) with small quantities.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">
                  When to Use
                </div>
                <div className="text-sm text-blue-900">
                  • Trusted suppliers
                  <br />
                  • Very small quantities
                  <br />• Low-value items
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="font-semibold text-lg mb-2">
                AI Method Selection
              </h3>
              <p className="text-sm text-gray-600">
                System automatically recommends optimal verification method
                based on quantity, item type, supplier accuracy, and barcoding
                availability.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">Factors</div>
                <div className="text-sm text-blue-900">
                  • Quantity size
                  <br />
                  • Supplier history
                  <br />• Item characteristics
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
                <div className="text-2xl font-bold text-gray-900">$36K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">$125K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">347%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payback</div>
                <div className="text-2xl font-bold text-purple-600">
                  3.5 months
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Savings Breakdown:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• $72K/year: Reduced inventory variances</div>
                <div>• $38K/year: Faster receiving (skip full counts)</div>
                <div>• $15K/year: Fewer supplier disputes</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
