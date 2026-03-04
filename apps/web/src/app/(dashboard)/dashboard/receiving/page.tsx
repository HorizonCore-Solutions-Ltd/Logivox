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
  Package,
  Search,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Warehouse,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface GRN {
  id: string;
  grnNumber: string;
  status: string;
  receivedDate: string | null;
  putAwayCompleted: boolean;
  createdAt: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { name: string };
  } | null;
  warehouse: { name: string } | null;
  receivedBy: { name: string | null; email: string } | null;
  items: Array<{ acceptedQuantity: number; rejectedQuantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function GRNReceivingPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchGRNs = async (pageNum = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/grn?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const list: GRN[] =
        data.goodsReceiptNotes || data.grns || data.data || [];
      setGrns(list);
      setTotal(data.pagination?.total || data.total || list.length);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load GRNs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGRNs(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const stats = {
    pending: grns.filter((g) => g.status === "PENDING").length,
    approved: grns.filter((g) => g.status === "APPROVED").length,
    completed: grns.filter((g) => g.status === "COMPLETED").length,
    total,
  };

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Goods Receipt Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              Record inbound deliveries and update inventory on receipt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGRNs(1, true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              <Link href="/dashboard/grn/receive">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Receipt
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
              label: "Total GRNs",
              value: stats.total,
              icon: Package,
              color: "text-blue-600",
            },
            {
              label: "Pending QC",
              value: stats.pending,
              icon: Clock,
              color: "text-yellow-600",
            },
            {
              label: "Approved (In Put-away)",
              value: stats.approved,
              icon: Warehouse,
              color: "text-purple-600",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              color: "text-green-600",
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

        {/* How It Works */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  How inbound receiving works
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  When you complete a GRN, stock quantities are{" "}
                  <strong>automatically updated</strong> in inventory. Each
                  accepted item increments <code>quantity</code> and{" "}
                  <code>availableQty</code> and creates an InventoryMovement
                  record (type: PURCHASE). The linked Purchase Order item's
                  <code>quantityReceived</code> also increments automatically.
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
                  placeholder="Search GRN number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {[
                    "DRAFT",
                    "PENDING",
                    "APPROVED",
                    "COMPLETED",
                    "REJECTED",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* GRN List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Receipts</CardTitle>
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
            ) : grns.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No GRNs found</p>
                <p className="text-sm mt-1">
                  GRNs are created from Purchase Order receptions.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {grns.map((grn) => {
                  const totalAccepted =
                    grn.items?.reduce((s, i) => s + i.acceptedQuantity, 0) || 0;
                  const totalRejected =
                    grn.items?.reduce((s, i) => s + i.rejectedQuantity, 0) || 0;
                  return (
                    <div
                      key={grn.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/receiving/${grn.id}`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">
                            {grn.grnNumber}
                          </p>
                          <Badge
                            className={
                              STATUS_COLORS[grn.status] || STATUS_COLORS.PENDING
                            }
                            variant="secondary"
                          >
                            {grn.status}
                          </Badge>
                          {grn.putAwayCompleted && (
                            <Badge
                              className="bg-green-100 text-green-700"
                              variant="secondary"
                            >
                              Put Away ✓
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {grn.purchaseOrder?.poNumber || "Manual Receipt"}
                          </span>
                          {grn.purchaseOrder?.supplier && (
                            <>
                              <span>•</span>
                              <span>{grn.purchaseOrder.supplier.name}</span>
                            </>
                          )}
                          {grn.warehouse && (
                            <>
                              <span>•</span>
                              <span>{grn.warehouse.name}</span>
                            </>
                          )}
                          {grn.receivedDate && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(
                                  grn.receivedDate,
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +{totalAccepted} accepted
                          </p>
                          {totalRejected > 0 && (
                            <p className="text-xs text-red-500">
                              {totalRejected} rejected
                            </p>
                          )}
                        </div>
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
                    onClick={() => fetchGRNs(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchGRNs(page + 1)}
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
