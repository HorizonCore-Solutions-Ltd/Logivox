"use client";

import * as React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ShoppingCart,
  Truck,
  ClipboardList,
  RefreshCw,
  PlusCircle,
  BarChart3,
  ShieldAlert,
  FileWarning,
  Map,
} from "lucide-react";

interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  openSalesOrders: number;
  pendingPurchaseOrders: number;
  shipmentsInTransit: number;
  openNcrs: number;
  overdueCAPAs: number;
  activeDuties: number;
  slaBreachedDuties: number;
}

interface RecentOrder {
  id: string;
  soNumber: string;
  status: string;
  total: number;
  currency: string;
  customer: { name: string };
  orderDate: string;
}

interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  availableQty: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    openSalesOrders: 0,
    pendingPurchaseOrders: 0,
    shipmentsInTransit: 0,
    openNcrs: 0,
    overdueCAPAs: 0,
    activeDuties: 0,
    slaBreachedDuties: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [invRes, soRes, poRes, shipRes, ncrRes, capaRes, dutyKpisRes] =
        await Promise.all([
          fetch("/api/inventory?limit=500"),
          fetch("/api/sales-orders?limit=10&page=1"),
          fetch("/api/purchase-orders?status=PENDING,SENT&limit=1"),
          fetch("/api/shipments?status=SHIPPED&limit=1"),
          fetch("/api/qc/ncr?status=OPEN&limit=1"),
          fetch("/api/qc/capa/overdue"),
          fetch("/api/duties/kpis?days=1"),
        ]);

      const [invData, soData, poData, shipData, ncrData, capaData, dutyKpis] =
        await Promise.all([
          invRes.ok ? invRes.json() : { items: [], pagination: { total: 0 } },
          soRes.ok ? soRes.json() : { salesOrders: [], total: 0 },
          poRes.ok
            ? poRes.json()
            : { purchaseOrders: [], total: 0, pagination: { total: 0 } },
          shipRes.ok
            ? shipRes.json()
            : { shipments: [], total: 0, pagination: { total: 0 } },
          ncrRes.ok ? ncrRes.json() : { total: 0, data: [] },
          capaRes.ok ? capaRes.json() : [],
          dutyKpisRes?.ok
            ? dutyKpisRes.json()
            : { byStatus: {}, slaBreached: 0 },
        ]);

      const items: any[] = invData.items || [];
      const totalValue = items.reduce((sum: number, item: any) => {
        const val = parseFloat(item.costPrice || "0") * (item.quantity || 0);
        return sum + val;
      }, 0);
      const lowStock = items.filter(
        (i: any) => i.reorderPoint && i.quantity <= i.reorderPoint,
      );

      const salesOrders: RecentOrder[] =
        soData.salesOrders || soData.data || [];
      const openStatuses = [
        "PENDING_APPROVAL",
        "APPROVED",
        "PICKING",
        "PICKED",
        "PACKING",
        "PACKED",
        "SHIPPING",
      ];
      const openCount = soData.total || salesOrders.length;

      const activeDuties: number = dutyKpis?.byStatus?.ACTIVE ?? 0;
      const slaBreachedDuties: number = dutyKpis?.slaBreached ?? 0;

      const openNcrs =
        ncrData.total ??
        (Array.isArray(ncrData) ? ncrData.length : (ncrData.data?.length ?? 0));
      const overdueCAPAs = Array.isArray(capaData)
        ? capaData.length
        : (capaData.total ?? 0);

      setStats({
        totalItems: invData.pagination?.total || items.length,
        totalValue,
        lowStockCount: lowStock.length,
        openSalesOrders: openCount,
        pendingPurchaseOrders:
          poData.pagination?.total ||
          poData.total ||
          (poData.purchaseOrders || []).length,
        shipmentsInTransit:
          shipData.pagination?.total ||
          shipData.total ||
          (shipData.shipments || []).length,
        openNcrs,
        overdueCAPAs,
        activeDuties,
        slaBreachedDuties,
      });

      setRecentOrders(salesOrders.slice(0, 5));
      setLowStockItems(
        lowStock.slice(0, 5).map((i: any) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          reorderPoint: i.reorderPoint,
          availableQty: i.availableQty,
        })),
      );
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SHIPPED":
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "APPROVED":
      case "PICKED":
      case "PACKED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PENDING_APPROVAL":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "PICKING":
      case "PACKING":
      case "SHIPPING":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statCards = [
    {
      title: "Total Inventory Value",
      value: loading ? "—" : formatCurrency(stats.totalValue),
      icon: DollarSign,
      description: "across all warehouses",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Active Stock Items",
      value: loading ? "—" : stats.totalItems.toLocaleString(),
      icon: Package,
      description: "SKUs on hand",
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      title: "Low Stock Alerts",
      value: loading ? "—" : stats.lowStockCount.toString(),
      icon: AlertTriangle,
      description: "items at or below reorder point",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
      href: "/dashboard/inventory",
    },
    {
      title: "Open Sales Orders",
      value: loading ? "—" : stats.openSalesOrders.toString(),
      icon: ShoppingCart,
      description: "pending fulfillment",
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950",
      href: "/dashboard/sales-orders",
    },
    {
      title: "Pending Purchase Orders",
      value: loading ? "—" : stats.pendingPurchaseOrders.toString(),
      icon: ClipboardList,
      description: "awaiting delivery",
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950",
      href: "/dashboard/purchase-orders",
    },
    {
      title: "Shipments In Transit",
      value: loading ? "—" : stats.shipmentsInTransit.toString(),
      icon: Truck,
      description: "en route to customers",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      href: "/dashboard/shipments",
    },
    {
      title: "Open NCRs",
      value: loading ? "—" : stats.openNcrs.toString(),
      icon: FileWarning,
      description: "non-conformance reports open",
      color: stats.openNcrs > 0 ? "text-red-600" : "text-gray-400",
      bg:
        stats.openNcrs > 0
          ? "bg-red-50 dark:bg-red-950"
          : "bg-gray-50 dark:bg-gray-900",
      href: "/capa/hub",
    },
    {
      title: "Overdue CAPAs",
      value: loading ? "—" : stats.overdueCAPAs.toString(),
      icon: ShieldAlert,
      description: "corrective actions past due",
      color: stats.overdueCAPAs > 0 ? "text-orange-600" : "text-gray-400",
      bg:
        stats.overdueCAPAs > 0
          ? "bg-orange-50 dark:bg-orange-950"
          : "bg-gray-50 dark:bg-gray-900",
      href: "/capa/hub",
    },
    {
      title: "Active Duties",
      value: loading ? "—" : stats.activeDuties.toString(),
      icon: ClipboardList,
      description: "duties in progress now",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/dashboard/duties",
    },
    {
      title: "SLA Breached",
      value: loading ? "—" : stats.slaBreachedDuties.toString(),
      icon: AlertTriangle,
      description: "duties past SLA window",
      color: stats.slaBreachedDuties > 0 ? "text-red-600" : "text-gray-400",
      bg:
        stats.slaBreachedDuties > 0
          ? "bg-red-50 dark:bg-red-950"
          : "bg-gray-50 dark:bg-gray-900",
      href: "/dashboard/duties?slaBreached=true",
    },
  ];

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Live operations overview &mdash; real-time data across all
              modules.
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push("/dock/load-planning")}
            >
              <Truck className="h-4 w-4 mr-2" />
              Load Planning
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push("/dock/bay-doors")}
            >
              <Map className="h-4 w-4 mr-2" />
              Bay Doors
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/sales-orders/new")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Sales Order
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`transition-shadow hover:shadow-md ${stat.href ? "cursor-pointer" : ""}`}
                onClick={stat.href ? () => router.push(stat.href!) : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`h-8 w-8 rounded-full ${stat.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? (
                    <Skeleton className="h-7 w-20 mb-1" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Sales Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Sales Orders</CardTitle>
                  <CardDescription>
                    Latest orders in the fulfillment pipeline
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/sales-orders")}
                >
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No sales orders yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push("/dashboard/sales-orders/new")}
                  >
                    Create First Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/sales-orders/${order.id}`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {order.customer?.name || "Unknown"}
                          </p>
                          <Badge
                            className={getStatusColor(order.status)}
                            variant="secondary"
                          >
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{order.soNumber}</span>
                          <span>•</span>
                          <span>
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-sm">
                          {order.currency || "USD"}{" "}
                          {Number(order.total || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>
                    Items at or below reorder point
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/inventory")}
                >
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40 text-green-500" />
                  <p className="text-sm font-medium text-green-600">
                    All stock levels healthy!
                  </p>
                  <p className="text-xs mt-1">No items below reorder point.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item) => {
                    const pct =
                      item.reorderPoint > 0
                        ? Math.round((item.quantity / item.reorderPoint) * 100)
                        : 100;
                    const isCritical = pct < 50;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            <Badge
                              className={
                                isCritical
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              }
                              variant="secondary"
                            >
                              {isCritical ? "Critical" : "Low"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.sku} &bull; Reorder at {item.reorderPoint}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p
                            className={`font-bold text-sm ${isCritical ? "text-red-600" : "text-orange-600"}`}
                          >
                            {item.quantity} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pct}% of threshold
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                {
                  label: "New Sales Order",
                  icon: ShoppingCart,
                  href: "/dashboard/sales-orders/new",
                  color: "text-violet-600",
                },
                {
                  label: "Receive Goods (GRN)",
                  icon: Package,
                  href: "/dashboard/receiving",
                  color: "text-teal-600",
                },
                {
                  label: "Fulfillment Hub",
                  icon: Truck,
                  href: "/dashboard/fulfillment",
                  color: "text-green-600",
                },
                {
                  label: "Cycle Count",
                  icon: ClipboardList,
                  href: "/dashboard/inventory",
                  color: "text-blue-600",
                },
                {
                  label: "New Purchase Order",
                  icon: Activity,
                  href: "/dashboard/purchase-orders/new",
                  color: "text-indigo-600",
                },
                {
                  label: "CAPA Hub",
                  icon: ShieldAlert,
                  href: "/capa/hub",
                  color: "text-red-600",
                },
                {
                  label: "View Reports",
                  icon: BarChart3,
                  href: "/dashboard/reports",
                  color: "text-orange-600",
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-muted/60 hover:border-primary/40 transition-all text-center group"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  );
}
