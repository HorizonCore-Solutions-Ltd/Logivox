"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  XCircle,
  Package,
  Truck,
  Calendar,
  Building,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700",
    icon: <FileText className="h-3 w-3" />,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-700",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-100 text-blue-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  SENT: {
    label: "Sent to Supplier",
    color: "bg-purple-100 text-purple-700",
    icon: <Send className="h-3 w-3" />,
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    color: "bg-orange-100 text-orange-700",
    icon: <Package className="h-3 w-3" />,
  },
  RECEIVED: {
    label: "Fully Received",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPO = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/purchase-orders/${params.id}`);
      if (!res.ok) throw new Error("Failed to load purchase order");
      const data = await res.json();
      setPo(data.purchaseOrder);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchPO();
  }, [params.id]);

  const handleAction = async (endpoint: string, method = "POST") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/${endpoint}`, {
        method,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Action failed");
      }
      await fetchPO();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalValue =
    po?.items?.reduce(
      (sum: number, item: any) =>
        sum + item.quantityOrdered * parseFloat(item.unitPrice ?? 0),
      0,
    ) ?? 0;

  const receivedPercent = po?.items?.length
    ? Math.round(
        (po.items.reduce(
          (s: number, i: any) => s + (i.quantityReceived ?? 0),
          0,
        ) /
          Math.max(
            1,
            po.items.reduce((s: number, i: any) => s + i.quantityOrdered, 0),
          )) *
          100,
      )
    : 0;

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPO}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        ) : po ? (
          <>
            {/* PO Header Card */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{po.poNumber}</h1>
                    {STATUS_CONFIG[po.status] && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[po.status].color}`}
                      >
                        {STATUS_CONFIG[po.status].icon}
                        {STATUS_CONFIG[po.status].label}
                      </span>
                    )}
                    {po.priority && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLOR[po.priority] ?? ""}`}
                      >
                        {po.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Created{" "}
                    {new Date(po.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {po.createdBy &&
                      ` by ${po.createdBy.name ?? po.createdBy.email}`}
                  </p>
                </div>

                {/* Action buttons based on status */}
                <div className="flex gap-2 flex-wrap">
                  {po.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {po.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("send")}
                      disabled={actionLoading}
                    >
                      <Send className="h-4 w-4 mr-1" /> Send to Supplier
                    </Button>
                  )}
                  {["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(
                    po.status,
                  ) && (
                    <Link href={`/dashboard/receiving`}>
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-1" /> Receive Goods (GRN)
                      </Button>
                    </Link>
                  )}
                  {!["RECEIVED", "CANCELLED"].includes(po.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction("cancel")}
                      disabled={actionLoading}
                      className="text-destructive border-destructive/30"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {po.status !== "DRAFT" && po.status !== "CANCELLED" && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Receipt Progress</span>
                    <span>{receivedPercent}% received</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${receivedPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Building className="h-4 w-4" /> Supplier
                </div>
                <p className="font-semibold">{po.supplier?.name ?? "—"}</p>
                {po.supplier?.email && (
                  <p className="text-sm text-muted-foreground">
                    {po.supplier.email}
                  </p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Calendar className="h-4 w-4" /> Expected Delivery
                </div>
                <p className="font-semibold">
                  {po.expectedDate
                    ? new Date(po.expectedDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not set"}
                </p>
                {po.receivedDate && (
                  <p className="text-xs text-green-600 mt-1">
                    Received{" "}
                    {new Date(po.receivedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <DollarSign className="h-4 w-4" /> Total Value
                </div>
                <p className="font-semibold text-xl">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                  }).format(totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {po.items?.length ?? 0} line items
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <MapPin className="h-4 w-4" /> Delivery Address
                </div>
                <p className="font-semibold text-sm">
                  {[po.deliveryAddress, po.deliveryCity, po.deliveryCountry]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border bg-card">
              <div className="p-4 border-b flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Line Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">SKU</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Ordered</th>
                      <th className="text-right p-3 font-medium">Received</th>
                      <th className="text-right p-3 font-medium">Remaining</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items?.map((item: any) => {
                      const received = item.quantityReceived ?? 0;
                      const remaining = item.quantityOrdered - received;
                      const lineTotal =
                        item.quantityOrdered * parseFloat(item.unitPrice ?? 0);
                      return (
                        <tr
                          key={item.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-3 font-mono text-xs text-muted-foreground">
                            {item.inventoryItem?.sku ?? "—"}
                          </td>
                          <td className="p-3">
                            <p className="font-medium">
                              {item.inventoryItem?.name ??
                                item.description ??
                                "—"}
                            </p>
                            {item.inventoryItem?.warehouse?.name && (
                              <p className="text-xs text-muted-foreground">
                                {item.inventoryItem.warehouse.name}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {item.quantityOrdered}
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={
                                received > 0
                                  ? "text-green-600 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {received}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={
                                remaining > 0
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }
                            >
                              {remaining}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {parseFloat(item.unitPrice ?? 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: "GBP",
                            }).format(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold">
                      <td colSpan={6} className="p-3 text-right">
                        Total
                      </td>
                      <td className="p-3 text-right">
                        {new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: "GBP",
                        }).format(totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* GRN Receipts */}
            {po.receipts && po.receipts.length > 0 && (
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">
                    Goods Receipt Notes ({po.receipts.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {po.receipts.map((grn: any) => (
                    <div
                      key={grn.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{grn.grnNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(grn.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            grn.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : grn.status === "APPROVED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {grn.status}
                        </span>
                        <Link href={`/dashboard/receiving/${grn.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {(po.notes || po.internalNotes || po.deliveryNotes) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Notes
                </h2>
                {po.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Supplier Notes
                    </p>
                    <p className="text-sm">{po.notes}</p>
                  </div>
                )}
                {po.internalNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Internal Notes
                    </p>
                    <p className="text-sm">{po.internalNotes}</p>
                  </div>
                )}
                {po.deliveryNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Delivery Notes
                    </p>
                    <p className="text-sm">{po.deliveryNotes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardSidebar>
  );
}
