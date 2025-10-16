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
  ShoppingCart, 
  Search, 
  Plus,
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  ArrowRight,
  DollarSign,
} from "lucide-react";

interface SalesOrder {
  id: string;
  soNumber: string;
  status: string;
  orderDate: string;
  requestedDate: string | null;
  total: number;
  currency: string;
  paymentStatus: string;
  customer: {
    name: string;
    code: string;
  };
  warehouse: {
    name: string;
    code: string;
  } | null;
  items: any[];
}

interface Statistics {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  picking: number;
  shipped: number;
  revenue: number;
}

export default function SalesOrdersListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    picking: 0,
    shipped: 0,
    revenue: 0,
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
    fetchSalesOrders();
  }, [search, statusFilter, pagination.page]);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/sales-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.salesOrders || []);
        setPagination(data.pagination);

        // Calculate statistics
        const stats = data.salesOrders.reduce(
          (acc: Statistics, so: SalesOrder) => {
            acc.total++;
            if (so.status === "DRAFT") acc.draft++;
            if (so.status === "PENDING_APPROVAL") acc.pending++;
            if (so.status === "APPROVED") acc.approved++;
            if (so.status === "PICKING" || so.status === "PICKED" || so.status === "PACKING") acc.picking++;
            if (so.status === "SHIPPED" || so.status === "DELIVERED") acc.shipped++;
            if (so.status === "DELIVERED") acc.revenue += parseFloat(so.total.toString());
            return acc;
          },
          { total: 0, draft: 0, pending: 0, approved: 0, picking: 0, shipped: 0, revenue: 0 }
        );
        setStatistics(stats);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PICKING":
      case "PICKED":
        return "bg-indigo-100 text-indigo-800";
      case "PACKING":
      case "PACKED":
        return "bg-purple-100 text-purple-800";
      case "SHIPPED":
        return "bg-cyan-100 text-cyan-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "ON_HOLD":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and fulfillment
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/sales-orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Sales Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.picking}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statistics.revenue.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
          <CardDescription>Search and filter sales orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SO number, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PICKING">Picking</SelectItem>
                <SelectItem value="PICKED">Picked</SelectItem>
                <SelectItem value="PACKING">Packing</SelectItem>
                <SelectItem value="PACKED">Packed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {pagination.total} total orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : salesOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales orders found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesOrders.map((so) => (
                    <TableRow
                      key={so.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/sales-orders/${so.id}`)}
                    >
                      <TableCell className="font-medium">
                        {so.soNumber}
                      </TableCell>
                      <TableCell>
                        {so.customer.name}
                        <div className="text-xs text-muted-foreground">
                          {so.customer.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {so.warehouse ? so.warehouse.name : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(so.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {so.requestedDate
                          ? new Date(so.requestedDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{so.items.length}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(so.status)}>
                          {so.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(so.paymentStatus)}>
                          {so.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {so.currency} {so.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/sales-orders/${so.id}`);
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
