"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Plus,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
interface ChargeCode {
  id: string;
  code: string;
  name: string;
  chargeType: string;
  unitLabel: string;
  defaultRate: number;
  currency: string;
  markup: number;
  isActive: boolean;
  _count: { lines: number };
  totalRevenue?: number;
}

interface ChargeLine {
  id: string;
  status: string;
  qty: number;
  rate: number;
  subtotal: number;
  markupAmount: number;
  total: number;
  currency: string;
  billedAt: string | null;
  createdAt: string;
  chargeCode: { code: string; name: string };
  salesOrder?: { soNumber: string } | null;
}

const CHARGE_TYPES = [
  "PER_ORDER",
  "PER_LINE",
  "PER_UNIT",
  "PER_PALLET",
  "PER_KG",
  "PER_CBM",
  "PER_HOUR",
  "PER_DAY",
  "FLAT_FEE",
  "RECURRING_STORAGE",
  "PERCENTAGE",
];

const LINE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  BILLED: { label: "Billed", color: "bg-green-100 text-green-800" },
  VOID: { label: "Void", color: "bg-gray-100 text-gray-500" },
  DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-800" },
};

export default function AccessorialBillingPage() {
  const [codes, setCodes] = useState<ChargeCode[]>([]);
  const [lines, setLines] = useState<ChargeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [lineFilter, setLineFilter] = useState("all");
  const [stats, setStats] = useState({
    totalCodes: 0,
    pendingLines: 0,
    totalRevenue: 0,
    currency: "USD",
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    chargeType: "PER_ORDER",
    unitLabel: "order",
    defaultRate: 0,
    currency: "USD",
    markup: 0,
    minCharge: "",
    maxCharge: "",
    glCode: "",
    isActive: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [codesRes, linesRes] = await Promise.all([
        fetch("/api/billing/accessorial/charge-codes"),
        fetch(
          `/api/billing/accessorial/charge-lines${lineFilter !== "all" ? `?status=${lineFilter}` : ""}`,
        ),
      ]);
      const codesData = await codesRes.json();
      const linesData = await linesRes.json();

      const codeList: ChargeCode[] = codesData.codes || [];
      const lineList: ChargeLine[] = linesData.lines || [];

      setCodes(codeList);
      setLines(lineList);

      const totalRevenue = codeList.reduce(
        (s, c) => s + (c.totalRevenue || 0),
        0,
      );
      setStats({
        totalCodes: codeList.filter((c) => c.isActive).length,
        pendingLines: lineList.filter((l) => l.status === "PENDING").length,
        totalRevenue,
        currency: codeList[0]?.currency || "USD",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lineFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createCode = async () => {
    setCreating(true);
    try {
      const body: any = {
        ...form,
        defaultRate: Number(form.defaultRate),
        markup: Number(form.markup),
      };
      if (form.minCharge) body.minCharge = Number(form.minCharge);
      if (form.maxCharge) body.maxCharge = Number(form.maxCharge);
      if (!form.glCode) delete body.glCode;

      const res = await fetch("/api/billing/accessorial/charge-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast({
        title: "Charge code created",
        description: `[${form.code}] ${form.name}`,
      });
      setShowCreate(false);
      setForm({
        code: "",
        name: "",
        description: "",
        chargeType: "PER_ORDER",
        unitLabel: "order",
        defaultRate: 0,
        currency: "USD",
        markup: 0,
        minCharge: "",
        maxCharge: "",
        glCode: "",
        isActive: true,
      });
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const updateLineStatus = async (lineId: string, status: string) => {
    const res = await fetch(`/api/billing/accessorial/charge-lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: "Updated", description: `Status → ${status}` });
      fetchAll();
    }
  };

  const fmt = (n: number, cur = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(
      n,
    );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accessorial Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Transactional, storage, and special handling charges for 3PL and
              fulfilment customers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Charge Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Charge Code</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="space-y-1">
                    <Label>Code</Label>
                    <Input
                      value={form.code}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="KITTING"
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Kitting Service"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Charge Type</Label>
                    <Select
                      value={form.chargeType}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, chargeType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARGE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Unit Label</Label>
                    <Input
                      value={form.unitLabel}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unitLabel: e.target.value }))
                      }
                      placeholder="order / pallet / kg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Default Rate</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.defaultRate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          defaultRate: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Markup (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={form.markup}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          markup: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Min Charge</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.minCharge}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, minCharge: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Charge</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.maxCharge}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxCharge: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>GL Code</Label>
                    <Input
                      value={form.glCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, glCode: e.target.value }))
                      }
                      placeholder="4001 (optional)"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, currency: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["USD", "EUR", "GBP", "ZAR", "AUD", "CAD"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={2}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createCode}
                    disabled={creating || !form.code || !form.name}
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Active Charge Codes
                </p>
                <Hash className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalCodes}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Pending Lines</p>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {stats.pendingLines}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Total Revenue (Page)
                </p>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {fmt(stats.totalRevenue, stats.currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="codes">
          <TabsList>
            <TabsTrigger value="codes">
              <Hash className="h-3 w-3 mr-1" />
              Charge Codes ({codes.length})
            </TabsTrigger>
            <TabsTrigger value="lines">
              <FileText className="h-3 w-3 mr-1" />
              Charge Lines ({lines.length})
            </TabsTrigger>
          </TabsList>

          {/* Charge Codes */}
          <TabsContent value="codes">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : codes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mb-2 opacity-30" />
                    <p>No charge codes yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Charge Type</TableHead>
                        <TableHead>Default Rate</TableHead>
                        <TableHead>Markup</TableHead>
                        <TableHead>GL Code</TableHead>
                        <TableHead>Lines</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codes.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-bold text-sm">
                            {c.code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {c.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {c.chargeType.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {fmt(c.defaultRate, c.currency)} / {c.unitLabel}
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.markup > 0 ? `${c.markup}%` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {(c as any).glCode || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{c._count.lines}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            {c.totalRevenue
                              ? fmt(c.totalRevenue, c.currency)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                c.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-500"
                              }
                            >
                              {c.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                "Inactive"
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charge Lines */}
          <TabsContent value="lines">
            <div className="flex justify-end mb-3">
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(LINE_STATUS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                {lines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-30" />
                    <p>No charge lines</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Charge Code</TableHead>
                        <TableHead>Sales Order</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Markup</TableHead>
                        <TableHead className="font-bold">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Billed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((l) => {
                        const sc = LINE_STATUS[l.status] || {
                          label: l.status,
                          color: "bg-gray-100 text-gray-600",
                        };
                        return (
                          <TableRow key={l.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-mono text-xs font-bold">
                                  {l.chargeCode.code}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {l.chargeCode.name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {l.salesOrder?.soNumber ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {l.qty}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmt(l.rate, l.currency)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmt(l.subtotal, l.currency)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {l.markupAmount > 0
                                ? `+${fmt(l.markupAmount, l.currency)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="font-semibold font-mono">
                              {fmt(l.total, l.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${sc.color}`}>
                                {sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {l.billedAt
                                ? new Date(l.billedAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {l.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateLineStatus(l.id, "APPROVED")
                                  }
                                >
                                  Approve
                                </Button>
                              )}
                              {l.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    updateLineStatus(l.id, "BILLED")
                                  }
                                >
                                  Bill
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
