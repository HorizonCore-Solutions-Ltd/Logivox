"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, 
  Search, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface GRN {
  id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  totalReceived: number;
  currency: string;
  hasDiscrepancy: boolean;
  qcStatus: string | null;
  purchaseOrder: {
    poNumber: string;
    supplier: {
      name: string;
      code: string;
    };
  };
  warehouse: {
    name: string;
    code: string;
  } | null;
  receivedBy: {
    name: string;
  };
  items: any[];
}

interface Statistics {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  completed: number;
}

export default function GRNListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    completed: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchGRNs();
  }, [search, statusFilter, pagination.page]);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/grn?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGRNs(data.grns || []);
        setPagination(data.pagination);

        // Calculate statistics
        const stats = data.grns.reduce(
          (acc: Statistics, grn: GRN) => {
            acc.total++;
            if (grn.status === "DRAFT") acc.draft++;
            if (grn.status === "PENDING" || grn.status === "QUALITY_CHECK") acc.pending++;
            if (grn.status === "APPROVED") acc.approved++;
            if (grn.status === "COMPLETED") acc.completed++;
            return acc;
          },
          { total: 0, draft: 0, pending: 0, approved: 0, completed: 0 }
        );
        setStatistics(stats);
      }
    } catch (error) {
      console.error("Error fetching GRNs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "QUALITY_CHECK":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQCStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800";
      case "FAIL":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Receipt Notes</h1>
          <p className="text-muted-foreground">
            Manage incoming inventory receipts and quality control
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/grn/receive")}>
          <Plus className="mr-2 h-4 w-4" />
          Receive Goods
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GRNs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending QC</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter GRNs</CardTitle>
          <CardDescription>Search and filter goods receipt notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by GRN number, PO number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="QUALITY_CHECK">Quality Check</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* GRNs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt History</CardTitle>
          <CardDescription>
            {pagination.total} total receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : grns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No goods receipt notes found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN Number</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.map((grn) => (
                    <TableRow
                      key={grn.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/grn/${grn.id}`)}
                    >
                      <TableCell className="font-medium">
                        {grn.grnNumber}
                        {grn.hasDiscrepancy && (
                          <Badge variant="outline" className="ml-2 bg-yellow-50">
                            Discrepancy
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{grn.purchaseOrder.poNumber}</TableCell>
                      <TableCell>
                        {grn.purchaseOrder.supplier.name}
                        <div className="text-xs text-muted-foreground">
                          {grn.purchaseOrder.supplier.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {grn.warehouse ? grn.warehouse.name : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{grn.items.length}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(grn.status)}>
                          {grn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {grn.qcStatus ? (
                          <Badge className={getQCStatusColor(grn.qcStatus)}>
                            {grn.qcStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {grn.currency} {grn.totalReceived.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/grn/${grn.id}`);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
