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
import { Progress } from "@/components/ui/progress";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  ClipboardList,
  Search,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

interface CycleCount {
  id: string;
  countNumber: string;
  status: string;
  countType: string;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  warehouse: { name: string } | null;
  assignedTo: { name: string | null; email: string } | null;
  items: Array<{ id: string; status: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function CycleCountsPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<CycleCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async (pageNum = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/cycle-counts?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const list: CycleCount[] =
        data.cycleCounts || data.counts || data.data || [];
      setCounts(list);
      setTotal(data.pagination?.total || data.total || list.length);
      setPage(pageNum);
    } catch {
      console.error("Failed to load cycle counts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCounts(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const stats = {
    total,
    inProgress: counts.filter((c) => c.status === "IN_PROGRESS").length,
    scheduled: counts.filter((c) => c.status === "SCHEDULED").length,
    completed: counts.filter((c) => c.status === "COMPLETED").length,
  };

  return (
    <DashboardSidebar>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cycle Counts</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and track physical inventory counts to maintain accuracy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCounts(1, true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/cycle-counts/new")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> New Count
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Counts",
              value: stats.total,
              icon: ClipboardList,
              color: "text-blue-600",
            },
            {
              label: "Scheduled",
              value: stats.scheduled,
              icon: Clock,
              color: "text-yellow-600",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: AlertCircle,
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

        {/* Why Cycle Counts Banner */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-green-900 dark:text-green-100">
                  Why cycle counts matter
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Regular cycle counts catch discrepancies between your WMS
                  records and physical stock before they create fulfilment
                  issues. Completing a count can trigger automatic{" "}
                  <strong>stock adjustments</strong>
                  to correct <code>quantity</code> in real time.
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
                  placeholder="Search count number or warehouse..."
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

        {/* Cycle Count List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Count Sessions</CardTitle>
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
            ) : counts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No cycle counts found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/dashboard/cycle-counts/new")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Schedule First Count
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {counts.map((count) => {
                  const totalItems = count.items?.length || 0;
                  const countedItems =
                    count.items?.filter(
                      (i) => i.status === "COUNTED" || i.status === "VERIFIED",
                    ).length || 0;
                  const progress =
                    totalItems > 0
                      ? Math.round((countedItems / totalItems) * 100)
                      : 0;

                  return (
                    <div
                      key={count.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/cycle-counts/${count.id}`)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">
                            {count.countNumber}
                          </p>
                          <Badge
                            className={
                              STATUS_COLORS[count.status] || STATUS_COLORS.DRAFT
                            }
                            variant="secondary"
                          >
                            {count.status.replace(/_/g, " ")}
                          </Badge>
                          {count.countType && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 text-xs"
                            >
                              {count.countType.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {count.warehouse && (
                            <span>{count.warehouse.name}</span>
                          )}
                          {count.assignedTo && (
                            <>
                              <span>•</span>
                              <span>
                                {count.assignedTo.name ||
                                  count.assignedTo.email}
                              </span>
                            </>
                          )}
                          {count.scheduledDate && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(
                                  count.scheduledDate,
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        {totalItems > 0 && count.status === "IN_PROGRESS" && (
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              value={progress}
                              className="h-1.5 flex-1 max-w-48"
                            />
                            <span className="text-xs text-muted-foreground">
                              {countedItems}/{totalItems}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {totalItems} items
                          </p>
                          {count.completedDate && (
                            <p className="text-xs text-green-600">
                              {new Date(
                                count.completedDate,
                              ).toLocaleDateString()}
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
                    onClick={() => fetchCounts(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchCounts(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardSidebar>
  );
}
