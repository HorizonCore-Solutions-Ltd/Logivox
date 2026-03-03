"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  RefreshCw,
  Clock,
} from "lucide-react";

interface RiskIndicator {
  metric: string;
  currentValue: number;
  threshold: number;
  trend: "INCREASING" | "DECREASING" | "STABLE";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  prediction: string;
}

interface PredictiveCAPAAlert {
  alertId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  predictedIssue: string;
  probabilityScore: number;
  timeToImpact: string;
  affectedAreas: string[];
  recommendedActions: string[];
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertOctagon,
    iconColor: "text-red-600",
  },
  HIGH: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
  },
  MEDIUM: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    iconColor: "text-yellow-600",
  },
  LOW: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: ShieldCheck,
    iconColor: "text-green-600",
  },
};

const TREND_ICON: Record<string, string> = {
  INCREASING: "↑",
  DECREASING: "↓",
  STABLE: "→",
};

export default function PredictiveCAPAPage() {
  const [alerts, setAlerts] = useState<PredictiveCAPAAlert[]>([]);
  const [indicators, setIndicators] = useState<RiskIndicator[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/capa/predictive?${params}`);
      if (!res.ok) throw new Error("Failed to load predictive data");
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setIndicators(data.riskIndicators ?? []);
      setSummary(data.summary ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
  const high = alerts.filter((a) => a.severity === "HIGH").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Predictive CAPA</h1>
            <p className="text-sm text-muted-foreground">
              AI early-warning system — detect risks before issues occur
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical Alerts", value: critical, color: "text-red-600" },
          { label: "High Alerts", value: high, color: "text-orange-600" },
          {
            label: "Total Alerts",
            value: alerts.length,
            color: "text-foreground",
          },
          {
            label: "Risk Indicators",
            value: indicators.length,
            color: "text-blue-600",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="QUALITY">Quality</SelectItem>
            <SelectItem value="PROCESS">Process</SelectItem>
            <SelectItem value="SUPPLIER">Supplier</SelectItem>
            <SelectItem value="EQUIPMENT">Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Predictive Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p>No predictive alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const cfg =
                  SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.LOW;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.alertId}
                    className={`border rounded-lg p-4 ${cfg.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                          <span className="text-xs ml-auto">
                            {alert.probabilityScore}% probability ·{" "}
                            {alert.timeToImpact}
                          </span>
                        </div>
                        <p className="font-medium text-sm">
                          {alert.predictedIssue}
                        </p>
                        {alert.affectedAreas?.length > 0 && (
                          <p className="text-xs mt-1">
                            Affected: {alert.affectedAreas.join(", ")}
                          </p>
                        )}
                        {alert.recommendedActions?.length > 0 && (
                          <ul className="mt-2 list-disc list-inside space-y-0.5">
                            {alert.recommendedActions.slice(0, 3).map((a, i) => (
                              <li key={i} className="text-xs">
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk indicators */}
      {indicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {indicators.map((ind, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 bg-muted/30 flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm font-medium">{ind.metric}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ind.prediction}
                    </p>
                  </div>
                  <div className="text-right space-y-1 flex-shrink-0 ml-4">
                    <Badge
                      variant="outline"
                      className={
                        ind.riskLevel === "CRITICAL"
                          ? "border-red-400 text-red-700"
                          : ind.riskLevel === "HIGH"
                            ? "border-orange-400 text-orange-700"
                            : ind.riskLevel === "MEDIUM"
                              ? "border-yellow-400 text-yellow-700"
                              : "border-green-400 text-green-700"
                      }
                    >
                      {ind.riskLevel}
                    </Badge>
                    <p className="text-xs">
                      {TREND_ICON[ind.trend]} {ind.currentValue} / {ind.threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
