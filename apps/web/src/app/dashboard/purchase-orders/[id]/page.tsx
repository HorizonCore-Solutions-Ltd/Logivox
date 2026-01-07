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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  Package,
  Calendar,
  User,
  Building2,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  priority: string;
  orderDate: string;
  expectedDate: string | null;
  approvedDate: string | null;
  receivedDate: string | null;
  cancelledDate: string | null;
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryCountry: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  internalNotes: string | null;
  supplier: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: Array<{
    id: string;
    sku: string;
    description: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    tax: number;
    totalPrice: number;
    inventoryItem: {
      id: string;
      name: string;
      sku: string;
    } | null;
  }>;
  receipts: any[];
}

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchPurchaseOrder();
  }, [params.id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-orders/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setPurchaseOrder(data.purchaseOrder);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/purchase-orders/${params.id}/approve`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Purchase order approved successfully",
        });
        fetchPurchaseOrder();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to approve purchase order",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowApproveDialog(false);
    }
  };

  const handleSend = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/purchase-orders/${params.id}/send`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Purchase order sent to ${data.supplierEmail}`,
        });
        fetchPurchaseOrder();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to send purchase order",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowSendDialog(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/purchase-orders/${params.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Purchase order cancelled successfully",
        });
        fetchPurchaseOrder();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to cancel purchase order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel purchase order",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowCancelDialog(false);
      setCancelReason("");
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

  const canEdit =
    purchaseOrder?.status === "DRAFT" || purchaseOrder?.status === "PENDING";
  const canApprove =
    purchaseOrder?.status === "DRAFT" || purchaseOrder?.status === "PENDING";
  const canSend = purchaseOrder?.status === "APPROVED";
  const canCancel =
    purchaseOrder?.status &&
    !["RECEIVED", "CLOSED", "CANCELLED"].includes(purchaseOrder.status);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading purchase order...</div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Purchase Order Not Found
              </h3>
              <Button onClick={() => router.push("/dashboard/purchase-orders")}>
                Back to Purchase Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{purchaseOrder.poNumber}</h1>
            <Badge className={getStatusColor(purchaseOrder.status)}>
              {purchaseOrder.status.replace(/_/g, " ")}
            </Badge>
            <Badge
              variant="outline"
              className={getPriorityColor(purchaseOrder.priority)}
            >
              {purchaseOrder.priority}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created on {new Date(purchaseOrder.orderDate).toLocaleDateString()}{" "}
            by {purchaseOrder.createdBy.name}
          </p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/purchase-orders/${params.id}/edit`)
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setShowApproveDialog(true)}
              disabled={actionLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {canSend && (
            <Button
              onClick={() => setShowSendDialog(true)}
              disabled={actionLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Supplier
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {purchaseOrder.items.length} item
                {purchaseOrder.items.length !== 1 ? "s" : ""} in this purchase
                order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">SKU</th>
                      <th className="text-left py-2 px-4">Description</th>
                      <th className="text-right py-2 px-4">Qty Ordered</th>
                      <th className="text-right py-2 px-4">Qty Received</th>
                      <th className="text-right py-2 px-4">Unit Price</th>
                      <th className="text-right py-2 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-4 font-mono text-sm">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="py-3 px-4 text-right">
                          {item.quantityOrdered}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              item.quantityReceived > 0
                                ? "text-green-600 font-semibold"
                                : ""
                            }
                          >
                            {item.quantityReceived}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {purchaseOrder.currency}{" "}
                          {Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {purchaseOrder.currency}{" "}
                          {Number(item.totalPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td
                        colSpan={5}
                        className="py-3 px-4 text-right font-semibold"
                      >
                        Subtotal:
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {purchaseOrder.currency}{" "}
                        {Number(purchaseOrder.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                    {purchaseOrder.tax > 0 && (
                      <tr>
                        <td colSpan={5} className="py-2 px-4 text-right">
                          Tax:
                        </td>
                        <td className="py-2 px-4 text-right">
                          {purchaseOrder.currency}{" "}
                          {Number(purchaseOrder.tax).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {purchaseOrder.shipping > 0 && (
                      <tr>
                        <td colSpan={5} className="py-2 px-4 text-right">
                          Shipping:
                        </td>
                        <td className="py-2 px-4 text-right">
                          {purchaseOrder.currency}{" "}
                          {Number(purchaseOrder.shipping).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2">
                      <td
                        colSpan={5}
                        className="py-3 px-4 text-right font-bold text-lg"
                      >
                        Total:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-lg">
                        {purchaseOrder.currency}{" "}
                        {Number(purchaseOrder.totalAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {(purchaseOrder.deliveryAddress || purchaseOrder.deliveryNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchaseOrder.deliveryAddress && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p>{purchaseOrder.deliveryAddress}</p>
                    {purchaseOrder.deliveryCity && (
                      <p>{purchaseOrder.deliveryCity}</p>
                    )}
                    {purchaseOrder.deliveryCountry && (
                      <p>{purchaseOrder.deliveryCountry}</p>
                    )}
                  </div>
                )}
                {purchaseOrder.deliveryNotes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Delivery Notes
                    </label>
                    <p className="text-sm mt-1">
                      {purchaseOrder.deliveryNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(purchaseOrder.notes || purchaseOrder.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchaseOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {purchaseOrder.notes}
                    </p>
                  </div>
                )}
                {purchaseOrder.internalNotes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Internal Notes
                    </label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {purchaseOrder.internalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{purchaseOrder.supplier.name}</p>
                <p className="text-sm text-muted-foreground">
                  Code: {purchaseOrder.supplier.code}
                </p>
              </div>
              {purchaseOrder.supplier.email && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm">{purchaseOrder.supplier.email}</p>
                </div>
              )}
              {purchaseOrder.supplier.phone && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="text-sm">{purchaseOrder.supplier.phone}</p>
                </div>
              )}
              {purchaseOrder.supplier.address && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="text-sm">{purchaseOrder.supplier.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">
                  {new Date(purchaseOrder.orderDate).toLocaleString()}
                </p>
              </div>
              {purchaseOrder.expectedDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Expected Delivery
                  </label>
                  <p className="text-sm">
                    {new Date(purchaseOrder.expectedDate).toLocaleString()}
                  </p>
                </div>
              )}
              {purchaseOrder.approvedDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Approved
                  </label>
                  <p className="text-sm">
                    {new Date(purchaseOrder.approvedDate).toLocaleString()}
                  </p>
                  {purchaseOrder.approvedBy && (
                    <p className="text-xs text-muted-foreground">
                      by {purchaseOrder.approvedBy.name}
                    </p>
                  )}
                </div>
              )}
              {purchaseOrder.receivedDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Received
                  </label>
                  <p className="text-sm">
                    {new Date(purchaseOrder.receivedDate).toLocaleString()}
                  </p>
                </div>
              )}
              {purchaseOrder.cancelledDate && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Cancelled
                  </label>
                  <p className="text-sm text-red-600">
                    {new Date(purchaseOrder.cancelledDate).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Items
                </span>
                <span className="font-semibold">
                  {purchaseOrder.items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Quantity
                </span>
                <span className="font-semibold">
                  {purchaseOrder.items.reduce(
                    (sum, item) => sum + item.quantityOrdered,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Received Quantity
                </span>
                <span className="font-semibold text-green-600">
                  {purchaseOrder.items.reduce(
                    (sum, item) => sum + item.quantityReceived,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-sm font-medium">Completion</span>
                <span className="font-bold">
                  {(
                    (purchaseOrder.items.reduce(
                      (sum, item) => sum + item.quantityReceived,
                      0,
                    ) /
                      purchaseOrder.items.reduce(
                        (sum, item) => sum + item.quantityOrdered,
                        0,
                      )) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {purchaseOrder.poNumber}? This
              will allow the purchase order to be sent to the supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Send {purchaseOrder.poNumber} to {purchaseOrder.supplier.name} at{" "}
              {purchaseOrder.supplier.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={actionLoading}>
              {actionLoading ? "Sending..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {purchaseOrder.poNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              Cancellation Reason (Optional)
            </label>
            <textarea
              className="w-full mt-2 p-2 border rounded-md"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Cancelling..." : "Confirm Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
