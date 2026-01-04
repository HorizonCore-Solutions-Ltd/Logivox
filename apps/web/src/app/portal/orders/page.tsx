"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  TruckIcon,
  Search,
  Plus,
} from "lucide-react";

interface Order {
  id: string;
  soNumber: string;
  orderDate: string;
  status: string;
  requestedDate: string | null;
  total: number;
  itemCount: number;
  trackingNumber: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const response = await fetch(`/api/portal/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", icon: Clock },
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      PENDING_APPROVAL: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">View and manage your order history</p>
        </div>
        <Link href="/portal/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number or tracking..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PICKED">Picked</SelectItem>
                <SelectItem value="PACKED">Packed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No orders found</p>
              <Link href="/portal/orders/new">
                <Button>Place Your First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/portal/orders/${order.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-semibold text-gray-900 text-lg">
                          {order.soNumber}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Order Date:</span>
                          <p className="font-medium">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <p className="font-medium">{order.itemCount}</p>
                        </div>
                        {order.trackingNumber && (
                          <div>
                            <span className="text-gray-500">Tracking:</span>
                            <p className="font-medium font-mono text-xs">
                              {order.trackingNumber}
                            </p>
                          </div>
                        )}
                        {order.requestedDate && (
                          <div>
                            <span className="text-gray-500">Requested:</span>
                            <p className="font-medium">
                              {new Date(order.requestedDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
