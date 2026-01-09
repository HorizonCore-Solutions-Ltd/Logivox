/**
 * Manager Dashboard - Load Sheet Approval
 * Real-time load sheet review and one-click approval
 */

"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  FileText,
} from "lucide-react";

interface LoadSheet {
  id: string;
  loadSheetNumber: string;
  status: string;
  shipmentDate: string;
  customer?: {
    name: string;
    code: string;
  };
  carrierName?: string;
  driverName?: string;
  trailerNumber?: string;
  totalContainers: number;
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  totalOrders: number;
  containers: any[];
  createdAt: string;
  bayDoor?: {
    doorNumber: string;
  };
}

export default function ManagerDashboard() {
  const [loadSheets, setLoadSheets] = useState<LoadSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<LoadSheet | null>(null);
  const [filter, setFilter] = useState<
    "BUILDING" | "READY" | "CONFIRMED" | "ALL"
  >("READY");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch load sheets
  useEffect(() => {
    fetchLoadSheets();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchLoadSheets, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchLoadSheets = async () => {
    try {
      const statusParam = filter !== "ALL" ? `?status=${filter}` : "";
      const response = await fetch(`/api/loadsheets${statusParam}`);
      const data = await response.json();

      if (data.loadSheets) {
        setLoadSheets(data.loadSheets);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  const approveLoadSheet = async (loadSheetId: string, notes?: string) => {
    setApproving(true);

    try {
      const response = await fetch("/api/loadsheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadSheetId,
          action: "approve",
          approvalNotes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setLoadSheets((prev) =>
          prev.map((ls) =>
            ls.id === loadSheetId
              ? { ...ls, status: "CONFIRMED", approved: true }
              : ls,
          ),
        );

        if (selectedSheet?.id === loadSheetId) {
          setSelectedSheet(null);
        }

        alert("Load sheet approved successfully!");
      } else {
        alert("Failed to approve load sheet");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Error approving load sheet");
    } finally {
      setApproving(false);
    }
  };

  const distributeLoadSheet = async (loadSheetId: string) => {
    try {
      const response = await fetch("/api/loadsheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loadSheetId,
          action: "distribute",
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Load sheet distributed to all recipients!");
        fetchLoadSheets();
      }
    } catch (error) {
      console.error("Distribute error:", error);
      alert("Error distributing load sheet");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      BUILDING: "bg-blue-100 text-blue-800",
      READY: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      DISTRIBUTED: "bg-purple-100 text-purple-800",
      DEPARTED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (loadSheet: LoadSheet) => {
    const now = new Date();
    const shipmentDate = new Date(loadSheet.shipmentDate);
    const hoursUntilShipment =
      (shipmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilShipment < 2) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
          URGENT
        </span>
      );
    } else if (hoursUntilShipment < 4) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
          HIGH
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Load Sheet Approval
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve load sheets for departure
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            {["READY", "BUILDING", "CONFIRMED", "ALL"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : loadSheets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Load Sheets
            </h3>
            <p className="text-gray-600">
              No load sheets match the current filter
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {loadSheets.map((loadSheet) => (
              <div
                key={loadSheet.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedSheet(loadSheet);
                  setShowDetails(true);
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {loadSheet.loadSheetNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loadSheet.status)}`}
                        >
                          {loadSheet.status}
                        </span>
                        {getPriorityBadge(loadSheet)}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        {loadSheet.customer && (
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{loadSheet.customer.name}</span>
                          </div>
                        )}
                        {loadSheet.carrierName && (
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            <span>{loadSheet.carrierName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Ships:{" "}
                            {new Date(loadSheet.shipmentDate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {loadSheet.status === "READY" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveLoadSheet(loadSheet.id);
                        }}
                        disabled={approving}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                    )}

                    {loadSheet.status === "CONFIRMED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          distributeLoadSheet(loadSheet.id);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                      >
                        <Send className="w-5 h-5" />
                        Distribute
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {loadSheet.totalContainers}
                      </div>
                      <div className="text-xs text-gray-600">Containers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {loadSheet.totalItems}
                      </div>
                      <div className="text-xs text-gray-600">Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {loadSheet.totalOrders}
                      </div>
                      <div className="text-xs text-gray-600">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {(loadSheet.totalWeight / 1000).toFixed(1)}t
                      </div>
                      <div className="text-xs text-gray-600">Weight</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {loadSheet.totalVolume.toFixed(1)}m³
                      </div>
                      <div className="text-xs text-gray-600">Volume</div>
                    </div>
                  </div>

                  {/* Transport Details */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    {loadSheet.driverName && (
                      <div>
                        <span className="font-medium">Driver:</span>{" "}
                        {loadSheet.driverName}
                      </div>
                    )}
                    {loadSheet.trailerNumber && (
                      <div>
                        <span className="font-medium">Trailer:</span>{" "}
                        {loadSheet.trailerNumber}
                      </div>
                    )}
                    {loadSheet.bayDoor && (
                      <div>
                        <span className="font-medium">Bay:</span>{" "}
                        {loadSheet.bayDoor.doorNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {selectedSheet.loadSheetNumber}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Container List */}
              <h3 className="text-lg font-semibold mb-4">
                Containers ({selectedSheet.containers.length})
              </h3>

              <div className="space-y-3">
                {selectedSheet.containers.map((container: any) => (
                  <div key={container.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-lg">
                        {container.containerNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {container.containerItems?.length || 0} items
                      </div>
                    </div>

                    {container.containerItems &&
                      container.containerItems.length > 0 && (
                        <div className="space-y-1 text-sm">
                          {container.containerItems
                            .slice(0, 5)
                            .map((item: any) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-gray-600"
                              >
                                <span>{item.productName}</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            ))}
                          {container.containerItems.length > 5 && (
                            <div className="text-gray-400 text-xs">
                              +{container.containerItems.length - 5} more items
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                {selectedSheet.status === "READY" && (
                  <>
                    <button
                      onClick={() => {
                        approveLoadSheet(selectedSheet.id);
                        setShowDetails(false);
                      }}
                      disabled={approving}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve & Close
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {selectedSheet.status === "CONFIRMED" && (
                  <button
                    onClick={() => {
                      distributeLoadSheet(selectedSheet.id);
                      setShowDetails(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    <Send className="w-5 h-5" />
                    Distribute to Recipients
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
