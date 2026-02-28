"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  ClipboardList,
  Search,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  priority: string;
  totalAmount: number;
  currency: string;
  expectedDate: string | null;
  createdAt: string;
  supplier: { name: string; code: string };
  items: Array<{ id: string }>;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ACKNOWLEDGED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  PARTIALLY_RECEIVED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CLOSED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (pageNum = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/purchase-orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const list: PurchaseOrder[] = data.purchaseOrders || data.data || [];
      setOrders(list);
      if (data.pagination) setPagination(data.pagination);
      else if (data.total !== undefined) {
        setPagination({
          total: data.total,
          page: pageNum,
          limit: 20,
          totalPages: Math.ceil(data.total / 20),
        });
      }
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [search, statusFilter]);

  const statuses = [
    "DRAFT",
    "PENDING",
    "SENT",
    "ACKNOWLEDGED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
    "CLOSED",
  ];

  const stats = {
    pending: orders.filter((o) =>
      ["PENDING", "SENT", "ACKNOWLEDGED"].includes(o.status),
    ).length,
    inTransit: orders.filter((o) => o.status === "PARTIALLY_RECEIVED").length,
    received: orders.filter((o) => o.status === "RECEIVED").length,
    total: pagination.total,
  };

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage supplier procurement and inbound goods.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(1, true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/purchase-orders/new")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> New PO
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total POs",
              value: pagination.total,
              icon: ClipboardList,
              color: "text-blue-600",
            },
            {
              label: "Awaiting Delivery",
              value: stats.pending,
              icon: Clock,
              color: "text-yellow-600",
            },
            {
              label: "Partially Received",
              value: stats.inTransit,
              icon: Truck,
              color: "text-orange-600",
            },
            {
              label: "Fully Received",
              value: stats.received,
              icon: CheckCircle,
              color: "text-green-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "—" : s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO number or supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>{pagination.total} total</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No purchase orders found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/dashboard/purchase-orders/new")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Create First PO
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/purchase-orders/${order.id}`)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {order.poNumber}
                        </p>
                        <Badge
                          className={
                            STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
                          }
                          variant="secondary"
                        >
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          className={
                            PRIORITY_COLORS[order.priority] ||
                            PRIORITY_COLORS.MEDIUM
                          }
                          variant="secondary"
                        >
                          {order.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>
                          {order.supplier?.name || "Unknown Supplier"}
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 0} line items</span>
                        {order.expectedDate && (
                          <>
                            <span>•</span>
                            <span>
                              Expected:{" "}
                              {new Date(
                                order.expectedDate,
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {order.currency || "USD"}{" "}
                          {Number(order.totalAmount || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchOrders(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchOrders(pagination.page + 1)}
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
