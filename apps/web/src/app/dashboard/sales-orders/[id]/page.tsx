"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  User,
  Calendar,
  FileText,
  MapPin,
  CreditCard,
  Truck,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface SalesOrder {
  id: string;
  soNumber: string;
  status: string;
  orderDate: string;
  requestedDate: string | null;
  promisedDate: string | null;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAmount: number;
  priority: number;
  notes: string | null;
  internalNotes: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  customer: {
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdBy: {
    name: string;
    email: string;
  };
  approvedBy: {
    name: string;
    email: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    quantityPicked: number;
    quantityPacked: number;
    quantityShipped: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    lineTotal: number;
    binLocation: string | null;
    batchNumber: string | null;
    inventoryItem: {
      name: string;
      sku: string;
    };
  }>;
}

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pickListDialogOpen, setPickListDialogOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSalesOrder();
    }
  }, [params.id]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales-orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSalesOrder(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load sales order",
          variant: "destructive",
        });
        router.push("/dashboard/sales-orders");
      }
    } catch (error) {
      console.error("Error fetching sales order:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading the sales order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!salesOrder) return;

    try {
      const response = await fetch(
        `/api/sales-orders/${salesOrder.id}/approve`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sales order approved successfully",
        });
        setApproveDialogOpen(false);
        fetchSalesOrder();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to approve sales order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving sales order:", error);
      toast({
        title: "Error",
        description: "An error occurred while approving",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!salesOrder) return;

    try {
      const response = await fetch(
        `/api/sales-orders/${salesOrder.id}/cancel`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sales order cancelled successfully",
        });
        setCancelDialogOpen(false);
        fetchSalesOrder();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to cancel sales order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling sales order:", error);
      toast({
        title: "Error",
        description: "An error occurred while cancelling",
        variant: "destructive",
      });
    }
  };

  const handleCreatePickList = async () => {
    if (!salesOrder || !salesOrder.warehouse) return;

    try {
      const response = await fetch(
        `/api/sales-orders/${salesOrder.id}/create-pick-list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            warehouseId: salesOrder.warehouse.id,
            priority: salesOrder.priority,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pick list created successfully",
        });
        setPickListDialogOpen(false);
        fetchSalesOrder();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create pick list",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating pick list:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating pick list",
        variant: "destructive",
      });
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardSidebar>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </DashboardSidebar>
    );
  }

  if (!salesOrder) {
    return <div className="text-center py-8">Sales order not found</div>;
  }

  return (
    <DashboardSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {salesOrder.soNumber}
              </h1>
              <p className="text-muted-foreground">Sales Order Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            {salesOrder.status === "DRAFT" ||
            salesOrder.status === "PENDING_APPROVAL" ? (
              <Button onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            ) : null}
            {salesOrder.status === "APPROVED" && salesOrder.warehouse && (
              <Button onClick={() => setPickListDialogOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Create Pick List
              </Button>
            )}
            {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(
              salesOrder.status,
            ) && (
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(salesOrder.status)}>
                {salesOrder.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesOrder.currency} {salesOrder.total.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesOrder.items.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={
                  salesOrder.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {salesOrder.paymentStatus}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                Paid: {salesOrder.currency} {salesOrder.paidAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <div className="font-medium">{salesOrder.customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {salesOrder.customer.code}
                </div>
              </div>
              {salesOrder.customer.email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="font-medium">{salesOrder.customer.email}</div>
                </div>
              )}
              {salesOrder.customer.phone && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <div className="font-medium">{salesOrder.customer.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesOrder.shippingAddress && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <div className="font-medium">
                    {salesOrder.shippingAddress}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {salesOrder.shippingCity}, {salesOrder.shippingState}{" "}
                    {salesOrder.shippingZip}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {salesOrder.shippingCountry}
                  </div>
                </div>
              )}
              {salesOrder.shippingMethod && (
                <div>
                  <Label className="text-muted-foreground">
                    Shipping Method
                  </Label>
                  <div className="font-medium">{salesOrder.shippingMethod}</div>
                </div>
              )}
              {salesOrder.trackingNumber && (
                <div>
                  <Label className="text-muted-foreground">Tracking</Label>
                  <div className="font-medium">{salesOrder.trackingNumber}</div>
                  {salesOrder.carrierName && (
                    <div className="text-sm text-muted-foreground">
                      {salesOrder.carrierName}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Order Date</Label>
                <div className="font-medium">
                  {new Date(salesOrder.orderDate).toLocaleDateString()}
                </div>
              </div>
              {salesOrder.requestedDate && (
                <div>
                  <Label className="text-muted-foreground">
                    Requested Delivery
                  </Label>
                  <div className="font-medium">
                    {new Date(salesOrder.requestedDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {salesOrder.promisedDate && (
                <div>
                  <Label className="text-muted-foreground">
                    Promised Delivery
                  </Label>
                  <div className="font-medium">
                    {new Date(salesOrder.promisedDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warehouse & Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Warehouse</Label>
                <div className="font-medium">
                  {salesOrder.warehouse
                    ? salesOrder.warehouse.name
                    : "Not assigned"}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <div className="font-medium">{salesOrder.createdBy.name}</div>
              </div>
              {salesOrder.approvedBy && (
                <div>
                  <Label className="text-muted-foreground">Approved By</Label>
                  <div className="font-medium">
                    {salesOrder.approvedBy.name}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Detailed breakdown of all items in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Picked</TableHead>
                  <TableHead>Packed</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.inventoryItem.sku}
                    </TableCell>
                    <TableCell>{item.inventoryItem.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.quantityPicked}</TableCell>
                    <TableCell>{item.quantityPacked}</TableCell>
                    <TableCell>{item.quantityShipped}</TableCell>
                    <TableCell>
                      {salesOrder.currency} {item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {salesOrder.currency} {item.discount.toFixed(2)}
                    </TableCell>
                    <TableCell>{item.taxRate}%</TableCell>
                    <TableCell>
                      {salesOrder.currency} {item.lineTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Financial Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {salesOrder.currency} {salesOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">
                    {salesOrder.currency} {salesOrder.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span className="font-medium">
                    {salesOrder.currency} {salesOrder.shippingCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">
                    -{salesOrder.currency} {salesOrder.discount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {salesOrder.currency} {salesOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {(salesOrder.notes || salesOrder.internalNotes) && (
          <div className="grid gap-6 md:grid-cols-2">
            {salesOrder.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{salesOrder.notes}</p>
                </CardContent>
              </Card>
            )}
            {salesOrder.internalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{salesOrder.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Approve Dialog */}
        <AlertDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Sales Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve the order and make it ready for picking.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Sales Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel the order and release any reserved inventory.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive"
              >
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Pick List Dialog */}
        <AlertDialog
          open={pickListDialogOpen}
          onOpenChange={setPickListDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create Pick List?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a pick list for warehouse staff to pick items
                for this order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreatePickList}>
                Create Pick List
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardSidebar>
  );
}
