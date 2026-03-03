"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  RefreshCw,
  Loader2,
  RotateCcw,
  User,
  FileText,
  DollarSign,
  Calendar,
  XCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-700" },
  ITEMS_RECEIVED: {
    label: "Items Received",
    color: "bg-purple-100 text-purple-700",
  },
  INSPECTION: {
    label: "Under Inspection",
    color: "bg-orange-100 text-orange-700",
  },
  REFUND_ISSUED: {
    label: "Refund Issued",
    color: "bg-green-100 text-green-700",
  },
  EXCHANGE_SHIPPED: {
    label: "Exchange Shipped",
    color: "bg-green-100 text-green-700",
  },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  REFUND: { label: "Refund", color: "bg-green-100 text-green-700" },
  EXCHANGE: { label: "Exchange", color: "bg-blue-100 text-blue-700" },
  STORE_CREDIT: {
    label: "Store Credit",
    color: "bg-purple-100 text-purple-700",
  },
  REPAIR: { label: "Repair", color: "bg-orange-100 text-orange-700" },
  DISPOSE: { label: "Dispose", color: "bg-red-100 text-red-700" },
};

const WORKFLOW_STEPS = [
  "PENDING",
  "APPROVED",
  "ITEMS_RECEIVED",
  "INSPECTION",
  "REFUND_ISSUED",
] as const;

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rma, setRma] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRMA = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rmas/${params.id}`);
      if (!res.ok) throw new Error("Failed to load RMA");
      const data = await res.json();
      setRma(data.rma ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchRMA();
  }, [params.id]);

  const handleAction = async (endpoint: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/rmas/${params.id}/${endpoint}`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Action failed");
      }
      await fetchRMA();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const stepIndex = Math.max(
    0,
    WORKFLOW_STEPS.findIndex((s) => s === rma?.status),
  );

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/returns")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRMA}
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
        ) : rma ? (
          <>
            {/* RMA Header */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{rma.rmaNumber}</h1>
                    {STATUS_CONFIG[rma.status] && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[rma.status].color}`}
                      >
                        {STATUS_CONFIG[rma.status].label}
                      </span>
                    )}
                    {rma.actionType && ACTION_CONFIG[rma.actionType] && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${ACTION_CONFIG[rma.actionType].color}`}
                      >
                        {ACTION_CONFIG[rma.actionType].label}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Raised{" "}
                    {new Date(rma.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {rma.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {rma.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("receive")}
                      disabled={actionLoading}
                    >
                      <Truck className="h-4 w-4 mr-1" /> Mark Items Received
                    </Button>
                  )}
                  {rma.status === "ITEMS_RECEIVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("inspect")}
                      disabled={actionLoading}
                    >
                      <Package className="h-4 w-4 mr-1" /> Start Inspection
                    </Button>
                  )}
                  {rma.status === "INSPECTION" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("process")}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="h-4 w-4 mr-1" /> Process{" "}
                      {rma.actionType === "REFUND"
                        ? "Refund"
                        : rma.actionType === "EXCHANGE"
                          ? "Exchange"
                          : "Resolution"}
                    </Button>
                  )}
                  {rma.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30"
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {!["REJECTED", "CLOSED"].includes(rma.status) && (
                <div className="mt-6 flex items-center gap-0">
                  {WORKFLOW_STEPS.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            idx <= stepIndex
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          {idx < stepIndex ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="text-xs mt-1 text-muted-foreground hidden sm:block text-center max-w-[70px]">
                          {STATUS_CONFIG[step]?.label ?? step}
                        </span>
                      </div>
                      {idx < WORKFLOW_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 ${idx < stepIndex ? "bg-primary" : "bg-muted-foreground/20"}`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <User className="h-4 w-4" /> Customer
                </div>
                <p className="font-semibold">{rma.customer?.name ?? "—"}</p>
                {rma.customer?.email && (
                  <p className="text-sm text-muted-foreground">
                    {rma.customer.email}
                  </p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <FileText className="h-4 w-4" /> Original Order
                </div>
                {rma.salesOrder ? (
                  <Link
                    href={`/dashboard/sales-orders/${rma.salesOrderId}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {rma.salesOrder?.soNumber ?? rma.salesOrderId}
                  </Link>
                ) : (
                  <p className="font-semibold">—</p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Calendar className="h-4 w-4" /> Requested Date
                </div>
                <p className="font-semibold">
                  {new Date(rma.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <DollarSign className="h-4 w-4" /> Refund Amount
                </div>
                <p className="font-semibold text-xl text-green-600">
                  {rma.refundAmount
                    ? new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      }).format(rma.refundAmount)
                    : "—"}
                </p>
              </div>
            </div>

            {/* Return Reason */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Return Reason</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {rma.returnReason?.name ??
                      rma.reason ??
                      "No reason specified"}
                  </p>
                  {rma.notes && <p className="text-sm mt-2">{rma.notes}</p>}
                </div>
              </div>
            </div>

            {/* Items */}
            {rma.items && rma.items.length > 0 && (
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">
                    Return Items ({rma.items.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Product</th>
                        <th className="text-right p-3 font-medium">
                          Qty Returned
                        </th>
                        <th className="text-left p-3 font-medium">Condition</th>
                        <th className="text-right p-3 font-medium">
                          Refund Amt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rma.items.map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-3">
                            <p className="font-medium">
                              {item.productName ?? item.inventoryItemId ?? "—"}
                            </p>
                            {item.sku && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {item.sku}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {item.quantityReturned ?? item.quantity}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                item.condition === "GOOD"
                                  ? "bg-green-100 text-green-700"
                                  : item.condition === "DAMAGED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.condition ?? "—"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {item.refundAmount
                              ? new Intl.NumberFormat("en-GB", {
                                  style: "currency",
                                  currency: "GBP",
                                }).format(item.refundAmount)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approved By */}
            {rma.approvedBy && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Approved By
                </p>
                <p className="font-medium">
                  {rma.approvedBy.name ?? rma.approvedBy.email}
                </p>
                {rma.approvedDate && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(rma.approvedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
