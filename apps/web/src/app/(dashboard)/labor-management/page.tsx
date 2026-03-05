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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  Briefcase,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface LaborMetric {
  id: string;
  employeeName: string;
  role: string;
  status: "active" | "break" | "off-shift";
  efficiency: number;
  lastActive: string;
}

export default function LaborManagementPage() {
  const [metrics, setMetrics] = useState<LaborMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchMetrics = async () => {
      // In a real implementation, this would fetch from /api/labor
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMetrics([
        {
          id: "1",
          employeeName: "John Doe",
          role: "Picker",
          status: "active",
          efficiency: 98,
          lastActive: "2 mins ago",
        },
        {
          id: "2",
          employeeName: "Jane Smith",
          role: "Packer",
          status: "break",
          efficiency: 95,
          lastActive: "15 mins ago",
        },
        {
          id: "3",
          employeeName: "Mike Johnson",
          role: "Receiver",
          status: "active",
          efficiency: 92,
          lastActive: "5 mins ago",
        },
      ]);
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Labor Management</h2>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workforce
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +10% from last shift
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Efficiency
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +15% from average
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
            <CardDescription>
              Real-time monitoring of active staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {metric.employeeName}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {metric.role}
                        </p>
                        <Badge
                          variant={
                            metric.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {metric.efficiency}% Efficiency
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Active {metric.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>
              Performance issues requiring attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-md border p-4">
                <AlertTriangle className="mt-1 h-5 w-5 text-yellow-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Low Efficiency Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Packing Station 4 is operating at 65% efficiency. Possible
                    equipment issue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
