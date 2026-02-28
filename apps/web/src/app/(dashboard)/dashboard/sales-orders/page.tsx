"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  RefreshCw,
  Eye,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface SalesOrder {
  id: string;
  soNumber: string;
  status: string;
  orderDate: string;
  requestedDate: string | null;
  total: number;
  currency: string;
  paymentStatus: string;
  customer: { name: string; code: string };
  warehouse: { name: string; code: string } | null;
  items: { id: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", variant: "outline", icon: <Clock className="h-3 w-3" /> },
  PENDING_APPROVAL: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: "Approved", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  PICKING: { label: "Picking", variant: "default", icon: <Package className="h-3 w-3" /> },
  PACKING: { label: "Packing", variant: "default", icon: <Package className="h-3 w-3" /> },
  READY_TO_SHIP: { label: "Ready to Ship", variant: "default", icon: <Truck className="h-3 w-3" /> },
  SHIPPED: { label: "Shipped", variant: "default", icon: <Truck className="h-3 w-3" /> },
  DELIVERED: { label: "Delivered", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function SalesOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, picking: 0, shipped: 0, revenue: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pagination.page), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/sales-orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setSalesOrders(data.salesOrders || []);
      setPagination((p) => ({ ...p, total: data.pagination?.total || 0, pages: data.pagination?.pages || 0 }));

      const all: SalesOrder[] = data.salesOrders || [];
      setStats({
        total: data.pagination?.total || 0,
        pending: all.filter((o) => o.status === "PENDING_APPROVAL").length,
        picking: all.filter((o) => ["PICKING", "PACKING"].includes(o.status)).length,
        shipped: all.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.status)).length,
        revenue: all.reduce((sum, o) => sum + (o.total || 0), 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchOrders, search]);

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <DashboardSidebar>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage customer orders from approval to delivery</p>
        </div>
        <Link href="/dashboard/sales-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: <ShoppingCart className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
          { label: "Pending Approval", value: stats.pending, icon: <Clock className="h-4 w-4 text-amber-500" />, color: "text-amber-600" },
          { label: "In Fulfillment", value: stats.picking, icon: <Package className="h-4 w-4 text-purple-500" />, color: "text-purple-600" },
          { label: "Shipped", value: stats.shipped, icon: <Truck className="h-4 w-4 text-green-500" />, color: "text-green-600" },
          { label: "Revenue (Page)", value: formatCurrency(stats.revenue), icon: <DollarSign className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {s.icon}
              </div>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading orders...
            </div>
          ) : salesOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
              <p>No sales orders found</p>
              <Link href="/dashboard/sales-orders/new">
                <Button variant="link" className="mt-1">Create your first order</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Required By</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, variant: "outline" as const, icon: null };
                  return (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">{order.soNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.orderDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.requestedDate ? formatDate(order.requestedDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total || 0, order.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/sales-orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardSidebar>
  );
}
