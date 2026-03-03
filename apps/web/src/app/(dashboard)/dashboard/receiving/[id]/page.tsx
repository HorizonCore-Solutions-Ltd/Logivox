"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Truck,
  Calendar,
  Building,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ClipboardCheck,
  XCircle,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";

const STATUS_STEPS = [
  "DRAFT",
  "PENDING",
  "QUALITY_CHECK",
  "APPROVED",
  "COMPLETED",
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  PENDING: { label: "Pending QC", color: "bg-yellow-100 text-yellow-700" },
  QUALITY_CHECK: { label: "Quality Check", color: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", color: "bg-purple-100 text-purple-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700" },
};

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [grn, setGrn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGRN = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/grn/${params.id}`);
      if (!res.ok) throw new Error("Failed to load GRN");
      const data = await res.json();
      setGrn(data.grn);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchGRN();
  }, [params.id]);

  const handleAction = async (endpoint: string, method = "POST") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grn/${params.id}/${endpoint}`, { method });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Action failed");
      }
      await fetchGRN();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalAccepted =
    grn?.items?.reduce(
      (s: number, i: any) => s + (i.acceptedQuantity ?? 0),
      0,
    ) ?? 0;
  const totalRejected =
    grn?.items?.reduce(
      (s: number, i: any) => s + (i.rejectedQuantity ?? 0),
      0,
    ) ?? 0;
  const stepIndex = STATUS_STEPS.indexOf(grn?.status as any);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/receiving")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGRN}
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
        ) : grn ? (
          <>
            {/* GRN Header Card */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{grn.grnNumber}</h1>
                    {STATUS_CONFIG[grn.status] && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[grn.status].color}`}
                      >
                        {STATUS_CONFIG[grn.status].label}
                      </span>
                    )}
                    {totalRejected > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> {totalRejected}{" "}
                        rejected — NCR raised
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Received{" "}
                    {new Date(grn.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {grn.receivedBy &&
                      ` by ${grn.receivedBy.name ?? grn.receivedBy.email}`}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {grn.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("quality-check")}
                      disabled={actionLoading}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-1" /> Start QC
                    </Button>
                  )}
                  {grn.status === "QUALITY_CHECK" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          fetch(`/api/grn/${params.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "APPROVED" }),
                          }).then(() => fetchGRN());
                        }}
                        disabled={actionLoading}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetch(`/api/grn/${params.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "REJECTED" }),
                          }).then(() => fetchGRN());
                        }}
                        disabled={actionLoading}
                        className="text-destructive border-destructive/30"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {grn.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("complete")}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Complete & Update
                      Inventory
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              {grn.status !== "REJECTED" && (
                <div className="mt-6 flex items-center gap-0">
                  {STATUS_STEPS.map((step, idx) => (
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
                        <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                          {STATUS_CONFIG[step]?.label ?? step}
                        </span>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 ${idx < stepIndex ? "bg-primary" : "bg-muted-foreground/20"}`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-inventory note */}
            {grn.status === "COMPLETED" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800 text-sm">
                    Inventory Updated Automatically
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {totalAccepted} accepted unit(s) have been added to live
                    inventory.
                    {totalRejected > 0 &&
                      ` ${totalRejected} rejected unit(s) were quarantined and an NCR was raised automatically.`}
                  </p>
                </div>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Building className="h-4 w-4" /> Supplier
                </div>
                <p className="font-semibold">
                  {grn.purchaseOrder?.supplier?.name ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Truck className="h-4 w-4" /> Linked PO
                </div>
                {grn.purchaseOrder ? (
                  <Link
                    href={`/dashboard/purchase-orders/${grn.purchaseOrderId}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {grn.purchaseOrder.poNumber}
                  </Link>
                ) : (
                  <p className="font-semibold">—</p>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Calendar className="h-4 w-4" /> Received Date
                </div>
                <p className="font-semibold">
                  {grn.receivedDate
                    ? new Date(grn.receivedDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : new Date(grn.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold">{grn.items?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Line Items</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {grn.items?.reduce(
                    (s: number, i: any) =>
                      s + (i.orderedQuantity ?? i.expectedQuantity ?? 0),
                    0,
                  ) ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Expected</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {totalAccepted}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Accepted</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p
                  className={`text-2xl font-bold ${totalRejected > 0 ? "text-red-600" : "text-muted-foreground"}`}
                >
                  {totalRejected}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rejected</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-xl border bg-card">
              <div className="p-4 border-b flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Received Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">SKU</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Expected</th>
                      <th className="text-right p-3 font-medium">Received</th>
                      <th className="text-right p-3 font-medium">Accepted</th>
                      <th className="text-right p-3 font-medium">Rejected</th>
                      <th className="text-left p-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grn.items?.map((item: any) => (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 hover:bg-muted/20 ${item.rejectedQuantity > 0 ? "bg-red-50/50" : ""}`}
                      >
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {item.inventoryItem?.sku ?? "—"}
                        </td>
                        <td className="p-3">
                          <p className="font-medium">
                            {item.inventoryItem?.name ?? "—"}
                          </p>
                          {item.lotNumber && (
                            <p className="text-xs text-muted-foreground">
                              Lot: {item.lotNumber}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {item.orderedQuantity ?? item.expectedQuantity ?? "—"}
                        </td>
                        <td className="p-3 text-right">
                          {item.receivedQuantity ??
                            item.acceptedQuantity + item.rejectedQuantity}
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          {item.acceptedQuantity}
                        </td>
                        <td className="p-3 text-right">
                          {item.rejectedQuantity > 0 ? (
                            <span className="font-medium text-red-600 flex items-center justify-end gap-1">
                              <AlertTriangle className="h-3 w-3" />{" "}
                              {item.rejectedQuantity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {item.rejectionReason ?? item.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QC Notes */}
            {(grn.qcNotes || grn.notes) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Notes
                </h2>
                {grn.qcNotes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      QC Notes
                    </p>
                    <p className="text-sm">{grn.qcNotes}</p>
                  </div>
                )}
                {grn.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      General Notes
                    </p>
                    <p className="text-sm">{grn.notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
