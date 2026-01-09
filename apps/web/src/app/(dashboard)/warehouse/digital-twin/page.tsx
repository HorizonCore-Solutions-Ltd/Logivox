/**
 * Digital Twin 3D Visualization Dashboard
 * Real-time warehouse digital twin with IoT integration
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Activity,
  Users,
  Truck,
  Zap,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface Sensor {
  id: string;
  type: string;
  location: { x: number; y: number; z: number };
  value: number;
  unit: string;
  status: string;
  timestamp: string;
}

interface Equipment {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number; z: number };
  status: string;
  battery?: number;
  operator?: string;
}

interface Worker {
  id: string;
  name: string;
  role: string;
  position: { x: number; y: number; z: number };
  currentTask: string;
  taskProgress: number;
  efficiency: number;
}

export default function DigitalTwinDashboard() {
  const [warehouseModel, setWarehouseModel] = useState<any>(null);
  const [liveData, setLiveData] = useState<{ sensors: Sensor[] }>({
    sensors: [],
  });
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<
    "3d" | "sensors" | "equipment" | "workers"
  >("3d");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchData();
    // Refresh live data every 5 seconds
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeView === "3d" && warehouseModel) {
      render3DWarehouse();
    }
  }, [activeView, warehouseModel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWarehouseModel(),
        fetchLiveData(),
        fetchEquipment(),
        fetchWorkers(),
      ]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseModel = async () => {
    const response = await fetch("/api/digital-twin?action=warehouse-model");
    const data = await response.json();
    setWarehouseModel(data.model);
  };

  const fetchLiveData = async () => {
    const response = await fetch("/api/digital-twin?action=live-data");
    const data = await response.json();
    setLiveData(data.liveData);
  };

  const fetchEquipment = async () => {
    const response = await fetch("/api/digital-twin?action=equipment-status");
    const data = await response.json();
    setEquipment(data.equipment?.equipment || []);
  };

  const fetchWorkers = async () => {
    const response = await fetch("/api/digital-twin?action=worker-tracking");
    const data = await response.json();
    setWorkers(data.workers?.workers || []);
  };

  const runSimulation = async () => {
    if (!confirm("Run Peak Season simulation?")) return;

    try {
      const response = await fetch("/api/digital-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate",
          params: {
            scenario: "PEAK_SEASON",
            duration: 60,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          `Simulation Complete:\n\nScenario: ${data.simulation.scenario}\nAverage Pick Time: ${data.simulation.averagePickTime}s\nEstimated Throughput: ${data.simulation.estimatedThroughput} orders/hr\n\nRecommendations:\n${data.simulation.recommendations.join("\n")}`,
        );
      }
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Simulation failed");
    }
  };

  const render3DWarehouse = () => {
    if (!canvasRef.current || !warehouseModel) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw warehouse outline
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 400);

    // Draw zones
    warehouseModel.zones?.forEach((zone: any) => {
      const x = 50 + (zone.position.x / 100) * 700;
      const z = 50 + (zone.position.z / 100) * 400;
      const width = (zone.dimensions.width / 100) * 700;
      const depth = (zone.dimensions.depth / 100) * 400;

      ctx.fillStyle = zone.color + "40"; // 25% opacity
      ctx.fillRect(x, z, width, depth);

      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, z, width, depth);

      ctx.fillStyle = "#000";
      ctx.font = "12px sans-serif";
      ctx.fillText(zone.name, x + 5, z + 15);
    });

    // Draw aisles
    warehouseModel.aisles?.forEach((aisle: any) => {
      const x = 50 + (aisle.position.x / 100) * 700;
      const z = 50 + (aisle.position.z / 100) * 400;

      ctx.fillStyle = "#d1d5db";
      ctx.fillRect(
        x,
        z,
        (aisle.dimensions.width / 100) * 700,
        (aisle.dimensions.length / 100) * 400,
      );
    });

    // Draw equipment
    equipment.forEach((eq) => {
      const x = 50 + (eq.position.x / 100) * 700;
      const z = 50 + (eq.position.z / 100) * 400;

      ctx.fillStyle = eq.status === "ACTIVE" ? "#10b981" : "#ef4444";
      ctx.beginPath();
      ctx.arc(x, z, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.font = "10px sans-serif";
      ctx.fillText(eq.name, x + 8, z + 4);
    });

    // Draw workers
    workers.forEach((worker) => {
      const x = 50 + (worker.position.x / 100) * 700;
      const z = 50 + (worker.position.z / 100) * 400;

      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(x, z, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw legend
    ctx.fillStyle = "#fff";
    ctx.fillRect(810, 50, 180, 150);
    ctx.strokeStyle = "#d1d5db";
    ctx.strokeRect(810, 50, 180, 150);

    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    ctx.fillText("Legend", 820, 70);

    // Equipment
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(820, 90, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText("Equipment (Active)", 835, 95);

    // Workers
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(820, 120, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillText("Workers", 835, 125);

    // Zones
    ctx.fillStyle = "#3b82f640";
    ctx.fillRect(815, 140, 15, 15);
    ctx.fillStyle = "#000";
    ctx.fillText("Zones", 835, 152);
  };

  const getSensorIcon = (type: string) => {
    if (type === "TEMPERATURE") return "🌡️";
    if (type === "HUMIDITY") return "💧";
    if (type === "MOTION") return "👥";
    if (type === "WEIGHT_SENSOR") return "⚖️";
    if (type === "LIGHT") return "💡";
    return "📊";
  };

  const getStatusColor = (status: string) => {
    if (status === "ACTIVE" || status === "NORMAL")
      return "bg-green-100 text-green-800";
    if (status === "WARNING") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Digital Twin 3D Visualization
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time warehouse monitoring with IoT integration
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <Activity
                className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={runSimulation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Zap className="w-4 h-4" />
              Run Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">IoT Sensors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {liveData.sensors.length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Equipment</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {equipment.filter((e) => e.status === "ACTIVE").length}
              </p>
            </div>
            <Truck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Workers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {workers.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {workers.length > 0
                  ? Math.round(
                      workers.reduce((sum, w) => sum + w.efficiency, 0) /
                        workers.length,
                    )
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveView("3d")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeView === "3d"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Box className="w-5 h-5" />
          3D View
        </button>
        <button
          onClick={() => setActiveView("sensors")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeView === "sensors"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Activity className="w-5 h-5" />
          IoT Sensors
        </button>
        <button
          onClick={() => setActiveView("equipment")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeView === "equipment"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Truck className="w-5 h-5" />
          Equipment
        </button>
        <button
          onClick={() => setActiveView("workers")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeView === "workers"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Users className="w-5 h-5" />
          Workers
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading digital twin data...</p>
          </div>
        ) : (
          <>
            {/* 3D View */}
            {activeView === "3d" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  3D Warehouse Visualization
                </h2>
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={500}
                  className="border border-gray-200 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-4">
                  Real-time warehouse layout with equipment and worker
                  positions. Updates every 5 seconds.
                </p>
              </div>
            )}

            {/* IoT Sensors */}
            {activeView === "sensors" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  IoT Sensor Data
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {liveData.sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">
                          {getSensorIcon(sensor.type)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(sensor.status)}`}
                        >
                          {sensor.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {sensor.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {sensor.type.replace(/_/g, " ")}
                      </p>
                      <div className="mt-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {sensor.value} {sensor.unit}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Location: ({sensor.location.x}, {sensor.location.y},{" "}
                        {sensor.location.z})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {activeView === "equipment" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Equipment Status
                </h2>
                <div className="space-y-4">
                  {equipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {eq.name}
                          </h3>
                          <p className="text-sm text-gray-600">{eq.type}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded font-semibold ${getStatusColor(eq.status)}`}
                        >
                          {eq.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {eq.battery !== undefined && (
                          <div>
                            <p className="text-sm text-gray-600">Battery</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {eq.battery}%
                            </p>
                          </div>
                        )}
                        {eq.operator && (
                          <div>
                            <p className="text-sm text-gray-600">Operator</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {eq.operator}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Position</p>
                          <p className="text-sm font-mono text-gray-900">
                            ({eq.position.x}, {eq.position.y}, {eq.position.z})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workers */}
            {activeView === "workers" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Worker Tracking
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Worker
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Current Task
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Progress
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Efficiency
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Position
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((worker) => (
                        <tr
                          key={worker.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {worker.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {worker.id}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {worker.role}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {worker.currentTask}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${worker.taskProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {worker.taskProgress}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-lg font-bold text-green-600">
                              {worker.efficiency}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-mono text-gray-700">
                            ({worker.position.x}, {worker.position.y},{" "}
                            {worker.position.z})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
