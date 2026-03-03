"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Search,
  Clock,
  CheckCircle,
  Package,
  Play,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
interface PickList {
  id: string;
  pickListNumber: string;
  status: string;
  priority: number;
  assignedDate: string | null;
  startedDate: string | null;
  completedDate: string | null;
  createdAt: string;
  salesOrder: { soNumber: string; customer: { name: string } };
  warehouse: { name: string; code: string };
  assignedTo: { name: string | null } | null;
  items: { id: string; quantityToPick: number; quantityPicked: number }[];
}

const STATUS_CFG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  ASSIGNED: { label: "Assigned", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default function PickListsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const fetchPickLists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pick-lists?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: PickList[] = data.pickLists || data || [];
      setPickLists(items);
      setStats({
        total: items.length,
        pending: items.filter((p) => p.status === "PENDING").length,
        inProgress: items.filter((p) => p.status === "IN_PROGRESS").length,
        completed: items.filter((p) => p.status === "COMPLETED").length,
      });
    } catch {
      setPickLists([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchPickLists, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchPickLists, search]);

  const filtered = pickLists.filter(
    (p) =>
      !search ||
      p.pickListNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.salesOrder?.soNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.salesOrder?.customer?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const progressPct = (pl: PickList) => {
    const total = pl.items?.reduce((s, i) => s + i.quantityToPick, 0) || 0;
    const picked = pl.items?.reduce((s, i) => s + i.quantityPicked, 0) || 0;
    return total > 0 ? Math.round((picked / total) * 100) : 0;
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pick Lists</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track warehouse picking tasks and progress
            </p>
          </div>
          <Button variant="outline" onClick={fetchPickLists}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: <ClipboardList className="h-4 w-4 text-blue-500" />,
              color: "text-blue-600",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: <Clock className="h-4 w-4 text-amber-500" />,
              color: "text-amber-600",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: <Play className="h-4 w-4 text-purple-500" />,
              color: "text-purple-600",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              color: "text-green-600",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.icon}
                </div>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by pick list or order number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CFG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                <p>
                  No pick lists found. Approve a sales order to generate one.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pick List #</TableHead>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((pl) => {
                    const cfg = STATUS_CFG[pl.status] || {
                      label: pl.status,
                      variant: "outline" as const,
                    };
                    const pct = progressPct(pl);
                    return (
                      <TableRow key={pl.id}>
                        <TableCell className="font-mono font-medium">
                          {pl.pickListNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pl.salesOrder?.soNumber}
                        </TableCell>
                        <TableCell>{pl.salesOrder?.customer?.name}</TableCell>
                        <TableCell>
                          <span className="text-sm">{pl.warehouse?.name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {pl.warehouse?.code}
                          </span>
                        </TableCell>
                        <TableCell>
                          {pl.assignedTo?.name || (
                            <span className="text-muted-foreground text-sm">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[80px]">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/pick-lists/${pl.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
