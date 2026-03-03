"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Package,
  Printer,
  Send,
  Truck,
  User,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SalesOrder {
  id: string;
  soNumber: string;
  status: string;
  orderDate: string;
  total: number;
  currency: string;
  warehouse: { name: string } | null;
  customer: { name: string; email: string; code: string };
  shippingAddress: string;
  shippingMethod: string;
  trackingNumber: string | null;
  carrierName: string | null;
  items: Array<{
    id: string;
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    inventoryItem: { name: string; sku: string };
  }>;
}

export default function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/sales-orders/${params.id}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      setOrder(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load order details.", variant: "destructive" });
      router.push("/dashboard/sales-orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      // If releasing, use the specific endpoint
      if (newStatus === "RELEASED") {
         const res = await fetch(`/api/sales-orders/${params.id}/release`, {
             method: "POST",
             body: JSON.stringify({ addToWave: false }) // Default behavior
         });
         if (!res.ok) throw new Error("Failed to release order");
      } else {
         // Standard status update
         const res = await fetch(`/api/sales-orders/${params.id}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ status: newStatus })
         });
         if (!res.ok) throw new Error("Failed to update status");
      }

      toast({ title: "Success", description: `Order status updated to ${newStatus}` });
      fetchOrder();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-800";
      case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-800";
      case "APPROVED": return "bg-blue-100 text-blue-800";
      case "RELEASED": return "bg-indigo-100 text-indigo-800";
      case "PICKING": return "bg-orange-100 text-orange-800";
      case "SHIPPED": return "bg-purple-100 text-purple-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{order.soNumber}</h1>
              <Badge className={getStatusColor(order.status)} variant="outline">
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(order.orderDate).toLocaleDateString()}</span>
              {order.warehouse && (
                <>
                  <span className="text-gray-300">|</span>
                  <MapPin className="h-3 w-3" />
                  <span>{order.warehouse.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          
          {order.status === "DRAFT" && (
             <Button onClick={() => handleStatusChange("PENDING_APPROVAL")} disabled={actionLoading}>
                Request Approval
             </Button>
          )}

           {order.status === "PENDING_APPROVAL" && (
             <Button onClick={() => handleStatusChange("APPROVED")} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
             </Button>
          )}

           {order.status === "APPROVED" && (
             <Button onClick={() => handleStatusChange("RELEASED")} disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700">
                <Send className="mr-2 h-4 w-4" /> Release to Warehouse
             </Button>
          )}

           {["RELEASED", "PICKING", "PACKING"].includes(order.status) && (
              <Button disabled variant="secondary">
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
              </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Code: {order.customer.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Truck className="mt-1 h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold">{order.shippingMethod || "Standard Delivery"}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{order.shippingAddress || "No address provided"}</p>
                {order.trackingNumber && (
                    <div className="mt-2 text-sm">
                        <span className="font-medium">Tracking: </span>
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{order.trackingNumber}</span>
                        {order.carrierName && <span className="text-muted-foreground ml-1">({order.carrierName})</span>}
                    </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || "USD" }).format(order.total)}
                </p>
                <p className="text-xs text-muted-foreground">{order.items.length} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.inventoryItem?.name || "Unknown Item"}</TableCell>
                  <TableCell className="font-mono text-sm">{item.inventoryItem?.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                     {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || "USD" }).format(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                     {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || "USD" }).format(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
