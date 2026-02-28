"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe2,
  ShoppingCart,
  ClipboardList,
  BoxSelect,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Building2,
  Smartphone,
  Store,
  Package,
  TrendingUp,
  Zap,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface FulfillmentStats {
  orders: {
    total: number;
    pendingApproval: number;
    approved: number;
    picking: number;
    packing: number;
    readyToShip: number;
    shipped: number;
    delivered: number;
  };
  pickLists: { pending: number; inProgress: number; completed: number };
  packs: { pending: number; inProgress: number; completed: number };
  shipments: { inTransit: number; delivered: number; issues: number };
}

const EMPTY_STATS: FulfillmentStats = {
  orders: {
    total: 0,
    pendingApproval: 0,
    approved: 0,
    picking: 0,
    packing: 0,
    readyToShip: 0,
    shipped: 0,
    delivered: 0,
  },
  pickLists: { pending: 0, inProgress: 0, completed: 0 },
  packs: { pending: 0, inProgress: 0, completed: 0 },
  shipments: { inTransit: 0, delivered: 0, issues: 0 },
};

interface RecentOrder {
  id: string;
  soNumber: string;
  status: string;
  customer: { name: string };
  total: number;
  currency: string;
  orderDate: string;
  requestedDate: string | null;
}

const CHANNEL_TYPES = [
  {
    name: "B2B / Wholesale",
    description: "Trade & bulk orders",
    icon: Building2,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconColor: "text-blue-500",
    badge: "Sales Orders",
    href: "/dashboard/sales-orders",
  },
  {
    name: "Direct to Consumer",
    description: "E-commerce & online orders",
    icon: Smartphone,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconColor: "text-purple-500",
    badge: "DTC Portal",
    href: "/portal/orders",
  },
  {
    name: "Ship-from-Store",
    description: "Retail location fulfillment",
    icon: Store,
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconColor: "text-amber-500",
    badge: "Warehouse routing",
    href: "/dashboard/warehouses",
  },
  {
    name: "Click & Collect",
    description: "Buy online, pickup in store",
    icon: Package,
    color: "bg-green-50 border-green-200 text-green-700",
    iconColor: "text-green-500",
    badge: "BOPIS",
    href: "/dashboard/bookings",
  },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PICKING: "Picking",
  PACKING: "Packing",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PICKING: "bg-purple-100 text-purple-700",
  PACKING: "bg-indigo-100 text-indigo-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  SHIPPED: "bg-teal-100 text-teal-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function FulfillmentHubPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FulfillmentStats>(EMPTY_STATS);
  const [urgentOrders, setUrgentOrders] = useState<RecentOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, pickListsRes, packsRes, shipmentsRes] =
        await Promise.all([
          fetch("/api/sales-orders?limit=100"),
          fetch("/api/pick-lists?limit=100"),
          fetch("/api/packs?limit=100"),
          fetch("/api/shipments?limit=100"),
        ]);

      const [ordersData, pickData, packsData, shipData] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : { salesOrders: [] },
        pickListsRes.ok ? pickListsRes.json() : [],
        packsRes.ok ? packsRes.json() : [],
        shipmentsRes.ok ? shipmentsRes.json() : [],
      ]);

      const orders: RecentOrder[] = ordersData.salesOrders || [];
      const picks = pickData.pickLists || pickData || [];
      const packs = packsData.packs || packsData || [];
      const shipments = shipData.shipments || shipData || [];

      setStats({
        orders: {
          total: ordersData.pagination?.total || orders.length,
          pendingApproval: orders.filter((o) => o.status === "PENDING_APPROVAL")
            .length,
          approved: orders.filter((o) => o.status === "APPROVED").length,
          picking: orders.filter((o) => o.status === "PICKING").length,
          packing: orders.filter((o) => o.status === "PACKING").length,
          readyToShip: orders.filter((o) => o.status === "READY_TO_SHIP")
            .length,
          shipped: orders.filter((o) => o.status === "SHIPPED").length,
          delivered: orders.filter((o) => o.status === "DELIVERED").length,
        },
        pickLists: {
          pending: picks.filter((p: any) => p.status === "PENDING").length,
          inProgress: picks.filter((p: any) => p.status === "IN_PROGRESS")
            .length,
          completed: picks.filter((p: any) => p.status === "COMPLETED").length,
        },
        packs: {
          pending: packs.filter((p: any) => p.status === "PENDING").length,
          inProgress: packs.filter((p: any) => p.status === "IN_PROGRESS")
            .length,
          completed: packs.filter((p: any) => p.status === "COMPLETED").length,
        },
        shipments: {
          inTransit: shipments.filter((s: any) =>
            ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
          ).length,
          delivered: shipments.filter((s: any) => s.status === "DELIVERED")
            .length,
          issues: shipments.filter((s: any) =>
            ["FAILED", "RETURNED"].includes(s.status),
          ).length,
        },
      });

      // Orders needing urgent attention (pending approval or past requested date)
      const now = new Date();
      const urgent = orders
        .filter((o) => {
          if (o.status === "PENDING_APPROVAL") return true;
          if (
            o.requestedDate &&
            new Date(o.requestedDate) < now &&
            !["SHIPPED", "DELIVERED", "CANCELLED"].includes(o.status)
          )
            return true;
          return false;
        })
        .slice(0, 5);

      setUrgentOrders(urgent);
      setRecentOrders(orders.slice(0, 8));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load fulfillment data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (v: number, c = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(
      v,
    );

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Fulfillment pipeline funnel stages
  const pipeline = [
    {
      label: "Pending Approval",
      value: stats.orders.pendingApproval,
      color: "bg-amber-500",
      href: "/dashboard/sales-orders?status=PENDING_APPROVAL",
    },
    {
      label: "Approved",
      value: stats.orders.approved,
      color: "bg-blue-500",
      href: "/dashboard/sales-orders?status=APPROVED",
    },
    {
      label: "Picking",
      value: stats.orders.picking + stats.pickLists.inProgress,
      color: "bg-purple-500",
      href: "/dashboard/pick-lists",
    },
    {
      label: "Packing",
      value: stats.orders.packing + stats.packs.inProgress,
      color: "bg-indigo-500",
      href: "/dashboard/packs",
    },
    {
      label: "Ready to Ship",
      value: stats.orders.readyToShip,
      color: "bg-cyan-500",
      href: "/dashboard/sales-orders?status=READY_TO_SHIP",
    },
    {
      label: "In Transit",
      value: stats.shipments.inTransit,
      color: "bg-teal-500",
      href: "/dashboard/shipments",
    },
    {
      label: "Delivered",
      value: stats.orders.delivered + stats.shipments.delivered,
      color: "bg-green-500",
      href: "/dashboard/shipments?status=DELIVERED",
    },
  ];

  const maxPipeline = Math.max(...pipeline.map((p) => p.value), 1);

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-white">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Omnichannel Fulfillment Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                Unified command center — B2B, DTC, Ship-from-Store &amp; BOPIS •
                Last updated: {formatTime(lastRefreshed)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {!loading && urgentOrders.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {urgentOrders.length} Order{urgentOrders.length > 1 ? "s" : ""}{" "}
                Need Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-2">
                {urgentOrders.map((o) => (
                  <Link key={o.id} href={`/dashboard/sales-orders/${o.id}`}>
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-white text-amber-700 hover:bg-amber-100 cursor-pointer"
                    >
                      {o.soNumber} — {o.customer?.name} (
                      {STATUS_LABEL[o.status] || o.status})
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Orders",
              value: stats.orders.total,
              icon: <ShoppingCart className="h-4 w-4 text-blue-500" />,
              color: "text-blue-600",
              href: "/dashboard/sales-orders",
            },
            {
              label: "Active Pick Lists",
              value: stats.pickLists.pending + stats.pickLists.inProgress,
              icon: <ClipboardList className="h-4 w-4 text-purple-500" />,
              color: "text-purple-600",
              href: "/dashboard/pick-lists",
            },
            {
              label: "Active Packs",
              value: stats.packs.pending + stats.packs.inProgress,
              icon: <BoxSelect className="h-4 w-4 text-indigo-500" />,
              color: "text-indigo-600",
              href: "/dashboard/packs",
            },
            {
              label: "In Transit",
              value: stats.shipments.inTransit,
              icon: <Truck className="h-4 w-4 text-teal-500" />,
              color: "text-teal-600",
              href: "/dashboard/shipments",
            },
            {
              label: "Shipment Issues",
              value: stats.shipments.issues,
              icon: <AlertCircle className="h-4 w-4 text-red-500" />,
              color:
                stats.shipments.issues > 0
                  ? "text-red-600"
                  : "text-muted-foreground",
              href: "/dashboard/shipments?status=FAILED",
            },
          ].map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    {s.icon}
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                    {loading ? "—" : s.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Fulfillment Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fulfillment Pipeline
            </CardTitle>
            <CardDescription>
              Orders flowing through each stage right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="space-y-3">
                {pipeline.map((stage) => (
                  <Link key={stage.label} href={stage.href}>
                    <div className="flex items-center gap-3 group cursor-pointer py-1">
                      <div className="w-36 text-sm text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                        {stage.label}
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className={`${stage.color} h-6 rounded-full flex items-center px-2 transition-all`}
                          style={{
                            width:
                              stage.value === 0
                                ? "4px"
                                : `${Math.max((stage.value / maxPipeline) * 100, 4)}%`,
                          }}
                        />
                      </div>
                      <div className="w-10 text-right font-semibold text-sm">
                        {stage.value}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Grid + Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Channel Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                Active Channels
              </CardTitle>
              <CardDescription>
                All fulfillment channels running through this WMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CHANNEL_TYPES.map((ch) => {
                const Icon = ch.icon;
                return (
                  <Link key={ch.name} href={ch.href}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg border ${ch.color} hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <Icon className={`h-5 w-5 ${ch.iconColor} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{ch.name}</p>
                        <p className="text-xs opacity-70">{ch.description}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-current shrink-0"
                      >
                        {ch.badge}
                      </Badge>
                      <ArrowRight className="h-4 w-4 opacity-50 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    label: "New Sales Order",
                    href: "/dashboard/sales-orders/new",
                    icon: <ShoppingCart className="h-4 w-4" />,
                    variant: "default" as const,
                  },
                  {
                    label: "View Pending Approvals",
                    href: "/dashboard/sales-orders",
                    icon: <Clock className="h-4 w-4" />,
                    variant: "outline" as const,
                  },
                  {
                    label: "Active Pick Lists",
                    href: "/dashboard/pick-lists",
                    icon: <ClipboardList className="h-4 w-4" />,
                    variant: "outline" as const,
                  },
                  {
                    label: "Shipment Tracking",
                    href: "/dashboard/shipments",
                    icon: <Truck className="h-4 w-4" />,
                    variant: "outline" as const,
                  },
                ].map((a) => (
                  <Link key={a.label} href={a.href}>
                    <Button
                      variant={a.variant}
                      className="w-full justify-start gap-2"
                    >
                      {a.icon}
                      {a.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Stage breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Stage Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    {
                      label: "Pending Approval",
                      value: stats.orders.pendingApproval,
                      color: "text-amber-600",
                    },
                    {
                      label: "Approved",
                      value: stats.orders.approved,
                      color: "text-blue-600",
                    },
                    {
                      label: "Picking",
                      value: stats.orders.picking,
                      color: "text-purple-600",
                    },
                    {
                      label: "Packing",
                      value: stats.orders.packing,
                      color: "text-indigo-600",
                    },
                    {
                      label: "Ready to Ship",
                      value: stats.orders.readyToShip,
                      color: "text-cyan-600",
                    },
                    {
                      label: "Shipped",
                      value: stats.orders.shipped,
                      color: "text-teal-600",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between py-1 border-b last:border-0"
                    >
                      <span className="text-muted-foreground text-xs">
                        {s.label}
                      </span>
                      <span className={`font-semibold ${s.color}`}>
                        {loading ? "—" : s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest across all channels</CardDescription>
            </div>
            <Link href="/dashboard/sales-orders">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShoppingCart className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-sm">No orders yet</p>
                <Link href="/dashboard/sales-orders/new">
                  <Button variant="link" size="sm">
                    Create your first order
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/sales-orders/${order.id}`}
                  >
                    <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-medium">
                          {order.soNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {formatCurrency(order.total || 0, order.currency)}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || "bg-muted text-muted-foreground"}`}
                        >
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  );
}
