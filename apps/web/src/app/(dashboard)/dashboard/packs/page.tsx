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
  BoxSelect,
  Search,
  Clock,
  CheckCircle,
  RefreshCw,
  Eye,
  AlertCircle,
  Package,
  Scale,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface Pack {
  id: string;
  packNumber: string;
  status: string;
  totalPackages: number;
  totalWeight: number | null;
  weightUnit: string | null;
  startedDate: string | null;
  completedDate: string | null;
  createdAt: string;
  salesOrder: { soNumber: string; customer: { name: string } };
  warehouse: { name: string; code: string };
  packedBy: { name: string | null } | null;
  packages: { id: string }[];
}

const STATUS_CFG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  IN_PROGRESS: { label: "In Progress", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default function PacksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/packs?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: Pack[] = data.packs || data || [];
      setPacks(items);
      setStats({
        total: items.length,
        pending: items.filter((p) => p.status === "PENDING").length,
        inProgress: items.filter((p) => p.status === "IN_PROGRESS").length,
        completed: items.filter((p) => p.status === "COMPLETED").length,
      });
    } catch {
      setPacks([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  const filtered = packs.filter(
    (p) =>
      !search ||
      p.packNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.salesOrder?.soNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.salesOrder?.customer?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Packing</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage packing operations and package records
            </p>
          </div>
          <Button variant="outline" onClick={fetchPacks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Packs",
              value: stats.total,
              icon: <BoxSelect className="h-4 w-4 text-blue-500" />,
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
              icon: <Package className="h-4 w-4 text-purple-500" />,
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
                  placeholder="Search by pack number, order..."
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
                  No packs found. Complete pick lists to create packing records.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pack #</TableHead>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Packed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((pack) => {
                    const cfg = STATUS_CFG[pack.status] || {
                      label: pack.status,
                      variant: "outline" as const,
                    };
                    return (
                      <TableRow key={pack.id}>
                        <TableCell className="font-mono font-medium">
                          {pack.packNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pack.salesOrder?.soNumber}
                        </TableCell>
                        <TableCell>{pack.salesOrder?.customer?.name}</TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {pack.warehouse?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {pack.totalPackages}
                          </span>
                        </TableCell>
                        <TableCell>
                          {pack.totalWeight ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Scale className="h-3 w-3 text-muted-foreground" />
                              {pack.totalWeight} {pack.weightUnit || "kg"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {pack.packedBy?.name || (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/packs/${pack.id}`)
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
    </DashboardSidebar>
  );
}
