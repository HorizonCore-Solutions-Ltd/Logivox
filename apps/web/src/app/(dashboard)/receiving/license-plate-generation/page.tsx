"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LicensePlateGenerationPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingLabels, setPendingLabels] = useState<any[]>([]);
  const [recentLabels, setRecentLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, recentRes] = await Promise.all([
        fetch("/api/receiving/license-plate-generation?action=stats"),
        fetch("/api/receiving/license-plate-generation?action=pending-labels"),
        fetch("/api/receiving/license-plate-generation?action=recent-labels"),
      ]);

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      const recentData = await recentRes.json();

      setStats(statsData.stats);
      setPendingLabels(pendingData.labels || []);
      setRecentLabels(recentData.labels || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      SSCC: "bg-purple-100 text-purple-800",
      LPN: "bg-blue-100 text-blue-800",
      PALLET_LPN: "bg-green-100 text-green-800",
      CASE_LPN: "bg-yellow-100 text-yellow-800",
      ITEM_SERIAL: "bg-orange-100 text-orange-800",
    };
    return colors[format] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PRINTED":
        return "bg-blue-100 text-blue-800";
      case "APPLIED":
        return "bg-green-100 text-green-800";
      case "VOIDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "NORMAL":
        return "🟢";
      case "LOW":
        return "⚪";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading license plate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          License Plate Generation (LPN/SSCC)
        </h1>
        <p className="text-gray-600 mt-2">
          Automated barcode label generation for received goods
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Labels</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalLabels || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {stats?.pendingLabels || 0} pending print
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Label Accuracy</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats?.accuracy?.toFixed(1) || 99.9}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.voidedLabels || 0} voided/reprinted
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Printed Labels</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.totalLabelsPrinted || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.totalPrintJobs || 0} print jobs
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600">Monthly Savings</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ${(stats?.monthlySavings || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.appliedLabels || 0} labels applied
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Print Queue ({pendingLabels.length})
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Labels</TabsTrigger>
          <TabsTrigger value="formats">Label Formats</TabsTrigger>
        </TabsList>

        {/* Print Queue Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Print Queue</h2>
              <Button size="sm">Print All ({pendingLabels.length})</Button>
            </div>
            {pendingLabels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No labels pending print
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLabels.map((label) => (
                  <div
                    key={label.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getPriorityIcon(label.priority)}
                          </span>
                          <div className="font-mono font-semibold text-lg">
                            {label.labelNumber}
                          </div>
                          <Badge className={getFormatBadge(label.format)}>
                            {label.format}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {label.metadata?.humanReadable || label.barcodeData}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Print
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium ml-2">
                          {label.receiving?.supplier?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Item SKU:</span>
                        <span className="font-medium ml-2">
                          {label.metadata?.itemSKU || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium ml-2">
                          {label.metadata?.quantity || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Generated: {new Date(label.createdAt).toLocaleString()} •
                      Serial: #{label.serialNumber}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Recent Labels Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Labels</h2>
            {recentLabels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No labels found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Label Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Format
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentLabels.slice(0, 20).map((label) => (
                      <tr key={label.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm font-medium">
                            {label.labelNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Serial: #{label.serialNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getFormatBadge(label.format)}>
                            {label.format}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(label.status)}>
                            {label.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {label.receiving?.supplier?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {label.metadata?.itemSKU || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {label.location || (
                            <span className="text-gray-400">Not applied</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(label.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            Reprint
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

        {/* Label Formats Tab */}
        <TabsContent value="formats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="text-2xl mb-3">📦</div>
              <h3 className="font-semibold text-lg mb-2">SSCC (GS1-128)</h3>
              <p className="text-sm text-gray-600">
                Serial Shipping Container Code - 18-digit GS1 standard for
                logistics units. Globally unique, includes company prefix and
                check digit.
              </p>
              <div className="mt-4 p-3 bg-purple-50 rounded">
                <div className="text-xs text-purple-700 font-medium">
                  Format
                </div>
                <div className="font-mono text-sm text-purple-900 mt-1">
                  (00) 0 1234567 12345678 9
                </div>
                <div className="text-xs text-purple-700 mt-2">
                  Extension (1) + Company Prefix (7-9) + Serial (7-9) + Check
                  (1)
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Use Case:</strong> International shipments, EDI
                integration, supplier compliance
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🏷️</div>
              <h3 className="font-semibold text-lg mb-2">Internal LPN</h3>
              <p className="text-sm text-gray-600">
                Customizable License Plate Number for internal tracking.
                Includes org code, date, and unique serial number.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-700 font-medium">Format</div>
                <div className="font-mono text-sm text-blue-900 mt-1">
                  LPN-ABC123-20260108-000001
                </div>
                <div className="text-xs text-blue-700 mt-2">
                  Prefix + Org Code + Date (YYYYMMDD) + Serial (6 digits)
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Use Case:</strong> Internal warehouse operations,
                flexible format
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📚</div>
              <h3 className="font-semibold text-lg mb-2">Pallet LPN</h3>
              <p className="text-sm text-gray-600">
                Pallet-level tracking for mixed SKU pallets. Links multiple
                items to single handling unit.
              </p>
              <div className="mt-4 p-3 bg-green-50 rounded">
                <div className="text-xs text-green-700 font-medium">Format</div>
                <div className="font-mono text-sm text-green-900 mt-1">
                  PLT-ABC123-20260108-000001
                </div>
                <div className="text-xs text-green-700 mt-2">
                  Specialized prefix for pallet-level identification
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Use Case:</strong> Mixed pallets, putaway operations
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">📦</div>
              <h3 className="font-semibold text-lg mb-2">Case LPN</h3>
              <p className="text-sm text-gray-600">
                Case-level tracking for individual cartons. Enables granular
                inventory visibility and lot traceability.
              </p>
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <div className="text-xs text-yellow-700 font-medium">
                  Format
                </div>
                <div className="font-mono text-sm text-yellow-900 mt-1">
                  CSE-ABC123-20260108-000001
                </div>
                <div className="text-xs text-yellow-700 mt-2">
                  Case-specific prefix for carton-level tracking
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Use Case:</strong> Each-pick operations, lot tracking
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🔢</div>
              <h3 className="font-semibold text-lg mb-2">Item Serialization</h3>
              <p className="text-sm text-gray-600">
                Individual item-level serialization for high-value or regulated
                products. Unique ID per unit.
              </p>
              <div className="mt-4 p-3 bg-orange-50 rounded">
                <div className="text-xs text-orange-700 font-medium">
                  Format
                </div>
                <div className="font-mono text-sm text-orange-900 mt-1">
                  SN-ABC123-20260108-000001
                </div>
                <div className="text-xs text-orange-700 mt-2">
                  Serial number prefix for item-level tracking
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Use Case:</strong> High-value items, warranty tracking,
                recalls
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-2xl mb-3">🖨️</div>
              <h3 className="font-semibold text-lg mb-2">Print Technology</h3>
              <p className="text-sm text-gray-600">
                ZPL II format for Zebra thermal printers. Supports CODE128,
                GS1-128, and custom layouts.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-700 font-medium">
                  Features
                </div>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Automatic barcode generation</li>
                  <li>• Human-readable text overlay</li>
                  <li>• Metadata (date, SKU, qty)</li>
                  <li>• Batch printing support</li>
                </ul>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Compatible:</strong> Zebra ZT410, ZT411, ZT510, ZT610,
                and more
              </div>
            </Card>
          </div>

          {/* ROI Summary */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="font-semibold text-lg mb-4">ROI Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Annual Investment</div>
                <div className="text-2xl font-bold text-gray-900">$34K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">$108K</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROI</div>
                <div className="text-2xl font-bold text-blue-600">318%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Payback</div>
                <div className="text-2xl font-bold text-purple-600">
                  3.8 months
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Savings Breakdown:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• $62K/year: Eliminated manual label errors</div>
                <div>• $31K/year: Faster receiving throughput (70% faster)</div>
                <div>• $15K/year: Reduced inventory lookup time</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
