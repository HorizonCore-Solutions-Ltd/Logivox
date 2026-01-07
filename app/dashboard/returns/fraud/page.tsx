"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  User,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface FraudStats {
  total_analyses: number;
  avg_risk_score: number;
  high_risk_count: number;
  critical_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

interface FraudSignal {
  signal_type: string;
  occurrences: number;
  avg_severity: number;
}

interface FlaggedReturn {
  id: string;
  rma_number: string;
  customer_name: string;
  risk_score: number;
  risk_level: string;
  signals: any[];
  created_at: string;
}

export default function FraudDetectionDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [topSignals, setTopSignals] = useState<FraudSignal[]>([]);
  const [flaggedReturns, setFlaggedReturns] = useState<FlaggedReturn[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    try {
      setLoading(true);

      // Fetch fraud stats
      const response = await fetch("/api/returns/fraud?type=stats");
      const data = await response.json();

      setStats(data.stats);
      setTopSignals(data.topSignals || []);

      // Fetch flagged returns
      const flaggedResponse = await fetch("/api/rmas?flagged=true");
      const flaggedData = await flaggedResponse.json();
      setFlaggedReturns(flaggedData.rmas || []);
    } catch (error) {
      console.error("Error fetching fraud data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const config = {
      CRITICAL: { color: "bg-red-500", text: "Critical" },
      HIGH: { color: "bg-orange-500", text: "High" },
      MEDIUM: { color: "bg-yellow-500", text: "Medium" },
      LOW: { color: "bg-green-500", text: "Low" },
    };

    const { color, text } =
      config[riskLevel as keyof typeof config] || config.LOW;

    return <Badge className={`${color} text-white`}>{text}</Badge>;
  };

  const filteredReturns = flaggedReturns.filter(
    (r) =>
      r.rma_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Fraud Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered fraud monitoring and prevention
          </p>
        </div>
        <Button onClick={fetchFraudData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Analyses
            </CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_analyses || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Risk Score
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.avg_risk_score || 0).toFixed(1)}
            </div>
            <p className="text-xs text-green-600">Within normal range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.high_risk_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.critical_risk_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Fraud Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Top Fraud Signals (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSignals.slice(0, 5).map((signal, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {signal.signal_type.replace(/_/g, " ").toLowerCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg severity: {parseFloat(signal.avg_severity).toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{signal.occurrences}</div>
                  <div className="text-sm text-muted-foreground">
                    occurrences
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flagged Returns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Flagged Returns</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReturns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No flagged returns found</p>
                <p className="text-sm">
                  All returns are within acceptable risk thresholds
                </p>
              </div>
            ) : (
              filteredReturns.map((ret) => (
                <div
                  key={ret.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <AlertTriangle
                      className={`w-8 h-8 ${
                        ret.risk_level === "CRITICAL"
                          ? "text-red-500"
                          : ret.risk_level === "HIGH"
                            ? "text-orange-500"
                            : "text-yellow-500"
                      }`}
                    />
                    <div>
                      <div className="font-bold">{ret.rma_number}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {ret.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(ret.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{ret.risk_score}</div>
                      <div className="text-xs text-muted-foreground">
                        risk score
                      </div>
                    </div>
                    {getRiskBadge(ret.risk_level)}
                    <Link href={`/dashboard/rmas/${ret.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-500">
              {stats?.critical_risk_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Critical Risk</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-500">
              {stats?.high_risk_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-500">
              {stats?.medium_risk_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Medium Risk</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">
              {stats?.low_risk_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Low Risk</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
