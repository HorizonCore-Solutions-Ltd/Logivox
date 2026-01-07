"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface QualityMetrics {
  openNcrs: number;
  overdueCapas: number;
  activeHoldsValue: number;
  openComplaints: number;
  pendingMrb: number;
  upcomingCalibrations: number;
  expiringTraining: number;
}

interface QualityScore {
  score: number;
  grade: string;
  breakdown: {
    ncrScore: number;
    capaScore: number;
    complaintScore: number;
    calibrationScore: number;
    trainingScore: number;
  };
  recommendations: string[];
}

interface QualityAlert {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  details: any;
  timestamp: Date;
}

export default function QualityMetricsDashboard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [score, setScore] = useState<QualityScore | null>(null);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, scoreRes, alertsRes] = await Promise.all([
          fetch(`/api/qc/metrics/realtime?organizationId=${organizationId}`),
          fetch(`/api/qc/metrics/score?organizationId=${organizationId}`),
          fetch(`/api/qc/metrics/alerts?organizationId=${organizationId}`),
        ]);

        const metricsData = await metricsRes.json();
        const scoreData = await scoreRes.json();
        const alertsData = await alertsRes.json();

        setMetrics(metricsData);
        setScore(scoreData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading metrics...
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "default";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A") return "text-green-600";
    if (grade === "B") return "text-blue-600";
    if (grade === "C") return "text-yellow-600";
    if (grade === "D") return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Quality Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Quality Score
          </CardTitle>
          <CardDescription>
            Real-time quality performance assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {score && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`text-6xl font-bold ${getGradeColor(score.grade)}`}
                >
                  {score.grade}
                </div>
                <div className="flex-1">
                  <div className="text-3xl font-semibold">
                    {score.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    out of 100
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {score.breakdown.ncrScore}
                  </div>
                  <div className="text-xs text-muted-foreground">NCR</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {score.breakdown.capaScore}
                  </div>
                  <div className="text-xs text-muted-foreground">CAPA</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {score.breakdown.complaintScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Complaints
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {score.breakdown.calibrationScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Calibration
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {score.breakdown.trainingScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Training</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.openNcrs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-conformance reports
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Overdue CAPAs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.overdueCapas}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Holds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.activeHoldsValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total value on hold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.openComplaints}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer complaints
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending MRB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pendingMrb}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Material review board
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Calibrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.upcomingCalibrations}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due within 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Expiring Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.expiringTraining}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due within 60 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">
                    System Operational
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: just now
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quality Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quality Alerts
          </CardTitle>
          <CardDescription>Critical issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={
                    alert.severity === "CRITICAL" ? "destructive" : "default"
                  }
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={getSeverityColor(alert.severity) as any}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {score && score.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Improvement Recommendations</CardTitle>
            <CardDescription>
              Automated suggestions based on current metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
