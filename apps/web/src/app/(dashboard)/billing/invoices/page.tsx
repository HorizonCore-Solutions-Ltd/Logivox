"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Send,
  CreditCard,
  Eye,
  Settings,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate: string;
  createdAt: string;
  totalAmount: number;
  currency: string;
  customer: { id: string; name: string } | null;
  soNumber: string | null;
  paymentTerms: string | null;
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
  SENT: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Send className="h-3 w-3" />,
  },
  PAID: {
    label: "Paid",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  PARTIALLY_PAID: {
    label: "Partial",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <CreditCard className="h-3 w-3" />,
  },
  OVERDUE: {
    label: "Overdue",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-400 border-gray-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  VOID: {
    label: "Void",
    color: "bg-gray-100 text-gray-400 border-gray-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [totals, setTotals] = useState({
    outstanding: 0,
    overdue: 0,
    paid: 0,
    draft: 0,
    currency: "USD",
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: "20",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/billing/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const list: Invoice[] = data.invoices || [];
      setInvoices(list);
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));

      const now = new Date();
      setTotals({
        outstanding: list
          .filter((i) => ["SENT", "PARTIALLY_PAID"].includes(i.status))
          .reduce((s, i) => s + i.totalAmount, 0),
        overdue: list
          .filter(
            (i) =>
              i.status !== "PAID" &&
              i.status !== "CANCELLED" &&
              new Date(i.dueDate) < now,
          )
          .reduce((s, i) => s + i.totalAmount, 0),
        paid: list
          .filter((i) => i.status === "PAID")
          .reduce((s, i) => s + i.totalAmount, 0),
        draft: list
          .filter((i) => i.status === "DRAFT")
          .reduce((s, i) => s + i.totalAmount, 0),
        currency: list[0]?.currency || "USD",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchInvoices, search]);

  const doAction = async (
    invoiceId: string,
    action: "send" | "mark-paid" | "void",
  ) => {
    setActionLoading(`${invoiceId}-${action}`);
    try {
      const body: Record<string, any> = {};
      if (action === "mark-paid") body.status = "PAID";
      if (action === "void") body.status = "VOID";
      if (action === "send") body.status = "SENT";

      const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast({
        title: "Updated",
        description: `Invoice ${action.replace("-", " ")} successfully.`,
      });
      fetchInvoices();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount,
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isOverdue = (inv: Invoice) =>
    !["PAID", "CANCELLED", "VOID"].includes(inv.status) &&
    new Date(inv.dueDate) < new Date();

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track customer invoices and payment status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/organization/invoice-settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Invoice Settings
              </Button>
            </Link>
            <Link href="/dashboard/sales-orders">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Sales Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Outstanding",
              amount: totals.outstanding,
              icon: <Clock className="h-4 w-4 text-blue-500" />,
              color: "text-blue-700",
            },
            {
              label: "Overdue",
              amount: totals.overdue,
              icon: <AlertCircle className="h-4 w-4 text-red-500" />,
              color: "text-red-700",
            },
            {
              label: "Paid (Page)",
              amount: totals.paid,
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              color: "text-green-700",
            },
            {
              label: "Draft",
              amount: totals.draft,
              icon: <TrendingUp className="h-4 w-4 text-gray-500" />,
              color: "text-gray-700",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.icon}
                </div>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>
                  {formatCurrency(s.amount, totals.currency)}
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
                  placeholder="Search invoices..."
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
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchInvoices}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p>No invoices found</p>
                <p className="text-xs mt-1">
                  Invoices are generated from sales orders
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>SO #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const cfg = STATUS_CONFIG[inv.status] || {
                      label: inv.status,
                      color: "bg-gray-100 text-gray-600",
                      icon: null,
                    };
                    const overdue = isOverdue(inv);
                    return (
                      <TableRow
                        key={inv.id}
                        className={
                          overdue && inv.status !== "OVERDUE"
                            ? "bg-red-50/30"
                            : "hover:bg-muted/50"
                        }
                      >
                        <TableCell className="font-mono font-medium">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>{inv.customer?.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {inv.soNumber ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1 w-fit text-xs border ${cfg.color}`}
                          >
                            {cfg.icon}
                            {overdue && inv.status !== "PAID"
                              ? "Overdue"
                              : cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {inv.paymentTerms ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                        >
                          {formatDate(inv.dueDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(inv.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading?.startsWith(inv.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Actions{" "}
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {inv.status === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => doAction(inv.id, "send")}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Mark as Sent
                                </DropdownMenuItem>
                              )}
                              {["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(
                                inv.status,
                              ) && (
                                <DropdownMenuItem
                                  onClick={() => doAction(inv.id, "mark-paid")}
                                  className="text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {!["VOID", "CANCELLED", "PAID"].includes(
                                inv.status,
                              ) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => doAction(inv.id, "void")}
                                    className="text-muted-foreground"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Void Invoice
                                  </DropdownMenuItem>
                                </>
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

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} (
                  {pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: p.page - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: p.page + 1 }))
                    }
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
