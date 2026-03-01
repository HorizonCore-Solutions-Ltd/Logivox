"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  DollarSign,
  RefreshCw,
  Eye,
  Send,
  FileText,
  Lock,
  ChevronDown,
  Printer,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
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
  invoiceNumber: string | null;
  customer: { name: string; code: string };
  warehouse: { name: string; code: string } | null;
  items: { id: string }[];
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    color?: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  PENDING_APPROVAL: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  RELEASED: {
    label: "Released",
    variant: "default",
    icon: <Send className="h-3 w-3" />,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  PICKING: {
    label: "Picking",
    variant: "default",
    icon: <Package className="h-3 w-3" />,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  PACKING: {
    label: "Packing",
    variant: "default",
    icon: <Package className="h-3 w-3" />,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  READY_TO_SHIP: {
    label: "Ready to Ship",
    variant: "default",
    icon: <Truck className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  PACKED: {
    label: "Packed",
    variant: "default",
    icon: <Package className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  SHIPPED: {
    label: "Shipped",
    variant: "default",
    icon: <Truck className="h-3 w-3" />,
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  INVOICED: {
    label: "Invoiced",
    variant: "default",
    icon: <FileText className="h-3 w-3" />,
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
  CLOSED: {
    label: "Closed",
    variant: "outline",
    icon: <Lock className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  ON_HOLD: {
    label: "On Hold",
    variant: "secondary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

/** Which action buttons to show per status */
const ORDER_ACTIONS: Record<string, string[]> = {
  APPROVED: ["release", "invoice"],
  RELEASED: ["invoice", "packing-slip"],
  PICKING: ["invoice", "packing-slip"],
  PACKING: ["invoice", "packing-slip"],
  PACKED: ["packing-slip", "invoice"],
  READY_TO_SHIP: ["packing-slip", "invoice"],
  SHIPPED: ["packing-slip", "invoice", "close"],
  DELIVERED: ["invoice", "close"],
  INVOICED: ["close"],
};

export default function SalesOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    picking: 0,
    shipped: 0,
    revenue: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: "20",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/sales-orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSalesOrders(data.salesOrders || []);
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
      const all: SalesOrder[] = data.salesOrders || [];
      setStats({
        total: data.pagination?.total || 0,
        pending: all.filter((o) => o.status === "PENDING_APPROVAL").length,
        picking: all.filter((o) =>
          ["PICKING", "PACKING", "RELEASED"].includes(o.status),
        ).length,
        shipped: all.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.status))
          .length,
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

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === salesOrders.length
        ? new Set()
        : new Set(salesOrders.map((o) => o.id)),
    );

  // ── Single order actions ──────────────────────────────────────────────────
  const doAction = async (
    orderId: string,
    action: string,
    options: Record<string, any> = {},
  ) => {
    setActionLoading(`${orderId}-${action}`);
    try {
      if (action === "packing-slip") {
        window.open(`/api/sales-orders/${orderId}/packing-slip`, "_blank");
        return;
      }
      const endpoints: Record<string, string> = {
        release: `/api/sales-orders/${orderId}/release`,
        invoice: `/api/sales-orders/${orderId}/generate-invoice`,
        close: `/api/sales-orders/${orderId}/close`,
      };
      const res = await fetch(endpoints[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast({
        title: "Success",
        description: data.message || `${action} completed.`,
      });
      fetchOrders();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const doBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    setActionLoading(`bulk-${action}`);
    try {
      const res = await fetch("/api/sales-orders/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, orderIds: Array.from(selected) }),
      });
      const data = await res.json();
      const { succeeded, failed } = data.summary;
      toast({
        title: `Bulk ${action}`,
        description: `${succeeded} succeeded, ${failed} failed.`,
        variant: failed > 0 ? "destructive" : "default",
      });
      setSelected(new Set());
      fetchOrders();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage orders from approval to close
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/billing/invoices">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Invoices
              </Button>
            </Link>
            <Link href="/dashboard/sales-orders/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Total Orders",
              value: stats.total,
              icon: <ShoppingCart className="h-4 w-4 text-blue-500" />,
              color: "text-blue-600",
            },
            {
              label: "Pending Approval",
              value: stats.pending,
              icon: <Clock className="h-4 w-4 text-amber-500" />,
              color: "text-amber-600",
            },
            {
              label: "In Fulfillment",
              value: stats.picking,
              icon: <Package className="h-4 w-4 text-purple-500" />,
              color: "text-purple-600",
            },
            {
              label: "Shipped",
              value: stats.shipped,
              icon: <Truck className="h-4 w-4 text-green-500" />,
              color: "text-green-600",
            },
            {
              label: "Revenue (Page)",
              value: formatCurrency(stats.revenue),
              icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
              color: "text-emerald-600",
            },
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

        {/* Filters + bulk toolbar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
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
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchOrders}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk action bar — shown when rows are selected */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-md px-3 py-2 text-sm">
                  <span className="font-medium">{selected.size} selected</span>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doBulkAction("approve")}
                      disabled={!!actionLoading}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doBulkAction("release")}
                      disabled={!!actionLoading}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Release
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doBulkAction("generate-invoice")}
                      disabled={!!actionLoading}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Invoice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => doBulkAction("close")}
                      disabled={!!actionLoading}
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => doBulkAction("cancel")}
                      disabled={!!actionLoading}
                    >
                      <XCircle className="h-3 w-3 mr-1 text-destructive" />
                      Cancel
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setSelected(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : salesOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
                <p>No sales orders found</p>
                <Link href="/dashboard/sales-orders/new">
                  <Button variant="link" className="mt-1">
                    Create your first order
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          selected.size === salesOrders.length &&
                          salesOrders.length > 0
                        }
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Required By</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesOrders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] || {
                      label: order.status,
                      variant: "outline" as const,
                      icon: null,
                    };
                    const actions = ORDER_ACTIONS[order.status] || [];
                    return (
                      <TableRow
                        key={order.id}
                        className={`hover:bg-muted/50 ${selected.has(order.id) ? "bg-muted/30" : ""}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(order.id)}
                            onCheckedChange={() => toggleSelect(order.id)}
                            aria-label={`Select ${order.soNumber}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {order.soNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.customer?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.customer?.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={cfg.variant}
                            className={`flex items-center gap-1 w-fit text-xs ${cfg.color ?? ""}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {order.invoiceNumber ?? "—"}
                        </TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.requestedDate
                            ? formatDate(order.requestedDate)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.total || 0, order.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading?.startsWith(order.id)}
                              >
                                Actions <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/sales-orders/${order.id}`,
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {actions.includes("release") && (
                                <DropdownMenuItem
                                  onClick={() => doAction(order.id, "release")}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Release to Warehouse
                                </DropdownMenuItem>
                              )}
                              {actions.includes("invoice") && (
                                <DropdownMenuItem
                                  onClick={() => doAction(order.id, "invoice")}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Invoice
                                </DropdownMenuItem>
                              )}
                              {actions.includes("packing-slip") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    doAction(order.id, "packing-slip")
                                  }
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Packing Slip
                                </DropdownMenuItem>
                              )}
                              {actions.includes("close") && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => doAction(order.id, "close")}
                                    className="text-muted-foreground"
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Close Order
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  Showing page {pagination.page} of {pagination.pages} (
                  {pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: p.page - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: p.page + 1 }))
                    }
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
