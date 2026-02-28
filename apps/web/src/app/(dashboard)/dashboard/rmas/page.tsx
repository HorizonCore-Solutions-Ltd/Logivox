"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus, ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";

interface RMA {
  id: string;
  rmaNumber: string;
  status: string;
  requestedDate: string;
  totalRefundAmount: number;
  customer: {
    name: string;
    email: string;
  };
  returnReason: {
    name: string;
  };
  _count: {
    items: number;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  RECEIVED: "bg-indigo-100 text-indigo-800",
  INSPECTING: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function RMAsPage() {
  const { data: session } = useSession();
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadRMAs();
  }, [page, statusFilter]);

  const loadRMAs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/rmas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRmas(data.rmas || []);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading RMAs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRMAs();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Returns Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer returns and RMA requests
          </p>
        </div>
        <Link href="/dashboard/rmas/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create RMA
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter RMAs</CardTitle>
          <CardDescription>Search and filter return requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by RMA#, customer, or tracking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="INSPECTING">Inspecting</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="secondary">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RMAs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading RMAs...
                </p>
              </div>
            </div>
          ) : rmas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No RMAs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Return Reason</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rmas.map((rma) => (
                  <TableRow key={rma.id}>
                    <TableCell className="font-medium">
                      {rma.rmaNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rma.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rma.customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{rma.returnReason.name}</TableCell>
                    <TableCell>{rma._count.items}</TableCell>
                    <TableCell>{formatDate(rma.requestedDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[rma.status] || ""}>
                        {rma.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rma.totalRefundAmount > 0
                        ? formatCurrency(rma.totalRefundAmount)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/rmas/${rma.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && (rmas.length > 0 || page > 1) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
