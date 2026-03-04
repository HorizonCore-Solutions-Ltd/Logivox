"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Package,
  ClipboardCheck,
  AlertTriangle,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface RMA {
  id: string;
  rmaNumber: string;
  status: string;
  reason: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  totalItems: number;
  refundAmount?: number;
  lines?: { id: string }[];
  createdAt: string;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  RECEIVED: "default",
  INSPECTING: "default",
  COMPLETED: "default",
  CANCELLED: "outline",
};

export default function ReturnsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading } = useQuery<{
    returns: RMA[];
    summary: {
      pending: number;
      approved: number;
      received: number;
      refundValue: number;
    };
  }>({
    queryKey: ["returns", search, statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: "50" });
      if (search) p.set("search", search);
      if (statusFilter !== "ALL") p.set("status", statusFilter);
      const res = await fetch(`/api/returns?${p}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const mutate = (url: string, method = "PUT") => ({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/returns/${id}/${url}`, { method });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      toast({ title: "Updated" });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const approveMutation = useMutation(mutate("approve"));
  const receiveMutation = useMutation(mutate("receive"));
  const completeMutation = useMutation(mutate("complete"));

  const returns = data?.returns ?? [];
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-purple-600" />
            Returns (RMA)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {returns.length} returns
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/rmas/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New RMA
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Pending Review",
            value:
              summary?.pending ??
              returns.filter((r) => r.status === "PENDING").length,
            icon: AlertTriangle,
            color: "text-yellow-500",
            bg: "bg-yellow-50",
          },
          {
            title: "Approved",
            value:
              summary?.approved ??
              returns.filter((r) => r.status === "APPROVED").length,
            icon: CheckCircle2,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            title: "In Inspection",
            value: returns.filter((r) => r.status === "INSPECTING").length,
            icon: ClipboardCheck,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
          {
            title: "Refund Value",
            value:
              summary?.refundValue != null
                ? `£${Number(summary.refundValue).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
                : "—",
            icon: Package,
            color: "text-green-500",
            bg: "bg-green-50",
          },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? "—" : kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search RMA # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "ALL",
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                  "RECEIVED",
                  "INSPECTING",
                  "COMPLETED",
                  "CANCELLED",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Refund Value</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-mono font-semibold text-purple-600">
                        {r.rmaNumber}
                      </TableCell>
                      <TableCell>{r.customerName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[r.status] ?? "secondary"}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">
                        {r.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.totalItems}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {r.refundAmount != null
                          ? `£${Number(r.refundAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(r.createdAt).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/rmas/${r.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {r.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() => approveMutation.mutate(r.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {r.status === "APPROVED" && (
                              <DropdownMenuItem
                                onClick={() => receiveMutation.mutate(r.id)}
                              >
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Mark Received
                              </DropdownMenuItem>
                            )}
                            {r.status === "INSPECTING" && (
                              <DropdownMenuItem
                                onClick={() => completeMutation.mutate(r.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
