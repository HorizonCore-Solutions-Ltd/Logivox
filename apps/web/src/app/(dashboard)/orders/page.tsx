"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Search, Play, CheckCircle2, Clock, Package, AlertCircle, Zap, Plus, Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SalesOrder {
  id: string;
  soNumber: string;
  customer?: { name: string } | null;
  status: string;
  priority: number;
  requestedDate?: string | null;
  totalAmount?: number | null;
  _count?: { items: number };
  createdAt: string;
}

const PRIORITY_LABEL: Record<number, string> = { 1: "LOW", 2: "NORMAL", 3: "HIGH", 4: "URGENT", 5: "CRITICAL" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline", PENDING_APPROVAL: "secondary", APPROVED: "default", PICKING: "default",
  PICKED: "default", PACKING: "default", PACKED: "default", SHIPPED: "default", DELIVERED: "default", CANCELLED: "destructive",
};
const STATUS_TABS = ["ALL", "PENDING_APPROVAL", "APPROVED", "PICKING", "PICKED", "PACKING", "PACKED", "SHIPPED"];

export default function OrdersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading } = useQuery<{ orders: SalesOrder[]; pagination: { total: number } }>({
    queryKey: ["sales-orders", search, statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: "50" });
      if (search) p.set("search", search);
      if (statusFilter !== "ALL") p.set("status", statusFilter);
      const res = await fetch(`/api/sales-orders?${p}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sales-orders/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales-orders"] }); toast({ title: "Order approved" }); },
    onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sales-orders/${id}/release`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales-orders"] }); toast({ title: "Released to picking" }); },
    onError: () => toast({ title: "Failed to release", variant: "destructive" }),
  });

  const orders = data?.orders ?? [];
  const total = data?.pagination?.total ?? 0;
  const overdue = orders.filter((o) => o.requestedDate && new Date(o.requestedDate) < new Date() && !["SHIPPED","DELIVERED","CANCELLED"].includes(o.status)).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />Sales Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total orders</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => router.push("/dashboard/sales-orders/new")}>
            <Plus className="h-4 w-4 mr-2" />New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Pending Approval", value: orders.filter(o => o.status === "PENDING_APPROVAL").length, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
          { title: "In Picking", value: orders.filter(o => o.status === "PICKING").length, icon: Play, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Ready to Ship", value: orders.filter(o => o.status === "PACKED").length, icon: Package, color: "text-green-500", bg: "bg-green-50" },
          { title: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input placeholder="Search order # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1 flex-wrap pt-2">
            {STATUS_TABS.map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} className="h-7 text-xs" onClick={() => setStatusFilter(s)}>
                {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead><TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Value</TableHead><TableHead>Requested</TableHead><TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No orders found.</TableCell></TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/sales-orders/${o.id}`)}>
                    <TableCell className="font-mono font-semibold text-blue-600">{o.soNumber}</TableCell>
                    <TableCell>{o.customer?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>{o.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{PRIORITY_LABEL[o.priority] ?? o.priority}</Badge></TableCell>
                    <TableCell className="text-right">{o._count?.items ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {o.totalAmount != null ? `£${Number(o.totalAmount).toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.requestedDate ? (
                        <span className={new Date(o.requestedDate) < new Date() && !["SHIPPED","DELIVERED","CANCELLED"].includes(o.status) ? "text-red-600 font-semibold" : ""}>
                          {new Date(o.requestedDate).toLocaleDateString("en-GB")}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sales-orders/${o.id}`)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                          {o.status === "PENDING_APPROVAL" && <DropdownMenuItem onClick={() => approveMutation.mutate(o.id)}><CheckCircle2 className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>}
                          {o.status === "APPROVED" && <DropdownMenuItem onClick={() => releaseMutation.mutate(o.id)}><Play className="h-4 w-4 mr-2" />Release to Picking</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
