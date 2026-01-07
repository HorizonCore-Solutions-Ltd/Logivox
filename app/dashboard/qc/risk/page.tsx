"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import { AlertTriangle, Plus, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface Risk {
  id: string;
  riskNumber: string;
  title: string;
  category: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  status: string;
  owner: string;
}

export default function RiskDashboard() {
  const router = useRouter();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    try {
      const response = await fetch("/api/qc/risk");
      const result = await response.json();

      if (result.success) {
        setRisks(result.data);
        calculateStats(result.data);
      }
    } catch (error) {
      console.error("Load risks error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (risks: Risk[]) => {
    setStats({
      total: risks.length,
      critical: risks.filter((r) => r.rpn >= 200).length,
      high: risks.filter((r) => r.rpn >= 125 && r.rpn < 200).length,
      medium: risks.filter((r) => r.rpn >= 50 && r.rpn < 125).length,
      low: risks.filter((r) => r.rpn < 50).length,
    });
  };

  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return "#ef4444"; // red
    if (rpn >= 125) return "#f97316"; // orange
    if (rpn >= 50) return "#eab308"; // yellow
    return "#22c55e"; // green
  };

  const getRPNBadge = (rpn: number) => {
    if (rpn >= 200)
      return <Badge className="bg-red-100 text-red-800">CRITICAL</Badge>;
    if (rpn >= 125)
      return <Badge className="bg-orange-100 text-orange-800">HIGH</Badge>;
    if (rpn >= 50)
      return <Badge className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>;
    return <Badge className="bg-green-100 text-green-800">LOW</Badge>;
  };

  // Prepare heatmap data
  const heatmapData = risks.map((risk) => ({
    x: risk.occurrence,
    y: risk.severity,
    z: risk.rpn,
    id: risk.id,
    title: risk.title,
    color: getRPNColor(risk.rpn),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground">ISO 9001:2015 Risk Register</p>
        </div>
        <Button onClick={() => router.push("/dashboard/qc/risk/create")}>
          <Plus className="w-4 h-4 mr-2" />
          New Risk Assessment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.critical}
            </div>
            <p className="text-xs text-muted-foreground">RPN ≥ 200</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.high}
            </div>
            <p className="text-xs text-muted-foreground">RPN 125-199</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.medium}
            </div>
            <p className="text-xs text-muted-foreground">RPN 50-124</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.low}</div>
            <p className="text-xs text-muted-foreground">RPN &lt; 50</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Heatmap</CardTitle>
          <CardDescription>
            Severity vs Occurrence (bubble size = RPN)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Occurrence"
                domain={[0, 11]}
                label={{
                  value: "Occurrence (Likelihood)",
                  position: "insideBottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Severity"
                domain={[0, 11]}
                label={{
                  value: "Severity (Impact)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 1000]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-semibold">{data.title}</p>
                        <p className="text-sm">Severity: {data.y}</p>
                        <p className="text-sm">Occurrence: {data.x}</p>
                        <p className="text-sm font-bold">RPN: {data.z}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={heatmapData}>
                {heatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Risks</CardTitle>
          <CardDescription>
            Sorted by Risk Priority Number (RPN)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {risks.length > 0 ? (
              risks
                .sort((a, b) => b.rpn - a.rpn)
                .map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/qc/risk/${risk.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        {getRPNBadge(risk.rpn)}
                        <span className="font-medium">{risk.riskNumber}</span>
                        <Badge variant="outline">{risk.category}</Badge>
                      </div>
                      <p className="text-sm">{risk.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {risk.owner} | S:{risk.severity} O:
                        {risk.occurrence} D:{risk.detection}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: getRPNColor(risk.rpn) }}
                      >
                        {risk.rpn}
                      </div>
                      <p className="text-xs text-muted-foreground">RPN</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No risks registered yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/dashboard/qc/risk/create")}
                >
                  Create First Risk Assessment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
