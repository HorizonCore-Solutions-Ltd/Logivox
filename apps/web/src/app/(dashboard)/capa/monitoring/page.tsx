/**
 * CAPA Effectiveness Monitoring Dashboard
 * Real-time monitoring of closed CAPAs to detect failures
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EffectivenessVerification } from "@/components/capa/effectiveness-verification";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

interface EffectivenessMetrics {
  capaId: string;
  capaNumber: string;
  closedDate: string;
  monitoringDays: number;
  recurrenceDetected: boolean;
  effectivenessScore: number;
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  relatedIncidents: number;
  recommendation: string;
}

interface Statistics {
  totalCAPAs: number;
  verifiedEffective: number;
  verifiedIneffective: number;
  pendingVerification: number;
  recurrencesDetected: number;
  avgEffectivenessScore: number;
  effectivenessRate: number;
  recurrenceRate: number;
}

export default function EffectivenessMonitoringPage() {
  const [effectivenessData, setEffectivenessData] = useState<
    EffectivenessMetrics[]
  >([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [monitoringPeriod, setMonitoringPeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [daysBack, setDaysBack] = useState<number>(90);
  const [selectedCAPA, setSelectedCAPA] = useState<any | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/capa/effectiveness?status=${filterStatus}&daysBack=${daysBack}`,
      );
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setEffectivenessData(data.effectivenessData || []);
      setStatistics(data.statistics || null);
      setMonitoringPeriod(data.monitoringPeriod || "");
    } catch (error) {
      console.error("Error fetching effectiveness data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filterStatus, daysBack]);

  const handleVerify = async (capa: EffectivenessMetrics) => {
    // Fetch full CAPA details
    const response = await fetch(`/api/capa/${capa.capaId}`);
    if (response.ok) {
      const fullCAPA = await response.json();
      setSelectedCAPA(fullCAPA);
      setShowVerification(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASSED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PASSED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || ""}>
        {status}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85)
      return <Badge className="bg-green-100 text-green-800">{score}%</Badge>;
    if (score >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800">{score}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">{score}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">CAPA Recovery Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time recurrence and recovery visibility for closed CAPAs ·{" "}
            {monitoringPeriod}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={daysBack.toString()}
            onValueChange={(value) => setDaysBack(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Monitored CAPAs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics.totalCAPAs}</div>
              <p className="text-xs text-gray-500 mt-1">Under monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Effectiveness Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-600">
                  {statistics.effectivenessRate}%
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.verifiedEffective} verified effective
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Recovery Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-red-600">
                  {statistics.recurrenceRate}%
                </div>
                {statistics.recurrenceRate > 10 ? (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.recurrencesDetected} recurrences detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Effectiveness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statistics.avgEffectivenessScore}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.pendingVerification} pending verification
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Monitored CAPAs</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending Verification</SelectItem>
                <SelectItem value="PASSED">Verified Effective</SelectItem>
                <SelectItem value="FAILED">Ineffective</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAPA Number</TableHead>
                <TableHead>Closed Date</TableHead>
                <TableHead>Monitoring Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recurrence</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectivenessData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-gray-500">
                      No CAPAs found for the selected period
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                effectivenessData.map((capa) => (
                  <TableRow key={capa.capaId}>
                    <TableCell className="font-medium">
                      {capa.capaNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(capa.closedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{capa.monitoringDays} days</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(capa.verificationStatus)}
                        {getStatusBadge(capa.verificationStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getScoreBadge(capa.effectivenessScore)}
                    </TableCell>
                    <TableCell>
                      {capa.recurrenceDetected ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">
                            {capa.relatedIncidents} incident(s)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {capa.recommendation}
                    </TableCell>
                    <TableCell>
                      {capa.verificationStatus === "PENDING" &&
                        capa.monitoringDays >= 30 && (
                          <Button size="sm" onClick={() => handleVerify(capa)}>
                            Verify
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <EffectivenessVerification
        open={showVerification}
        onOpenChange={setShowVerification}
        capa={selectedCAPA}
        onSuccess={fetchData}
      />
    </div>
  );
}
