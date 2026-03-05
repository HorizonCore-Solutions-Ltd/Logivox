"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface QCDashboardData {
  stats: {
    passRate: string;
    pendingInspections: number;
    openCapas: number;
    deviationRate: string;
  };
  recentActivity: any[];
  actionRequired: {
    criticalCapas: any[];
  };
}

export default function QualityDashboard() {
  const { data, isLoading, isError } = useQuery<QCDashboardData>({
    queryKey: ["qc-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/qc/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 p-6">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }

  const kpiStats = [
    {
      label: "Pass Rate (7d)",
      value: data?.stats?.passRate || "0%",
      change: "Last 7 days",
      icon: ShieldCheck,
      color: "text-green-600",
    },
    {
      label: "Pending Inspections",
      value: data?.stats?.pendingInspections || 0,
      change: "Active Queue",
      icon: ClipboardCheck,
      color: "text-blue-600",
    },
    {
      label: "Open CAPAs",
      value: data?.stats?.openCapas || 0,
      change: "Requires Action",
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      label: "Deviations (Fail Rate)",
      value: data?.stats?.deviationRate || "0%",
      change: "Last 7 days",
      icon: Activity,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest inspections and quality events across the facility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!data?.recentActivity || data?.recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No recent activity found.
                </div>
              ) : (
                data.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          act.result === "FAIL"
                            ? "destructive"
                            : act.result === "PASS"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {act.result || act.status}
                      </Badge>
                      <div>
                        <div className="font-semibold">
                          Inspection #
                          {act.inspectionNumber || act.id.substring(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(act.supplier && `Supplier: ${act.supplier.name}`) ||
                            `Type: ${act.inspectionType}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
            <CardDescription>
              Critical issues requiring immediate attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Critical CAPAs */}
              {data?.actionRequired?.criticalCapas?.length > 0 ? (
                data.actionRequired.criticalCapas.map((capa: any) => (
                  <div
                    key={capa.id}
                    className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">
                        {capa.title}
                      </div>
                      <div className="text-xs text-red-700 mt-1">
                        Due:{" "}
                        {capa.dueDate
                          ? new Date(capa.dueDate).toLocaleDateString()
                          : "No Date"}{" "}
                        • {capa.priority}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-0 text-red-700 hover:text-red-900 mt-2"
                        asChild
                      >
                        <Link href={`/quality/capa`}>Review Now &rarr;</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-green-50 border border-green-100 rounded-md flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">All Clear</div>
                    <div className="text-xs text-green-700 mt-1">
                      No critical open actions pending.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
