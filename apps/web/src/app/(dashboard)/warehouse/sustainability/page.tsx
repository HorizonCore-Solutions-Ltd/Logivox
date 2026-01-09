/**
 * Sustainability & Carbon Tracking Dashboard
 * Environmental impact monitoring and ESG reporting
 */

"use client";

import { useState, useEffect } from "react";
import {
  Leaf,
  Zap,
  Recycle,
  TrendingDown,
  Award,
  FileText,
  Target,
} from "lucide-react";

interface CarbonFootprint {
  totalCarbonKg: number;
  totalCarbonTons: number;
  shipmentsCount: number;
  avgPerShipment: number;
  trend: number;
  breakdown: {
    transportation: number;
    energy: number;
  };
}

interface EnergyConsumption {
  totalKwh: number;
  totalCost: number;
  renewablePercent: number;
  avgDailyKwh: number;
  breakdown: {
    lighting: number;
    hvac: number;
    equipment: number;
    other: number;
  };
}

interface WasteMetrics {
  totalWaste: number;
  recycled: number;
  landfill: number;
  recyclingRate: number;
  breakdown: Record<string, number>;
  costSavings: number;
  carbonAvoided: number;
}

interface SustainabilityScore {
  score: number;
  grade: string;
  factors: Record<string, string>;
  recommendations: string[];
}

export default function SustainabilityDashboard() {
  const [carbonFootprint, setCarbonFootprint] =
    useState<CarbonFootprint | null>(null);
  const [energy, setEnergy] = useState<EnergyConsumption | null>(null);
  const [waste, setWaste] = useState<WasteMetrics | null>(null);
  const [score, setScore] = useState<SustainabilityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "carbon" | "energy" | "waste"
  >("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCarbonFootprint(),
        fetchEnergy(),
        fetchWaste(),
        fetchScore(),
      ]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarbonFootprint = async () => {
    const response = await fetch("/api/sustainability?action=carbon-footprint");
    const data = await response.json();
    setCarbonFootprint(data.footprint);
  };

  const fetchEnergy = async () => {
    const response = await fetch(
      "/api/sustainability?action=energy-consumption",
    );
    const data = await response.json();
    setEnergy(data.energy);
  };

  const fetchWaste = async () => {
    const response = await fetch("/api/sustainability?action=waste-metrics");
    const data = await response.json();
    setWaste(data.waste);
  };

  const fetchScore = async () => {
    const response = await fetch(
      "/api/sustainability?action=sustainability-score",
    );
    const data = await response.json();
    setScore(data.score);
  };

  const generateESGReport = async () => {
    if (!confirm("Generate ESG Report?")) return;

    try {
      const response = await fetch("/api/sustainability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-report",
          params: {
            format: "PDF",
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("ESG Report generated successfully!");
      }
    } catch (error) {
      console.error("Report generation error:", error);
      alert("Failed to generate report");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (trend: number) => {
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600 rotate-180" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sustainability & Carbon Tracking
            </h1>
            <p className="text-gray-600 mt-2">
              Environmental impact monitoring and ESG reporting
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <Leaf className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
              Refresh
            </button>
            <button
              onClick={generateESGReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <FileText className="w-4 h-4" />
              Generate ESG Report
            </button>
          </div>
        </div>
      </div>

      {/* Sustainability Score Card */}
      {score && (
        <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sustainability Score
                </h2>
              </div>
              <p className="text-gray-600">
                Overall environmental performance rating
              </p>
            </div>
            <div className="text-center">
              <div
                className={`text-6xl font-bold ${getScoreColor(score.score)}`}
              >
                {score.score}
              </div>
              <div className="text-2xl font-bold text-gray-700 mt-2">
                Grade: {score.grade}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Carbon Footprint</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {carbonFootprint?.totalCarbonTons || 0} t
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                {carbonFootprint && getTrendIcon(carbonFootprint.trend)}
                <span
                  className={
                    carbonFootprint?.trend < 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(carbonFootprint?.trend || 0)}%
                </span>
              </div>
            </div>
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Energy Usage</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {energy?.totalKwh.toLocaleString() || 0} kWh
              </p>
              <p className="text-sm text-green-600 mt-2">
                {energy?.renewablePercent || 0}% renewable
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recycling Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {waste?.recyclingRate || 0}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {waste?.recycled || 0} kg recycled
              </p>
            </div>
            <Recycle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${waste?.costSavings.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">From recycling</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === "overview"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Award className="w-5 h-5" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("carbon")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === "carbon"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Leaf className="w-5 h-5" />
          Carbon Footprint
        </button>
        <button
          onClick={() => setActiveTab("energy")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === "energy"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Zap className="w-5 h-5" />
          Energy
        </button>
        <button
          onClick={() => setActiveTab("waste")}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
            activeTab === "waste"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Recycle className="w-5 h-5" />
          Waste Management
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sustainability data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && score && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Sustainability Overview
                </h2>

                {/* Performance Factors */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Performance Factors
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(score.factors).map(([key, value]) => (
                      <div
                        key={key}
                        className={`border rounded-lg p-4 ${
                          value === "GOOD"
                            ? "bg-green-50 border-green-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            value === "GOOD"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Improvement Recommendations
                  </h3>
                  <div className="space-y-3">
                    {score.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Carbon Tab */}
            {activeTab === "carbon" && carbonFootprint && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Carbon Footprint Analysis
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Total Emissions
                    </h3>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {carbonFootprint.totalCarbonTons} tons
                    </div>
                    <p className="text-sm text-gray-600">
                      From {carbonFootprint.shipmentsCount} shipments
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      {getTrendIcon(carbonFootprint.trend)}
                      <span
                        className={
                          carbonFootprint.trend < 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {Math.abs(carbonFootprint.trend)}% vs last period
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Average per Shipment
                    </h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {carbonFootprint.avgPerShipment} kg
                    </div>
                    <p className="text-sm text-gray-600">
                      CO₂ emissions per shipment
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Emissions Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Transportation
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {carbonFootprint.breakdown.transportation} kg
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${
                              (carbonFootprint.breakdown.transportation /
                                carbonFootprint.totalCarbonKg) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Energy
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {carbonFootprint.breakdown.energy} kg
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-600 rounded-full"
                          style={{
                            width: `${
                              (carbonFootprint.breakdown.energy /
                                carbonFootprint.totalCarbonKg) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Energy Tab */}
            {activeTab === "energy" && energy && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Energy Consumption
                </h2>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Total Consumption
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {energy.totalKwh.toLocaleString()} kWh
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Total Cost</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${energy.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Renewable Energy
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {energy.renewablePercent}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Consumption Breakdown
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(energy.breakdown).map(
                      ([category, value]) => (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {category}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {value} kWh
                            </span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-600 rounded-full"
                              style={{
                                width: `${(value / energy.totalKwh) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Waste Tab */}
            {activeTab === "waste" && waste && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Waste Management
                </h2>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Total Waste</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {waste.totalWaste} kg
                    </p>
                  </div>
                  <div className="border border-green-200 rounded-lg p-6 text-center bg-green-50">
                    <p className="text-sm text-gray-600 mb-2">Recycled</p>
                    <p className="text-3xl font-bold text-green-600">
                      {waste.recycled} kg
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Recycling Rate</p>
                    <p className="text-3xl font-bold text-green-600">
                      {waste.recyclingRate}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Cost Savings
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      ${waste.costSavings.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      From recycling programs
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Carbon Avoided
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {waste.carbonAvoided} kg CO₂
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Through recycling
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Waste by Type
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(waste.breakdown).map(([type, amount]) => (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {type}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {amount} kg
                          </span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(amount / waste.totalWaste) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
