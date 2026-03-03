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
  ClipboardCheck,
  Search,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface QCInspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  result: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  inventoryItem: { name: string; sku: string } | null;
  inspector: { name: string | null; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_PROGRESS:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  ON_HOLD:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const RESULT_COLORS: Record<string, string> = {
  PASS: "bg-green-100 text-green-700",
  FAIL: "bg-red-100 text-red-700",
  CONDITIONAL_PASS: "bg-orange-100 text-orange-700",
  PENDING: "bg-gray-100 text-gray-600",
};

export default function QCInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchInspections = async (pageNum = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/qc/inspections?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const list: QCInspection[] = data.inspections || data.data || [];
      setInspections(list);
      setTotal(data.pagination?.total || data.total || list.length);
      setPage(pageNum);
    } catch {
      console.error("Failed to load QC inspections");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInspections(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const stats = {
    total,
    scheduled: inspections.filter((i) => i.status === "SCHEDULED").length,
    inProgress: inspections.filter((i) => i.status === "IN_PROGRESS").length,
    failed: inspections.filter((i) => i.result === "FAIL").length,
  };

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              QC Inspections
            </h1>
            <p className="text-muted-foreground mt-1">
              Quality control inspections across inbound, inventory, and
              production.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInspections(1, true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Inspections",
              value: stats.total,
              icon: ClipboardCheck,
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
              icon: AlertTriangle,
              color: "text-purple-600",
            },
            {
              label: "Failed",
              value: stats.failed,
              icon: XCircle,
              color: "text-red-600",
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

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspection number or SKU..."
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

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inspections</CardTitle>
              <CardDescription>{total} total</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {statusFilter === "ALL" && !search
                    ? "No QC inspections yet"
                    : "No inspections match filter"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {inspections.map((insp) => (
                  <div
                    key={insp.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/qc-inspections/${insp.id}`)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {insp.inspectionNumber}
                        </p>
                        <Badge
                          className={
                            STATUS_COLORS[insp.status] ||
                            STATUS_COLORS.SCHEDULED
                          }
                          variant="secondary"
                        >
                          {insp.status.replace(/_/g, " ")}
                        </Badge>
                        {insp.result && (
                          <Badge
                            className={
                              RESULT_COLORS[insp.result] ||
                              RESULT_COLORS.PENDING
                            }
                            variant="secondary"
                          >
                            {insp.result.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>
                          {insp.type?.replace(/_/g, " ") || "General"}
                        </span>
                        {insp.inventoryItem && (
                          <>
                            <span>•</span>
                            <span>
                              {insp.inventoryItem.name} (
                              {insp.inventoryItem.sku})
                            </span>
                          </>
                        )}
                        {insp.inspector && (
                          <>
                            <span>•</span>
                            <span>
                              {insp.inspector.name || insp.inspector.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <div className="text-right">
                        {insp.scheduledDate && (
                          <p className="text-xs text-muted-foreground">
                            Scheduled:{" "}
                            {new Date(insp.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                        {insp.completedDate && (
                          <p className="text-xs text-green-600">
                            Completed:{" "}
                            {new Date(insp.completedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
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
                    onClick={() => fetchInspections(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchInspections(page + 1)}
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
