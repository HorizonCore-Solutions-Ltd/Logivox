"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  RefreshCw, Plus, FileText, CreditCard, AlertTriangle, CheckCircle,
  Clock, Users, DollarSign, ShieldAlert,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  discountPct: number;
  paymentTermsDays: number;
  creditLimit: number | null;
  pricingTier: string | null;
  slaHours: number | null;
  autoRenew: boolean;
  currency: string;
  customer: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    creditLimit: number | null;
    creditUsed: number | null;
    creditHold: boolean;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
  EXPIRED: { label: "Expired", color: "bg-orange-100 text-orange-800" },
  TERMINATED: { label: "Terminated", color: "bg-red-100 text-red-800" },
  SUSPENDED: { label: "Suspended", color: "bg-yellow-100 text-yellow-800" },
};

export default function CustomerContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [checkingCredit, setCheckingCredit] = useState<string | null>(null);
  const [creditResult, setCreditResult] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ active: 0, expiringSoon: 0, onHold: 0, totalCustomers: 0 });

  const [form, setForm] = useState({
    customerId: "", name: "", description: "", startDate: "",
    endDate: "", autoRenew: false, currency: "USD", paymentTermsDays: 30,
    creditLimit: "", discountPct: 0, pricingTier: "", slaHours: "", notes: "",
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/customers/contracts?${params}`);
      const data = await res.json();
      const list: Contract[] = data.contracts || [];
      setContracts(list);
      const now = new Date();
      const in30 = new Date(); in30.setDate(now.getDate() + 30);
      setStats({
        active: list.filter((c) => c.status === "ACTIVE").length,
        expiringSoon: list.filter((c) => c.status === "ACTIVE" && c.endDate && new Date(c.endDate) < in30).length,
        onHold: list.filter((c) => c.customer.creditHold).length,
        totalCustomers: new Set(list.map((c) => c.customer.id)).size,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const createContract = async () => {
    setCreating(true);
    try {
      const body: any = { ...form };
      if (form.creditLimit) body.creditLimit = Number(form.creditLimit);
      if (form.slaHours) body.slaHours = Number(form.slaHours);
      if (!form.endDate) delete body.endDate;
      if (!form.pricingTier) delete body.pricingTier;
      body.discountPct = Number(form.discountPct);
      body.paymentTermsDays = Number(form.paymentTermsDays);

      const res = await fetch("/api/customers/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Contract created", description: data.contract?.contractNumber });
      setShowCreate(false);
      setForm({ customerId: "", name: "", description: "", startDate: "", endDate: "", autoRenew: false, currency: "USD", paymentTermsDays: 30, creditLimit: "", discountPct: 0, pricingTier: "", slaHours: "", notes: "" });
      fetchContracts();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const runCreditCheck = async (customerId: string) => {
    setCheckingCredit(customerId);
    setCreditResult(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/credit-check`, { method: "POST" });
      const data = await res.json();
      setCreditResult(data);
      toast({
        title: data.approved ? "Credit Approved" : "Credit Check Failed",
        description: data.message,
        variant: data.approved ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Credit check error", description: err.message, variant: "destructive" });
    } finally {
      setCheckingCredit(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmt = (n: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);

  const isExpiringSoon = (c: Contract) => {
    if (!c.endDate || c.status !== "ACTIVE") return false;
    const diff = new Date(c.endDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 3600 * 1000;
  };

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customer Contracts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage customer pricing contracts, credit limits, and payment terms
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchContracts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Contract</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Customer Contract</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="col-span-2 space-y-1">
                    <Label>Customer ID</Label>
                    <Input value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} placeholder="Customer ID" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Contract Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Annual Service Agreement 2026" />
                  </div>
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment Terms (days)</Label>
                    <Input type="number" min={0} value={form.paymentTermsDays} onChange={(e) => setForm((f) => ({ ...f, paymentTermsDays: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Discount (%)</Label>
                    <Input type="number" min={0} max={100} step={0.1} value={form.discountPct} onChange={(e) => setForm((f) => ({ ...f, discountPct: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Credit Limit</Label>
                    <Input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="space-y-1">
                    <Label>SLA Hours</Label>
                    <Input type="number" min={1} value={form.slaHours} onChange={(e) => setForm((f) => ({ ...f, slaHours: e.target.value }))} placeholder="e.g. 24" />
                  </div>
                  <div className="space-y-1">
                    <Label>Pricing Tier</Label>
                    <Input value={form.pricingTier} onChange={(e) => setForm((f) => ({ ...f, pricingTier: e.target.value }))} placeholder="GOLD / SILVER (optional)" />
                  </div>
                  <div className="space-y-1">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["USD","EUR","GBP","ZAR","AUD"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Auto-renew</p>
                      <p className="text-xs text-muted-foreground">Automatically renew when contract expires</p>
                    </div>
                    <Switch checked={form.autoRenew} onCheckedChange={(v) => setForm((f) => ({ ...f, autoRenew: v }))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={createContract} disabled={creating || !form.customerId || !form.name || !form.startDate}>
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Contracts", value: stats.active, icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
            { label: "Expiring (30d)", value: stats.expiringSoon, icon: <Clock className="h-4 w-4 text-amber-500" />, color: "text-amber-600" },
            { label: "Credit Hold", value: stats.onHold, icon: <ShieldAlert className="h-4 w-4 text-red-500" />, color: "text-red-600" },
            { label: "Customers", value: stats.totalCustomers, icon: <Users className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.icon}
                </div>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading contracts...
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p>No contracts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const sc = STATUS_CONFIG[c.status] || { label: c.status, color: "bg-gray-100 text-gray-600" };
                    const expiring = isExpiringSoon(c);
                    const creditRatio = c.customer.creditLimit && c.customer.creditUsed
                      ? (Number(c.customer.creditUsed) / Number(c.customer.creditLimit)) * 100
                      : null;
                    return (
                      <TableRow key={c.id} className={`hover:bg-muted/50 ${c.customer.creditHold ? "bg-red-50/30" : ""}`}>
                        <TableCell className="font-mono text-sm font-medium">{c.contractNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.customer.name}</p>
                            <p className="text-xs text-muted-foreground">{c.customer.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={`text-xs ${sc.color} w-fit`}>{sc.label}</Badge>
                            {c.customer.creditHold && (
                              <Badge className="text-xs bg-red-100 text-red-800 w-fit">
                                <ShieldAlert className="h-3 w-3 mr-1" />Hold
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.discountPct > 0 ? `${c.discountPct}%` : "—"}</TableCell>
                        <TableCell className="text-sm">Net {c.paymentTermsDays}</TableCell>
                        <TableCell>
                          {c.customer.creditLimit ? (
                            <div>
                              <p className="text-xs font-mono">
                                {fmt(Number(c.customer.creditUsed ?? 0), c.currency)} / {fmt(Number(c.customer.creditLimit), c.currency)}
                              </p>
                              {creditRatio !== null && (
                                <div className="w-20 h-1.5 bg-gray-200 rounded mt-1">
                                  <div
                                    className={`h-1.5 rounded ${creditRatio > 90 ? "bg-red-500" : creditRatio > 70 ? "bg-amber-500" : "bg-green-500"}`}
                                    style={{ width: `${Math.min(creditRatio, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground text-xs">Unlimited</span>}
                        </TableCell>
                        <TableCell className="text-sm">{c.slaHours ? `${c.slaHours}h` : "—"}</TableCell>
                        <TableCell>
                          {c.endDate ? (
                            <span className={`text-sm ${expiring ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                              {expiring && <Clock className="h-3 w-3 inline mr-1" />}
                              {formatDate(c.endDate)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{c.autoRenew ? "Auto-renew" : "No expiry"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runCreditCheck(c.customer.id)}
                            disabled={checkingCredit === c.customer.id}
                          >
                            {checkingCredit === c.customer.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CreditCard className="h-3 w-3 mr-1" />
                            )}
                            Credit Check
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
