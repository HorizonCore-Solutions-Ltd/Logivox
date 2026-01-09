/**
 * Advanced AI Dashboard
 * Predictive maintenance, route optimization, demand forecasting, anomaly detection
 */

"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Cpu,
  Route,
  Calendar,
  Activity,
  RefreshCw,
} from "lucide-react";

interface Prediction {
  equipmentId: string;
  equipmentType: string;
  name: string;
  cycleCount: number;
  avgCyclesPerDay: number;
  daysUntilMaintenance: number;
  urgency: string;
  recommendedAction: string;
  confidence: number;
}

interface RouteOptimization {
  workerId: string;
  workerName: string;
  currentLocation: any;
  remainingPicks: number;
  estimatedDistance: number;
  estimatedTime: number;
  path: any[];
  improvementPercent: number;
}

interface ForecastData {
  forecast: Array<{
    date: string;
    predictedLoadSheets: number;
    predictedContainers: number;
    predictedWeight: number;
    confidence: number;
  }>;
  model: string;
  accuracy: number;
}

interface Anomaly {
  type: string;
  severity: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  detectedAt: string;
}

export default function AdvancedAIDashboard() {
  const [activeTab, setActiveTab] = useState<
    "maintenance" | "routes" | "forecast" | "anomalies"
  >("maintenance");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [routes, setRoutes] = useState<RouteOptimization[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let feature = "";
      switch (activeTab) {
        case "maintenance":
          feature = "predictive-maintenance";
          break;
        case "routes":
          feature = "route-optimization";
          break;
        case "forecast":
          feature = "demand-forecast";
          break;
        case "anomalies":
          feature = "anomaly-detection";
          break;
      }

      const response = await fetch(`/api/ai-advanced?feature=${feature}`);
      const data = await response.json();

      if (activeTab === "maintenance") setPredictions(data.predictions || []);
      else if (activeTab === "routes") setRoutes(data.routes || []);
      else if (activeTab === "forecast") setForecast(data);
      else if (activeTab === "anomalies") setAnomalies(data.anomalies || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === "HIGH") return "bg-red-100 text-red-800";
    if (urgency === "MEDIUM") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "HIGH") return "bg-red-100 text-red-800 border-red-300";
    if (severity === "MEDIUM")
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Advanced AI Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Machine learning insights for warehouse optimization
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === "maintenance"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Cpu className="w-5 h-5" />
          Predictive Maintenance
        </button>
        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === "routes"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Route className="w-5 h-5" />
          Route Optimization
        </button>
        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === "forecast"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Calendar className="w-5 h-5" />
          Demand Forecasting
        </button>
        <button
          onClick={() => setActiveTab("anomalies")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition whitespace-nowrap ${
            activeTab === "anomalies"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Activity className="w-5 h-5" />
          Anomaly Detection
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI insights...</p>
          </div>
        ) : (
          <>
            {/* Predictive Maintenance */}
            {activeTab === "maintenance" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Equipment Maintenance Predictions
                </h2>
                {predictions.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No maintenance predictions available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {predictions.map((pred) => (
                      <div
                        key={pred.equipmentId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {pred.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {pred.equipmentType.replace(/_/g, " ")}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(pred.urgency)}`}
                          >
                            {pred.urgency} URGENCY
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <div className="text-gray-600">Cycle Count</div>
                            <div className="font-bold text-gray-900">
                              {pred.cycleCount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Avg Cycles/Day</div>
                            <div className="font-bold text-gray-900">
                              {pred.avgCyclesPerDay}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              Days Until Maintenance
                            </div>
                            <div className="font-bold text-gray-900">
                              {pred.daysUntilMaintenance}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Confidence</div>
                            <div className="font-bold text-gray-900">
                              {Math.round(pred.confidence * 100)}%
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Recommended Action:</strong>{" "}
                            {pred.recommendedAction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Route Optimization */}
            {activeTab === "routes" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Optimized Picking Routes
                </h2>
                {routes.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No active routes to optimize
                  </p>
                ) : (
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div
                        key={route.workerId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {route.workerName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Worker ID: {route.workerId}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              +{route.improvementPercent}%
                            </div>
                            <div className="text-xs text-gray-600">
                              Improvement
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                          <div>
                            <div className="text-gray-600">Remaining Picks</div>
                            <div className="font-bold text-gray-900">
                              {route.remainingPicks}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Est. Distance</div>
                            <div className="font-bold text-gray-900">
                              {route.estimatedDistance.toFixed(1)}m
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Est. Time</div>
                            <div className="font-bold text-gray-900">
                              {route.estimatedTime} min
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-600 mb-2">
                            Optimized Path ({route.optimization}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {route.path.slice(0, 10).map((loc, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                              >
                                {loc.id}
                              </span>
                            ))}
                            {route.path.length > 10 && (
                              <span className="px-2 py-1 text-gray-500 text-xs">
                                +{route.path.length - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Demand Forecasting */}
            {activeTab === "forecast" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    30-Day Demand Forecast
                  </h2>
                  {forecast && (
                    <div className="text-sm text-gray-600">
                      Model:{" "}
                      <span className="font-semibold">{forecast.model}</span> •
                      Accuracy:{" "}
                      <span className="font-semibold">
                        {Math.round(forecast.accuracy * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {!forecast || forecast.forecast.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No forecast data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Load Sheets
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Containers
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Weight (kg)
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Confidence
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.forecast.map((day, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {day.date}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                              {day.predictedLoadSheets}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                              {day.predictedContainers}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                              {day.predictedWeight.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span
                                className={`px-2 py-1 rounded ${
                                  day.confidence > 0.8
                                    ? "bg-green-100 text-green-800"
                                    : day.confidence > 0.6
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {Math.round(day.confidence * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Anomaly Detection */}
            {activeTab === "anomalies" && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Detected Anomalies
                </h2>
                {anomalies.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-900 font-semibold">
                      No anomalies detected
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      All operations within normal parameters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {anomalies.map((anomaly, idx) => (
                      <div
                        key={idx}
                        className={`border-2 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className={`w-5 h-5 mt-1 ${
                                anomaly.severity === "HIGH"
                                  ? "text-red-600"
                                  : anomaly.severity === "MEDIUM"
                                    ? "text-yellow-600"
                                    : "text-blue-600"
                              }`}
                            />
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {anomaly.type.replace(/_/g, " ")}
                              </h3>
                              <p className="text-sm text-gray-700 mt-1">
                                {anomaly.description}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSeverityColor(anomaly.severity)}`}
                          >
                            {anomaly.severity}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
                          <span>
                            {anomaly.entityType}: {anomaly.entityName}
                          </span>
                          <span>•</span>
                          <span>
                            Detected:{" "}
                            {new Date(anomaly.detectedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
