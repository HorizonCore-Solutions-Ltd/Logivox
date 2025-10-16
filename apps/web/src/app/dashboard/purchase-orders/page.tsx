"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign,
  Package,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  priority: string;
  orderDate: string;
  expectedDate: string | null;
  totalAmount: number;
  currency: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  items: any[];
  createdBy: {
    name: string;
  };
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/purchase-orders?${params.toString()}`);
      const data = await response.json();
      
      setPurchaseOrders(data.purchaseOrders || []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500",
      PENDING: "bg-yellow-500",
      APPROVED: "bg-blue-500",
      SENT: "bg-purple-500",
      CONFIRMED: "bg-indigo-500",
      PARTIALLY_RECEIVED: "bg-orange-500",
      RECEIVED: "bg-green-500",
      CANCELLED: "bg-red-500",
      CLOSED: "bg-gray-700",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const filteredOrders = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(po => po.status === 'DRAFT').length,
    pending: purchaseOrders.filter(po => po.status === 'PENDING' || po.status === 'APPROVED').length,
    sent: purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'CONFIRMED').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage your supplier purchase orders and inbound operations
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/purchase-orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft/Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft + stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.draft} draft, {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PO number or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} purchase order{filteredOrders.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/purchase-orders/${po.id}`)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{po.poNumber}</span>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(po.priority)}>
                        {po.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Supplier: {po.supplier.name} ({po.supplier.code})
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(po.orderDate).toLocaleDateString()}</span>
                      {po.expectedDate && (
                        <span>Expected: {new Date(po.expectedDate).toLocaleDateString()}</span>
                      )}
                      <span>{po.items.length} item{po.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {po.currency} {Number(po.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {po.createdBy.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
