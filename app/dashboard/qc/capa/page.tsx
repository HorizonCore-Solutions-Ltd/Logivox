"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface CAPAStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  verified: number;
  closed: number;
  avgRPN: number;
  highRisk: number;
  overdue: number;
  avgCompletionDays: number;
}

interface CAPA {
  id: string;
  capaNumber: string;
  title: string;
  capaType: string;
  status: string;
  riskPriorityNumber: number;
  targetCompletionDate: string | null;
  createdAt: string;
}

export default function CAPADashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CAPAStats | null>(null);
  const [capas, setCAPAs] = useState<CAPA[]>([]);
  const [overdueCAPAs, setOverdueCAPAs] = useState<CAPA[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOverdue, setShowOverdue] = useState(false);

  const organizationId = "org_123"; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ organizationId });
      if (statusFilter) params.append("status", statusFilter);

      const [statsRes, capasRes, overdueRes] = await Promise.all([
        fetch(`/api/qc/capa/stats?organizationId=${organizationId}`),
        fetch(`/api/qc/capa?${params.toString()}`),
        fetch(`/api/qc/capa/overdue?organizationId=${organizationId}`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (capasRes.ok) setCAPAs(await capasRes.json());
      if (overdueRes.ok) setOverdueCAPAs(await overdueRes.json());
    } catch (error) {
      console.error("Error fetching CAPA data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCAPAs = (showOverdue ? overdueCAPAs : capas).filter(
    (capa) =>
      capa.capaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      OPEN: "bg-blue-500",
      IN_PROGRESS: "bg-yellow-500",
      COMPLETED: "bg-purple-500",
      VERIFIED: "bg-green-600",
      CLOSED: "bg-gray-600",
    };
    return (
      <Badge className={`${config[status]} text-white`}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      CORRECTIVE: "bg-orange-500",
      PREVENTIVE: "bg-blue-500",
      BOTH: "bg-purple-500",
    };
    return <Badge className={`${config[type]} text-white`}>{type}</Badge>;
  };

  const getRPNBadge = (rpn: number) => {
    if (rpn >= 200)
      return <Badge className="bg-red-600 text-white">High ({rpn})</Badge>;
    if (rpn >= 100)
      return <Badge className="bg-orange-500 text-white">Medium ({rpn})</Badge>;
    return <Badge className="bg-green-600 text-white">Low ({rpn})</Badge>;
  };

  const isOverdue = (targetDate: string | null) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Corrective & Preventive Actions
          </h1>
          <p className="text-muted-foreground">
            Manage CAPA workflow and risk assessment
          </p>
        </div>
        <Link href="/dashboard/qc/capa/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create CAPA
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total CAPAs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.open} open, {stats.closed} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average RPN</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgRPN.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.highRisk} high risk (RPN &gt; 100)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <p className="text-xs text-muted-foreground">
                Past target completion date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Completion
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgCompletionDays.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.verified} verified
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>CAPA List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by CAPA number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showOverdue ? "default" : "outline"}
              onClick={() => setShowOverdue(!showOverdue)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Overdue ({overdueCAPAs.length})
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CAPA Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>RPN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCAPAs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No CAPAs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCAPAs.map((capa) => (
                    <TableRow key={capa.id}>
                      <TableCell className="font-medium">
                        {capa.capaNumber}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {capa.title}
                      </TableCell>
                      <TableCell>{getTypeBadge(capa.capaType)}</TableCell>
                      <TableCell>
                        {getRPNBadge(capa.riskPriorityNumber)}
                      </TableCell>
                      <TableCell>{getStatusBadge(capa.status)}</TableCell>
                      <TableCell>
                        {capa.targetCompletionDate ? (
                          <span
                            className={
                              isOverdue(capa.targetCompletionDate)
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {new Date(
                              capa.targetCompletionDate,
                            ).toLocaleDateString()}
                            {isOverdue(capa.targetCompletionDate) &&
                              " (Overdue)"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(capa.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/qc/capa/${capa.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
