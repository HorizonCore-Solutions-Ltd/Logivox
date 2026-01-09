"use client";

/**
 * PREDICTIVE EQUIPMENT MAINTENANCE DASHBOARD
 * ===========================================
 * 
 * System 1 - Outstanding ROI (315% ROI)
 * Investment: $45K → Savings: $141K/year
 * 
 * Features:
 * - AI-powered failure prediction
 * - Equipment health monitoring
 * - Maintenance scheduling
 * - Downtime prevention
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  Calendar,
} from "lucide-react";

interface Stats {
  scheduledMaintenance: number;
  completedThisMonth: number;
  totalMaintenance: number;
  totalCost: number;
  preventedDowntime: number;
  costSavings: number;
}

interface EquipmentHealth {
  equipmentId: string;
  equipmentName: string;
  type: string;
  healthScore: number;
  predictedFailureDate: Date | null;
  daysUntilFailure: number | null;
  failureProbability: number;
  maintenanceStatus: "OVERDUE" | "DUE_SOON" | "SCHEDULED" | "UP_TO_DATE";
  lastMaintenanceDate: Date | null;
  hoursOperated: number;
  errorCount: number;
  recommendations: string[];
}

export default function PredictiveMaintenancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "equipment" | "schedule">("overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("WH-001");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/optimization/predictive-maintenance?action=stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeEquipment() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/optimization/predictive-maintenance?action=analyzeAll&warehouseId=${selectedWarehouse}`
      );
      const data = await res.json();
      setAnalysis(data);
      setActiveTab("equipment");
    } catch (error) {
      console.error("Error analyzing equipment:", error);
      alert("Failed to analyze equipment");
    } finally {
      setLoading(false);
    }
  }

  async function scheduleMaintenance(equipment: EquipmentHealth) {
    const priority =
      equipment.healthScore < 30
        ? "URGENT"
        : equipment.healthScore < 50
        ? "HIGH"
        : "MEDIUM";

    try {
      const res = await fetch("/api/optimization/predictive-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scheduleMaintenance",
          data: {
            equipmentId: equipment.equipmentId,
            maintenanceType: equipment.healthScore < 30 ? "EMERGENCY" : "PREDICTIVE",
            scheduledDate: new Date(
              Date.now() + (equipment.daysUntilFailure || 7) * 24 * 60 * 60 * 1000
            ).toISOString(),
            priority,
            estimatedDuration: 4,
            estimatedCost: 1000,
            notes: equipment.recommendations[0],
          },
        }),
      });

      if (res.ok) {
        alert("Maintenance scheduled successfully!");
        loadData();
        analyzeEquipment();
      }
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      alert("Failed to schedule maintenance");
    }
  }

  const getHealthColor = (score: number) => {
    if (score < 30) return "bg-red-100 text-red-800";
    if (score < 50) return "bg-orange-100 text-orange-800";
    if (score < 80) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "DUE_SOON":
        return "bg-orange-100 text-orange-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "UP_TO_DATE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthIcon = (score: number) => {
    if (score < 30) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (score < 50) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    if (score < 80) return <Activity className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment data...</p>
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
            <Wrench className="h-8 w-8 text-blue-500" />
            Predictive Equipment Maintenance
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered failure prediction and maintenance scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            ROI: 315% 🚀
          </Badge>
          <Button onClick={analyzeEquipment} disabled={loading}>
            <Activity className="h-4 w-4 mr-2" />
            {loading ? "Analyzing..." : "Analyze Equipment"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">{stats?.scheduledMaintenance || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed (Month)</p>
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
                <p className="text-sm text-gray-600">Total Maintenance</p>
                <p className="text-2xl font-bold">{stats?.totalMaintenance || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">
                  ${((stats?.totalCost || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prevented Downtime</p>
                <p className="text-2xl font-bold">{stats?.preventedDowntime || 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold">
                  ${((stats?.costSavings || 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
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
          onClick={() => setActiveTab("equipment")}
          className={`px-4 py-2 font-medium ${
            activeTab === "equipment"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Equipment Health
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 font-medium ${
            activeTab === "schedule"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          Maintenance Schedule
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
                      <span>40% reduction in unplanned downtime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>25% lower maintenance costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>30% longer equipment lifespan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>50% reduction in emergency repairs</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Health Thresholds</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">Excellent</span>
                      <span className="text-xs text-gray-600">80-100%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm font-medium">Good</span>
                      <span className="text-xs text-gray-600">50-80%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm font-medium">Warning</span>
                      <span className="text-xs text-gray-600">30-50%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium">Critical</span>
                      <span className="text-xs text-gray-600">&lt;30%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Equipment Health Tab */}
      {activeTab === "equipment" && analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {analysis.summary.totalEquipment}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Equipment</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">
                    {analysis.summary.critical}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Critical</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600">
                    {analysis.summary.warning}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Warning</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">
                    {analysis.summary.good}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Good</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {analysis.summary.excellent}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Excellent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment List */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Health Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.equipment.map((eq: EquipmentHealth) => (
                  <div
                    key={eq.equipmentId}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getHealthIcon(eq.healthScore)}
                        <div>
                          <h3 className="font-semibold">{eq.equipmentName}</h3>
                          <p className="text-sm text-gray-600">{eq.equipmentId} • {eq.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getHealthColor(eq.healthScore)}>
                          Health: {eq.healthScore}%
                        </Badge>
                        <Badge className={getStatusColor(eq.maintenanceStatus)}>
                          {eq.maintenanceStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Hours Operated:</span>
                        <span className="ml-2 font-medium">{eq.hoursOperated}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Error Count:</span>
                        <span className="ml-2 font-medium">{eq.errorCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failure Risk:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {eq.failureProbability}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days to Failure:</span>
                        <span className="ml-2 font-medium">
                          {eq.daysUntilFailure ? `${eq.daysUntilFailure} days` : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Recommendations:
                      </p>
                      <ul className="space-y-1">
                        {eq.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-xs text-gray-600">
                            • {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => scheduleMaintenance(eq)}
                      size="sm"
                      variant={eq.healthScore < 30 ? "default" : "outline"}
                      disabled={eq.maintenanceStatus === "SCHEDULED"}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {eq.maintenanceStatus === "SCHEDULED"
                        ? "Already Scheduled"
                        : "Schedule Maintenance"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Maintenance Schedule Tab */}
      {activeTab === "schedule" && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Analyze equipment to view maintenance schedule
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
