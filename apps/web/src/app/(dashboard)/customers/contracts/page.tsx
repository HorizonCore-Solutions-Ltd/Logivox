"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  CalendarDays,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  currency: string;
  paymentTermsDays: number;
  creditLimit: number | null;
  discountPct: number;
  pricingTier: string | null;
  slaHours: number | null;
  notes: string | null;
  createdAt: string;
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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <Clock className="h-3 w-3" />,
  },
  ACTIVE: {
    label: "Active",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  TERMINATED: {
    label: "Terminated",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  PENDING_RENEWAL: {
    label: "Pending Renewal",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

const CURRENCIES = ["USD", "EUR", "GBP", "ZAR", "AUD", "CAD", "NGN", "KES"];

export default function CustomerContractsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    autoRenew: false,
    currency: "USD",
    paymentTermsDays: 30,
    creditLimit: "",
    discountPct: 0,
    pricingTier: "",
    slaHours: "",
    notes: "",
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers/contracts?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchContracts, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchContracts, search]);

  useEffect(() => {
    fetch("/api/customers?limit=200")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || d || []))
      .catch(() => {});
  }, []);

  const createContract = async () => {
    if (!form.customerId || !form.name || !form.startDate) {
      toast({
        title: "Required fields missing",
        description: "Customer, name, and start date are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
          slaHours: form.slaHours ? Number(form.slaHours) : undefined,
          endDate: form.endDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      toast({
        title: "Contract created",
        description: `${data.contractNumber} created successfully.`,
      });
      setDialogOpen(false);
      fetchContracts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const patchContract = async (id: string, patch: Record<string, any>) => {
    try {
      const res = await fetch(`/api/customers/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast({ title: "Updated", description: "Contract updated." });
      fetchContracts();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatCurrency = (n: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  // Summary metrics
  const active = contracts.filter((c) => c.status === "ACTIVE").length;
  const expiringSoon = contracts.filter((c) => {
    if (!c.endDate || c.status !== "ACTIVE") return false;
    const diff =
      (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  }).length;

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customer Contracts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage pricing agreements, SLAs, credit limits, and payment terms
              per customer
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Customer Contract</DialogTitle>
                <DialogDescription>
                  Set pricing, SLA, credit terms, and discounts for this
                  customer relationship.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={form.customerId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, customerId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Contract Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Annual Preferred Pricing 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
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
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms (Net Days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={form.paymentTermsDays}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        paymentTermsDays: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit Limit</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.creditLimit}
                    placeholder="Unlimited"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, creditLimit: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.discountPct}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discountPct: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Tier</Label>
                  <Input
                    value={form.pricingTier}
                    placeholder="STANDARD / PREMIUM / VIP"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pricingTier: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SLA (Order-to-Ship Hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.slaHours}
                    placeholder="e.g. 24"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slaHours: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    rows={3}
                    placeholder="Any special terms or conditions..."
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createContract} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Contract
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Contracts",
              value: contracts.length,
              icon: <FileText className="h-4 w-4 text-blue-500" />,
              color: "text-blue-700",
            },
            {
              label: "Active",
              value: active,
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              color: "text-green-700",
            },
            {
              label: "Expiring ≤30 Days",
              value: expiringSoon,
              icon: <CalendarDays className="h-4 w-4 text-amber-500" />,
              color: "text-amber-700",
            },
            {
              label: "Customers Covered",
              value: new Set(
                contracts
                  .filter((c) => c.status === "ACTIVE")
                  .map((c) => c.customer.id),
              ).size,
              icon: <Users className="h-4 w-4 text-purple-500" />,
              color: "text-purple-700",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.icon}
                </div>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
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
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchContracts}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading contracts...
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p>No contracts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const cfg = STATUS_CONFIG[c.status] || {
                      label: c.status,
                      color: "bg-gray-100 text-gray-600",
                      icon: null,
                    };
                    const daysLeft = c.endDate
                      ? Math.ceil(
                          (new Date(c.endDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : null;
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-medium">
                          {c.contractNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {c.customer.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {c.customer.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">
                          {c.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1 w-fit text-xs border ${cfg.color}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.pricingTier ? (
                            <Badge variant="outline" className="text-xs">
                              {c.pricingTier}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.discountPct > 0 ? (
                            <span className="text-green-700 font-medium">
                              {c.discountPct}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.creditLimit ? (
                            <div>
                              <p className="font-medium">
                                {formatCurrency(c.creditLimit, c.currency)}
                              </p>
                              {c.customer.creditHold && (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs border">
                                  On Hold
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "Unlimited"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Net {c.paymentTermsDays}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.slaHours ? `${c.slaHours}h` : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.endDate ? (
                            <span
                              className={
                                daysLeft !== null &&
                                daysLeft <= 30 &&
                                daysLeft > 0
                                  ? "text-amber-600 font-medium"
                                  : daysLeft !== null && daysLeft <= 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }
                            >
                              {formatDate(c.endDate)}
                              {daysLeft !== null &&
                                daysLeft <= 30 &&
                                daysLeft > 0 &&
                                ` (${daysLeft}d)`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Open-ended
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {c.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    patchContract(c.id, { status: "ACTIVE" })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {c.status === "ACTIVE" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      patchContract(c.id, {
                                        status: "SUSPENDED",
                                      })
                                    }
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                                    Suspend
                                  </DropdownMenuItem>
                                  {c.endDate && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        patchContract(c.id, {
                                          status: "PENDING_RENEWAL",
                                          autoRenew: true,
                                        })
                                      }
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2 text-blue-500" />
                                      Flag for Renewal
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {[
                                "EXPIRED",
                                "PENDING_RENEWAL",
                                "SUSPENDED",
                              ].includes(c.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    patchContract(c.id, { status: "ACTIVE" })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {!["TERMINATED", "CANCELLED"].includes(
                                c.status,
                              ) && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    patchContract(c.id, {
                                      status: "TERMINATED",
                                    })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Terminate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
