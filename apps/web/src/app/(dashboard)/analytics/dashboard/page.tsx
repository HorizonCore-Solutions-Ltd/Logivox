/**
 * Analytics Dashboard
 * KPIs, performance metrics, and reporting
 */

"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
} from "lucide-react";

interface Analytics {
  loadSheets: {
    total: number;
    approved: number;
    departed: number;
    avgApprovalTime: number;
    onTimePercentage: number;
  };
  containers: {
    total: number;
    packed: number;
    shipped: number;
    avgWeight: number;
    avgUtilization: number;
  };
  workers: {
    total: number;
    active: number;
    avgProductivity: number;
    avgAccuracy: number;
  };
  voice: {
    totalCommands: number;
    avgAccuracy: number;
    avgResponseTime: number;
    topIntents: Array<{ intent: string; count: number }>;
  };
  interventions: {
    total: number;
    resolved: number;
    avgResolutionTime: number;
    bySeverity: Record<string, number>;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">(
    "today",
  );

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      const data = await response.json();

      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getTrend = (value: number, threshold: number = 80) => {
    if (value >= threshold) {
      return { icon: TrendingUp, color: "text-green-600" };
    }
    return { icon: TrendingDown, color: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Performance metrics and KPIs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateRange("today")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  dateRange === "today"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange("week")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  dateRange === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  dateRange === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Load Sheets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Truck className="w-8 h-8 text-blue-600" />
              {(() => {
                const trend = getTrend(analytics.loadSheets.onTimePercentage);
                const TrendIcon = trend.icon;
                return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.loadSheets.departed}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Load Sheets Departed
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-600 font-semibold">
                {analytics.loadSheets.onTimePercentage.toFixed(0)}%
              </span>
              <span className="text-gray-500">on-time</span>
            </div>
          </div>

          {/* Containers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-green-600" />
              {(() => {
                const trend = getTrend(analytics.containers.avgUtilization);
                const TrendIcon = trend.icon;
                return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.containers.shipped}
            </div>
            <div className="text-sm text-gray-600 mb-2">Containers Shipped</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-600 font-semibold">
                {analytics.containers.avgUtilization.toFixed(0)}%
              </span>
              <span className="text-gray-500">avg utilization</span>
            </div>
          </div>

          {/* Workers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-600" />
              {(() => {
                const trend = getTrend(analytics.workers.avgProductivity);
                const TrendIcon = trend.icon;
                return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.workers.active}
            </div>
            <div className="text-sm text-gray-600 mb-2">Active Workers</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-600 font-semibold">
                {analytics.workers.avgProductivity.toFixed(0)}%
              </span>
              <span className="text-gray-500">productivity</span>
            </div>
          </div>

          {/* Voice Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-orange-600" />
              {(() => {
                const trend = getTrend(analytics.voice.avgAccuracy, 90);
                const TrendIcon = trend.icon;
                return <TrendIcon className={`w-6 h-6 ${trend.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.voice.totalCommands}
            </div>
            <div className="text-sm text-gray-600 mb-2">Voice Commands</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-orange-600 font-semibold">
                {analytics.voice.avgAccuracy.toFixed(1)}%
              </span>
              <span className="text-gray-500">accuracy</span>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-6">
          {/* Load Sheet Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Load Sheet Performance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Load Sheets</span>
                <span className="font-bold text-gray-900">
                  {analytics.loadSheets.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Approved</span>
                <span className="font-bold text-green-600">
                  {analytics.loadSheets.approved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Departed</span>
                <span className="font-bold text-blue-600">
                  {analytics.loadSheets.departed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Approval Time</span>
                <span className="font-bold text-gray-900">
                  {analytics.loadSheets.avgApprovalTime.toFixed(1)} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">On-Time %</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.loadSheets.onTimePercentage}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-bold text-green-600">
                    {analytics.loadSheets.onTimePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Worker Performance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Workers</span>
                <span className="font-bold text-gray-900">
                  {analytics.workers.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Now</span>
                <span className="font-bold text-green-600">
                  {analytics.workers.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Productivity</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${analytics.workers.avgProductivity}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-purple-600">
                    {analytics.workers.avgProductivity.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Accuracy</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${analytics.workers.avgAccuracy}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-blue-600">
                    {analytics.workers.avgAccuracy.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interventions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                AI Interventions
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Interventions</span>
                <span className="font-bold text-gray-900">
                  {analytics.interventions.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Resolved</span>
                <span className="font-bold text-green-600">
                  {analytics.interventions.resolved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Resolution Time</span>
                <span className="font-bold text-gray-900">
                  {analytics.interventions.avgResolutionTime.toFixed(1)} min
                </span>
              </div>

              {/* By Severity */}
              <div className="pt-4 border-t space-y-2">
                {Object.entries(analytics.interventions.bySeverity).map(
                  ([severity, count]) => (
                    <div
                      key={severity}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{severity}</span>
                      <span
                        className={`font-bold ${
                          severity === "CRITICAL"
                            ? "text-red-600"
                            : severity === "HIGH"
                              ? "text-orange-600"
                              : severity === "MEDIUM"
                                ? "text-yellow-600"
                                : "text-blue-600"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Voice Commands */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Voice Command Analytics
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Commands</span>
                <span className="font-bold text-gray-900">
                  {analytics.voice.totalCommands}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Accuracy</span>
                <span className="font-bold text-green-600">
                  {analytics.voice.avgAccuracy.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-bold text-gray-900">
                  {(analytics.voice.avgResponseTime / 1000).toFixed(2)}s
                </span>
              </div>

              {/* Top Intents */}
              <div className="pt-4 border-t space-y-2">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Top Intents
                </div>
                {analytics.voice.topIntents.slice(0, 5).map((intent, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {intent.intent}
                    </span>
                    <span className="font-bold text-orange-600">
                      {intent.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
