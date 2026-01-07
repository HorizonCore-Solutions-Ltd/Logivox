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
  Lock,
  Plus,
  RefreshCw,
  Package,
  AlertCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface QualityHoldStats {
  activeHolds: number;
  totalQuantityOnHold: number;
  totalValue: number;
  pendingRelease: number;
  releaseRate: number;
}

interface QualityHold {
  id: string;
  holdNumber: string;
  holdType: string;
  holdLevel: string;
  productName?: string;
  lotNumber?: string;
  quantityOnHold: number;
  quantityReleased: number;
  quantityRejected: number;
  quantityRemaining: number;
  reason: string;
  severity: string;
  status: string;
  releaseStatus?: string;
  createdAt: string;
}

export default function QualityHoldsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QualityHoldStats | null>(null);
  const [holds, setHolds] = useState<QualityHold[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [holdTypeFilter, setHoldTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const organizationId = "org_123"; // TODO: Get from auth context

  useEffect(() => {
    fetchData();
  }, [statusFilter, holdTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ organizationId });
      if (statusFilter) params.append("status", statusFilter);
      if (holdTypeFilter) params.append("holdType", holdTypeFilter);

      const [statsRes, holdsRes] = await Promise.all([
        fetch(`/api/qc/quality-holds/stats?organizationId=${organizationId}`),
        fetch(`/api/qc/quality-holds?${params.toString()}`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (holdsRes.ok) setHolds(await holdsRes.json());
    } catch (error) {
      console.error("Error fetching quality hold data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHolds = holds.filter(
    (hold) =>
      hold.holdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hold.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hold.lotNumber &&
        hold.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      ACTIVE: "bg-red-600",
      RELEASED: "bg-green-600",
      CANCELLED: "bg-gray-500",
      EXPIRED: "bg-orange-500",
    };
    return <Badge className={`${config[status]} text-white`}>{status}</Badge>;
  };

  const getReleaseStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">N/A</Badge>;

    const config: Record<string, string> = {
      PENDING: "bg-gray-500",
      REQUESTED: "bg-blue-500",
      APPROVED: "bg-green-600",
      REJECTED: "bg-red-600",
      RELEASED: "bg-emerald-700",
    };
    return <Badge className={`${config[status]} text-white`}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, string> = {
      CRITICAL: "bg-red-600",
      HIGH: "bg-orange-500",
      MEDIUM: "bg-yellow-500",
      LOW: "bg-blue-500",
    };
    return (
      <Badge className={`${config[severity]} text-white`}>{severity}</Badge>
    );
  };

  const getHoldTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      PRODUCT: "bg-purple-500",
      LOT: "bg-blue-500",
      LOCATION: "bg-green-600",
      VENDOR: "bg-orange-500",
      ORDER: "bg-pink-500",
    };
    return <Badge className={`${config[type]} text-white`}>{type}</Badge>;
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
          <h1 className="text-3xl font-bold">Quality Holds</h1>
          <p className="text-muted-foreground">
            Manage quarantine and hold releases
          </p>
        </div>
        <Link href="/dashboard/qc/quality-holds/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Hold
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Holds
              </CardTitle>
              <Lock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.activeHolds}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingRelease} pending release
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quantity On Hold
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalQuantityOnHold.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                units in quarantine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">value on hold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Release Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.releaseRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                successful releases
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Holds List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by hold number, lot, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={holdTypeFilter} onValueChange={setHoldTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="LOT">Lot</SelectItem>
                <SelectItem value="LOCATION">Location</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="ORDER">Order</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead>Hold Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lot/Product</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Qty On Hold</TableHead>
                  <TableHead>Qty Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Release Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolds.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground"
                    >
                      No quality holds found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHolds.map((hold) => (
                    <TableRow key={hold.id}>
                      <TableCell className="font-medium">
                        {hold.holdNumber}
                      </TableCell>
                      <TableCell>{getHoldTypeBadge(hold.holdType)}</TableCell>
                      <TableCell>
                        {hold.lotNumber || hold.productName || hold.holdLevel}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {hold.reason}
                      </TableCell>
                      <TableCell>{getSeverityBadge(hold.severity)}</TableCell>
                      <TableCell>
                        {hold.quantityOnHold.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {hold.quantityRemaining.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(hold.status)}</TableCell>
                      <TableCell>
                        {getReleaseStatusBadge(hold.releaseStatus)}
                      </TableCell>
                      <TableCell>
                        {new Date(hold.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/qc/quality-holds/${hold.id}`}>
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
