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
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ReturnItem {
  id: string;
  inventoryItem: { sku: string; name: string };
  quantityRequested: number;
  condition: string;
  action: string;
  unitPrice: number;
}

interface Return {
  id: string;
  rmaNumber: string;
  status: string;
  returnMethod: string;
  totalRefundAmount: number;
  createdAt: string;
  updatedAt: string;
  returnReason: { reason: string; category: string } | null;
  salesOrder: { soNumber: string } | null;
  items: ReturnItem[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-purple-100 text-purple-800",
    icon: RefreshCw,
  },
  RECEIVED: {
    label: "Received",
    color: "bg-indigo-100 text-indigo-800",
    icon: Package,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
};

export default function PortalReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [filtered, setFiltered] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchReturns();
  }, []);

  useEffect(() => {
    let result = returns;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.rmaNumber.toLowerCase().includes(q) ||
          r.salesOrder?.soNumber.toLowerCase().includes(q) ||
          r.returnReason?.reason.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, returns]);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/returns");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load returns");
      }
      const data = await res.json();
      setReturns(data.returns || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button onClick={fetchReturns} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your return requests and refund status
          </p>
        </div>
        <Link href="/portal/returns/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Request Return
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Returns",
            value: returns.length,
            color: "text-gray-900",
          },
          {
            label: "Pending",
            value: returns.filter((r) => r.status === "PENDING").length,
            color: "text-yellow-600",
          },
          {
            label: "In Progress",
            value: returns.filter((r) =>
              ["APPROVED", "IN_PROGRESS", "RECEIVED"].includes(r.status),
            ).length,
            color: "text-blue-600",
          },
          {
            label: "Completed",
            value: returns.filter((r) => r.status === "COMPLETED").length,
            color: "text-green-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by RMA number or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            "ALL",
            "PENDING",
            "APPROVED",
            "IN_PROGRESS",
            "COMPLETED",
            "REJECTED",
          ].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? "bg-blue-600 text-white" : ""}
            >
              {s === "ALL" ? "All" : (STATUS_CONFIG[s]?.label ?? s)}
            </Button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Package className="h-14 w-14 text-gray-300" />
            <div className="text-center">
              <p className="text-gray-600 font-medium">No returns found</p>
              <p className="text-sm text-gray-400 mt-1">
                {returns.length === 0
                  ? "You haven't submitted any return requests yet."
                  : "No returns match your current filters."}
              </p>
            </div>
            {returns.length === 0 && (
              <Link href="/portal/returns/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Return
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((rma) => {
            const statusConfig =
              STATUS_CONFIG[rma.status] || STATUS_CONFIG["PENDING"]!;
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={rma.id}
                className="hover:shadow-md transition-shadow border border-gray-200"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {rma.rmaNumber}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {rma.salesOrder ? (
                          <span>
                            For order{" "}
                            <Link
                              href={`/portal/orders/${rma.salesOrder.soNumber}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {rma.salesOrder.soNumber}
                            </Link>
                          </span>
                        ) : (
                          "No linked order"
                        )}
                      </CardDescription>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {rma.returnReason?.reason ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Method</p>
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {rma.returnMethod?.replace(/_/g, " ") ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Items</p>
                      <p className="text-sm font-medium text-gray-800">
                        {rma.items.length} item
                        {rma.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Refund Amount</p>
                      <p className="text-sm font-medium text-green-700">
                        {formatCurrency(rma.totalRefundAmount ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* Items preview */}
                  {rma.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Items</p>
                      <div className="space-y-1">
                        {rma.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs text-gray-600"
                          >
                            <span>
                              {item.inventoryItem.name}{" "}
                              <span className="text-gray-400">
                                ({item.inventoryItem.sku})
                              </span>
                            </span>
                            <span className="font-medium">
                              Qty: {item.quantityRequested} ·{" "}
                              <span className="capitalize">
                                {item.condition.toLowerCase()}
                              </span>
                            </span>
                          </div>
                        ))}
                        {rma.items.length > 3 && (
                          <p className="text-xs text-gray-400">
                            +{rma.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Submitted {formatDate(rma.createdAt)}
                    </p>
                    <Link href={`/portal/returns/${rma.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
