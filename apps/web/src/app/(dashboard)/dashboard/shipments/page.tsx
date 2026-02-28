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
  Truck,
  Search,
  Clock,
  CheckCircle,
  RefreshCw,
  Eye,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { toast } from "sonner";

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  carrierCode: string | null;
  carrierService: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  city: string | null;
  country: string | null;
  recipientName: string | null;
  salesOrder: { soNumber: string; customer: { name: string } };
}

const STATUS_CFG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING: { label: "Pending", variant: "outline", color: "text-muted-foreground" },
  LABEL_CREATED: { label: "Label Created", variant: "secondary", color: "text-blue-600" },
  PICKED_UP: { label: "Picked Up", variant: "default", color: "text-blue-600" },
  IN_TRANSIT: { label: "In Transit", variant: "default", color: "text-amber-600" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "default", color: "text-orange-600" },
  DELIVERED: { label: "Delivered", variant: "default", color: "text-green-600" },
  FAILED: { label: "Failed", variant: "destructive", color: "text-red-600" },
  RETURNED: { label: "Returned", variant: "destructive", color: "text-red-600" },
  CANCELLED: { label: "Cancelled", variant: "destructive", color: "text-red-600" },
};

export default function ShipmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, inTransit: 0, delivered: 0, failed: 0 });

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/shipments?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: Shipment[] = data.shipments || data || [];
      setShipments(items);
      setStats({
        total: items.length,
        inTransit: items.filter((s) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length,
        delivered: items.filter((s) => s.status === "DELIVERED").length,
        failed: items.filter((s) => ["FAILED", "RETURNED"].includes(s.status)).length,
      });
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleTrack = async (shipmentId: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/track`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh tracking");
      toast.success("Tracking refreshed");
      fetchShipments();
    } catch {
      toast.error("Failed to refresh tracking");
    }
  };

  const filtered = shipments.filter(
    (s) =>
      !search ||
      s.shipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesOrder?.soNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.salesOrder?.customer?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <DashboardSidebar>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all outbound shipments and delivery status</p>
        </div>
        <Button variant="outline" onClick={fetchShipments}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Shipments", value: stats.total, icon: <Truck className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
          { label: "In Transit", value: stats.inTransit, icon: <Clock className="h-4 w-4 text-amber-500" />, color: "text-amber-600" },
          { label: "Delivered", value: stats.delivered, icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
          { label: "Issues", value: stats.failed, icon: <AlertCircle className="h-4 w-4 text-red-500" />, color: "text-red-600" },
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
                placeholder="Search by shipment, tracking, order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
              <p>No shipments found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Sales Order</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Est. Delivery</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const cfg = STATUS_CFG[s.status] || { label: s.status, variant: "outline" as const, color: "" };
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium text-sm">{s.shipmentNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{s.salesOrder?.soNumber}</p>
                          <p className="text-xs text-muted-foreground">{s.salesOrder?.customer?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.carrierCode || "—"}</p>
                          <p className="text-xs text-muted-foreground">{s.carrierService}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.trackingNumber ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs">{s.trackingNumber}</span>
                            {s.trackingUrl && (
                              <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 text-blue-500" />
                              </a>
                            )}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.city || s.country ? (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {[s.city, s.country].filter(Boolean).join(", ")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(s.estimatedDelivery)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(s.shippedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleTrack(s.id)}>
                            <RefreshCw className="h-3 w-3 mr-1" />Track
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/shipments/${s.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
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
