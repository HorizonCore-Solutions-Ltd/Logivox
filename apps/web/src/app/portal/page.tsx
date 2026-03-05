"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  TruckIcon,
  History,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar
} from "lucide-react";

interface DashboardData {
  role: string;
  totalOrders?: number;
  pendingOrders?: number;
  shippedOrders?: number;
  completedOrders?: number;
  recentOrders?: Array<{
    id: string;
    soNumber: string;
    orderDate: string;
    status: string;
    total: number;
    itemCount: number;
  }>;
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/portal/dashboard");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-600">Failed to load portal data.</div>;

  // SUPPLIER VIEW
  if (data.role === "SUPPLIER") {
      return (
          <div className="space-y-8">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
                      <p className="mt-2 text-gray-600">Welcome back. Manage your shipments and ASNs.</p>
                  </div>
                  <Link href="/portal/supplier">
                      <Button size="lg" className="shadow-lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Create ASN
                      </Button>
                  </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <Link href="/portal/supplier">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium text-gray-600">Active Shipments</CardTitle>
                              <TruckIcon className="h-4 w-4 text-blue-500" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">Process ASN</div>
                              <p className="text-xs text-gray-500 mt-1">Submit shipping notices</p>
                          </CardContent>
                      </Link>
                  </Card>
                   <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Purchase Orders</CardTitle>
                          <FileText className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">View POs</div>
                          <p className="text-xs text-gray-500 mt-1">Check open orders</p>
                      </CardContent>
                  </Card>
              </div>
          </div>
      );
  }

  // CARRIER VIEW
  if (data.role === "CARRIER") {
      return (
          <div className="space-y-8">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-3xl font-bold text-gray-900">Carrier Dashboard</h1>
                      <p className="mt-2 text-gray-600">Manage dock appointments and deliveries.</p>
                  </div>
                  <Link href="/portal/carrier">
                      <Button size="lg" className="shadow-lg">
                          <Calendar className="h-5 w-5 mr-2" />
                          Book Appointment
                      </Button>
                  </Link>
              </div>

               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <Link href="/portal/carrier">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium text-gray-600">Schedule</CardTitle>
                              <Clock className="h-4 w-4 text-blue-500" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">Book Slot</div>
                              <p className="text-xs text-gray-500 mt-1">Reserve dock time</p>
                          </CardContent>
                      </Link>
                  </Card>
              </div>
          </div>
      );
  }

  // CUSTOMER VIEW (Existing Logic)
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      APPROVED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
      PICKED: { color: "bg-purple-100 text-purple-800", icon: Package },
      PACKED: { color: "bg-indigo-100 text-indigo-800", icon: Package },
      SHIPPED: { color: "bg-green-100 text-green-800", icon: TruckIcon },
      DELIVERED: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
      CANCELLED: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Your Portal
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your orders, track shipments, and view your account details.
          </p>
        </div>
        <Link href="/portal/orders/new">
          <Button size="lg" className="shadow-lg">
            <Plus className="h-5 w-5 mr-2" />
            Place New Order
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.totalOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {data.pendingOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Shipped Orders
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data.shippedOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">In transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Orders
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.completedOrders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/portal/orders/new">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-semibold">Place Order</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Create a new order
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/portal/orders">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <History className="h-5 w-5 mr-2 text-purple-600" />
                    <span className="font-semibold">Order History</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    View past orders
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/portal/tracking">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <Package className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-semibold">Track Shipments</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Track your packages
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/portal/account">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center mb-1">
                    <Package className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="font-semibold">My Account</span>
                  </div>
                  <span className="text-xs text-gray-500">Manage settings</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest order activity</CardDescription>
          </div>
          <Link href="/portal/orders">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentOrders && data.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/portal/orders/${order.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-gray-900">
                          {order.soNumber}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.orderDate).toLocaleDateString()} •{" "}
                        {order.itemCount} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No orders yet</p>
              <Link href="/portal/orders/new">
                <Button>Place Your First Order</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
