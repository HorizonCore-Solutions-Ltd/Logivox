/**
 * Bay Door Management Dashboard
 * Visual dock layout and door allocation
 */

"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Zap,
  Activity,
} from "lucide-react";

interface BayDoor {
  id: string;
  doorNumber: string;
  doorType: string;
  status: string;
  maxWeight: number;
  maxVolume: number;
  iotSensorId?: string;
  currentLoadSheet?: {
    id: string;
    loadSheetNumber: string;
    customer: {
      name: string;
    };
    totalContainers: number;
    totalWeight: number;
    totalVolume: number;
  };
}

export default function BayDoorDashboard() {
  const [doors, setDoors] = useState<BayDoor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoor, setSelectedDoor] = useState<BayDoor | null>(null);
  const [showAllocate, setShowAllocate] = useState(false);
  const [unassignedLoadSheets, setUnassignedLoadSheets] = useState<any[]>([]);

  useEffect(() => {
    fetchDoors();
    fetchUnassignedLoadSheets();

    // Refresh every 15 seconds
    const interval = setInterval(() => {
      fetchDoors();
      fetchUnassignedLoadSheets();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchDoors = async () => {
    try {
      const response = await fetch("/api/bay-doors");
      const data = await response.json();

      if (data.doors) {
        setDoors(data.doors);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  const fetchUnassignedLoadSheets = async () => {
    try {
      const response = await fetch(
        "/api/loadsheets?status=READY&unassigned=true",
      );
      const data = await response.json();

      if (data.loadSheets) {
        setUnassignedLoadSheets(data.loadSheets);
      }
    } catch (error) {
      console.error("Fetch unassigned error:", error);
    }
  };

  const assignLoadSheet = async (doorId: string, loadSheetId: string) => {
    try {
      const response = await fetch("/api/bay-doors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doorId,
          action: "assign",
          loadSheetId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchDoors();
        fetchUnassignedLoadSheets();
        setShowAllocate(false);
        alert("Load sheet assigned successfully!");
      } else {
        alert("Failed to assign load sheet");
      }
    } catch (error) {
      console.error("Assign error:", error);
      alert("Error assigning load sheet");
    }
  };

  const releaseDoor = async (doorId: string) => {
    try {
      const response = await fetch("/api/bay-doors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doorId,
          action: "release",
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchDoors();
        alert("Bay door released successfully!");
      }
    } catch (error) {
      console.error("Release error:", error);
      alert("Error releasing bay door");
    }
  };

  const setDoorMaintenance = async (doorId: string) => {
    try {
      const response = await fetch("/api/bay-doors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doorId,
          action: "maintenance",
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchDoors();
        alert("Bay door set to maintenance mode");
      }
    } catch (error) {
      console.error("Maintenance error:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-500",
      OCCUPIED: "bg-blue-500",
      CLOSED: "bg-gray-500",
      MAINTENANCE: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      AVAILABLE: <CheckCircle className="w-6 h-6 text-green-600" />,
      OCCUPIED: <Truck className="w-6 h-6 text-blue-600" />,
      CLOSED: <AlertCircle className="w-6 h-6 text-gray-600" />,
      MAINTENANCE: <Settings className="w-6 h-6 text-orange-600" />,
    };
    return icons[status] || <AlertCircle className="w-6 h-6 text-gray-600" />;
  };

  const availableCount = doors.filter((d) => d.status === "AVAILABLE").length;
  const occupiedCount = doors.filter((d) => d.status === "OCCUPIED").length;
  const maintenanceCount = doors.filter(
    (d) => d.status === "MAINTENANCE",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bay Door Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dock door allocation and monitoring
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {availableCount} Available
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {occupiedCount} Occupied
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {maintenanceCount} Maintenance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Unassigned Load Sheets Alert */}
        {unassignedLoadSheets.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  {unassignedLoadSheets.length} Load Sheet
                  {unassignedLoadSheets.length !== 1 ? "s" : ""} Awaiting Bay
                  Assignment
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Click on an available bay door to assign a load sheet
                </p>
              </div>
              <button
                onClick={() => setShowAllocate(!showAllocate)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition"
              >
                {showAllocate ? "Hide" : "Show"} List
              </button>
            </div>

            {/* Unassigned List */}
            {showAllocate && (
              <div className="mt-4 space-y-2">
                {unassignedLoadSheets.map((loadSheet) => (
                  <div
                    key={loadSheet.id}
                    className="bg-white p-3 rounded border border-yellow-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {loadSheet.loadSheetNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {loadSheet.customer?.name} • {loadSheet.totalContainers}{" "}
                        containers • {(loadSheet.totalWeight / 1000).toFixed(1)}
                        t
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Click available door to assign
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {doors.map((door) => (
              <div
                key={door.id}
                onClick={() => {
                  if (
                    door.status === "AVAILABLE" &&
                    showAllocate &&
                    unassignedLoadSheets.length > 0
                  ) {
                    // Quick assign first unassigned
                    if (
                      confirm(
                        `Assign ${unassignedLoadSheets[0].loadSheetNumber} to ${door.doorNumber}?`,
                      )
                    ) {
                      assignLoadSheet(door.id, unassignedLoadSheets[0].id);
                    }
                  } else {
                    setSelectedDoor(door);
                  }
                }}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 ${
                  door.status === "AVAILABLE" && showAllocate
                    ? "border-yellow-400 ring-2 ring-yellow-200"
                    : "border-transparent"
                }`}
              >
                <div className="p-6">
                  {/* Door Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {door.doorNumber}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase mt-1">
                        {door.doorType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusIcon(door.status)}
                      {door.iotSensorId && (
                        <Zap
                          className="w-4 h-4 text-purple-500"
                          title="IoT Sensor Active"
                        />
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                        door.status,
                      )}`}
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      {door.status}
                    </span>
                  </div>

                  {/* Load Sheet Info */}
                  {door.currentLoadSheet ? (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                      <div className="font-semibold text-blue-900 text-sm">
                        {door.currentLoadSheet.loadSheetNumber}
                      </div>
                      <div className="text-xs text-blue-700">
                        {door.currentLoadSheet.customer.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                        <div>
                          <Package className="w-3 h-3 inline mr-1" />
                          {door.currentLoadSheet.totalContainers} cont.
                        </div>
                        <div>
                          {(door.currentLoadSheet.totalWeight / 1000).toFixed(
                            1,
                          )}
                          t
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Release ${door.doorNumber}?`)) {
                            releaseDoor(door.id);
                          }
                        }}
                        className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                      >
                        Release Door
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      {door.status === "AVAILABLE"
                        ? "Ready for assignment"
                        : "No active load"}
                    </div>
                  )}

                  {/* Capacity Info */}
                  <div className="mt-4 pt-4 border-t text-xs text-gray-600 space-y-1">
                    <div>Max Weight: {(door.maxWeight / 1000).toFixed(1)}t</div>
                    <div>Max Volume: {door.maxVolume.toFixed(1)}m³</div>
                  </div>

                  {/* Actions */}
                  {door.status === "AVAILABLE" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Set ${door.doorNumber} to maintenance?`)) {
                          setDoorMaintenance(door.id);
                        }
                      }}
                      className="w-full mt-3 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition"
                    >
                      Maintenance Mode
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && doors.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Bay Doors
            </h3>
            <p className="text-gray-600">
              No bay doors configured for this warehouse
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
