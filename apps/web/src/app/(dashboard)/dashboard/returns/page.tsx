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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCcw,
  Search,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plus
} from "lucide-react";
import Link from "next/link";

interface RMA {
  id: string;
  rmaNumber: string;
  status: string;
  refundAmount: number | null;
  resolution: string | null;
  createdAt: string;
  customer: { name: string; email: string | null };
  salesOrder: { soNumber: string } | null;
  items: Array<{ id: string; action: string; quantityRequested: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ITEMS_RECEIVED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  INSPECTION_COMPLETE:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  REFUND_ISSUED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  EXCHANGE_SHIPPED:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ACTION_COLORS: Record<string, string> = {
  REFUND: "bg-green-100 text-green-700",
  EXCHANGE: "bg-blue-100 text-blue-700",
  STORE_CREDIT: "bg-purple-100 text-purple-700",
  REPAIR: "bg-orange-100 text-orange-700",
  DISPOSE: "bg-red-100 text-red-700",
};

export default function ReturnsPage() {
  const router = useRouter();
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRMAs = async (pageNum = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/rmas?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const list: RMA[] = data.rmas || data.data || [];
      setRmas(list);
      setTotal(data.pagination?.total || data.total || list.length);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load RMAs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRMAs(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const stats = {
    open: rmas.filter((r) =>
      ["PENDING", "APPROVED", "ITEMS_RECEIVED", "INSPECTION_COMPLETE"].includes(
        r.status,
      ),
    ).length,
    refunded: rmas.filter((r) => r.status === "REFUND_ISSUED").length,
    totalRefundValue: rmas.reduce((s, r) => s + Number(r.refundAmount || 0), 0),
    total,
  };

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Returns & RMAs
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage customer return authorisations, inspections and refunds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRMAs(1, true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
            <Link href="/dashboard/returns/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Return
              </Button>
            </Link>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total RMAs",
              value: stats.total,
              icon: RefreshCcw,
              color: "text-blue-600",
            },
            {
              label: "Open / In Progress",
              value: stats.open,
              icon: Clock,
              color: "text-orange-600",
            },
            {
              label: "Refunds Issued",
              value: stats.refunded,
              icon: CheckCircle,
              color: "text-green-600",
            },
            {
              label: "Total Refunded",
              value: loading
                ? "—"
                : `$${stats.totalRefundValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              icon: DollarSign,
              color: "text-purple-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "—" : s.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Info */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-amber-900 dark:text-amber-100">
                  Returns workflow
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  RMAs flow through:{" "}
                  <strong>
                    Pending → Approved → Items Received → Inspection →
                    Refund/Exchange
                  </strong>
                  . When items are inspected and accepted back, restocking
                  updates inventory automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RMA number or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.keys(STATUS_COLORS).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* RMA List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Return Authorisations</CardTitle>
              <CardDescription>{total} total</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : rmas.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <RefreshCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {statusFilter === "ALL" && !search
                    ? "No returns yet"
                    : "No returns match filter"}
                </p>
                <p className="text-sm mt-1 text-muted-foreground">
                  Returns are created from customer service requests.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {rmas.map((rma) => {
                  const totalQty =
                    rma.items?.reduce((s, i) => s + i.quantityRequested, 0) ||
                    0;
                  const actions = [
                    ...new Set(rma.items?.map((i) => i.action) || []),
                  ];
                  return (
                    <div
                      key={rma.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/returns/${rma.id}`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">
                            {rma.rmaNumber}
                          </p>
                          <Badge
                            className={
                              STATUS_COLORS[rma.status] || STATUS_COLORS.PENDING
                            }
                            variant="secondary"
                          >
                            {rma.status.replace(/_/g, " ")}
                          </Badge>
                          {actions.map((action) => (
                            <Badge
                              key={action}
                              className={
                                ACTION_COLORS[action] || ACTION_COLORS.REFUND
                              }
                              variant="secondary"
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{rma.customer?.name || "Unknown"}</span>
                          {rma.salesOrder && (
                            <>
                              <span>•</span>
                              <span>SO: {rma.salesOrder.soNumber}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {totalQty} item{totalQty !== 1 ? "s" : ""}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(rma.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        {rma.refundAmount && (
                          <p className="text-sm font-semibold text-green-600">
                            ${Number(rma.refundAmount).toFixed(2)}
                          </p>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchRMAs(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchRMAs(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
