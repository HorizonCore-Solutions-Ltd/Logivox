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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  ChevronDown,
  Search,
  Clock,
  TrendingUp,
  XCircle,
  Eye,
  Shield,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface ExceptionRecord {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  resourceType: string;
  resourceRef: string | null;
  detectedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  slaBreachAt: string | null;
}

interface SummaryItem {
  severity: string;
  status: string;
  _count: number;
}

const SEVERITY_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  CRITICAL: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
    label: "Critical",
  },
  HIGH: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "High",
  },
  MEDIUM: {
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Medium",
  },
  LOW: {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Low",
  },
  INFO: {
    color: "bg-gray-100 text-gray-600 border-gray-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Info",
  },
};

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  OPEN: {
    color: "bg-red-50 text-red-700 border-red-200",
    label: "Open",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  ACKNOWLEDGED: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Acknowledged",
    icon: <Eye className="h-3 w-3" />,
  },
  RESOLVED: {
    color: "bg-green-50 text-green-700 border-green-200",
    label: "Resolved",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ESCALATED: {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    label: "Escalated",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  SUPPRESSED: {
    color: "bg-gray-50 text-gray-500 border-gray-200",
    label: "Suppressed",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const TYPE_LABELS: Record<string, string> = {
  DELAYED_ORDER: "Delayed Order",
  SLA_BREACH: "SLA Breach",
  STOCKOUT: "Stockout",
  LOW_STOCK: "Low Stock",
  OVERDUE_INVOICE: "Overdue Invoice",
  OVERDUE_SHIPMENT: "Overdue Shipment",
  CREDIT_LIMIT_EXCEEDED: "Credit Limit Exceeded",
  PICKING_ERROR: "Picking Error",
  RECEIVING_DISCREPANCY: "Receiving Discrepancy",
  SYSTEM: "System",
};

export default function ExceptionsPage() {
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  // Resolve dialog state
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: "", title: "" });
  const [resolution, setResolution] = useState("");

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: "50",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);

      const res = await fetch(`/api/exceptions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExceptions(
        (data.exceptions || []).filter(
          (e: ExceptionRecord) =>
            !search ||
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.type.toLowerCase().includes(search.toLowerCase()),
        ),
      );
      setSummary(data.summary || []);
      setPagination((p) => ({
        ...p,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, severityFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchExceptions, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchExceptions]);

  const runAutoDetect = async () => {
    setDetecting(true);
    try {
      const res = await fetch("/api/exceptions/auto-detect", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-detect failed");
      toast({
        title: "Auto-detect complete",
        description: `${data.detected} exceptions found, ${data.resolved} auto-resolved.`,
      });
      fetchExceptions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  const doAction = async (
    id: string,
    action: "ACKNOWLEDGE" | "RESOLVE" | "ESCALATE" | "SUPPRESS",
    res?: string,
  ) => {
    setActionLoading(`${id}-${action}`);
    try {
      const response = await fetch(`/api/exceptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution: res }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      toast({
        title: "Updated",
        description: `Exception ${action.toLowerCase()}d.`,
      });
      fetchExceptions();
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

  // Summary calculations
  const openCritical = summary
    .filter((s) => s.severity === "CRITICAL" && s.status === "OPEN")
    .reduce((a, b) => a + b._count, 0);
  const openHigh = summary
    .filter((s) => s.severity === "HIGH" && s.status === "OPEN")
    .reduce((a, b) => a + b._count, 0);
  const totalOpen = summary
    .filter((s) => s.status === "OPEN")
    .reduce((a, b) => a + b._count, 0);
  const totalResolved = summary
    .filter((s) => s.status === "RESOLVED")
    .reduce((a, b) => a + b._count, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const isBreaching = (e: ExceptionRecord) =>
    e.slaBreachAt && new Date(e.slaBreachAt) < new Date();

  return (
    <DashboardSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exception Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor, triage, and resolve operational exceptions in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchExceptions} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={runAutoDetect} disabled={detecting} size="sm">
              {detecting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Auto-Detect
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Critical Open</p>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {openCritical}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Requires immediate action
              </p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">High Open</p>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {openHigh}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Action required today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Total Open</p>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {totalOpen}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Across all severities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Resolved</p>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {totalResolved}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Successfully closed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exceptions..."
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
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  <SelectItem value="ESCALATED">Escalated</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="SUPPRESSED">Suppressed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Scanning for exceptions...
              </div>
            ) : exceptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Shield className="h-10 w-10 mb-3 text-green-400" />
                <p className="font-medium">No exceptions found</p>
                <p className="text-xs mt-1">
                  Run Auto-Detect to scan for new issues
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Severity</TableHead>
                    <TableHead>Exception</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>SLA Breach</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.map((exc) => {
                    const sev =
                      SEVERITY_CONFIG[exc.severity] ?? SEVERITY_CONFIG.INFO;
                    const stat =
                      STATUS_CONFIG[exc.status] ?? STATUS_CONFIG.OPEN;
                    const breaching = isBreaching(exc);
                    return (
                      <TableRow
                        key={exc.id}
                        className={`hover:bg-muted/40 ${exc.severity === "CRITICAL" && exc.status === "OPEN" ? "bg-red-50/40" : ""}`}
                      >
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1 w-fit text-xs border ${sev.color}`}
                          >
                            {sev.icon}
                            {sev.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{exc.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {exc.description}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {TYPE_LABELS[exc.type] ?? exc.type}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-mono">
                            {exc.resourceType}
                          </p>
                          {exc.resourceRef && (
                            <p className="text-xs text-muted-foreground">
                              {exc.resourceRef}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1 w-fit text-xs border ${stat.color}`}
                          >
                            {stat.icon}
                            {stat.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(exc.detectedAt)}
                        </TableCell>
                        <TableCell>
                          {exc.slaBreachAt ? (
                            <span
                              className={`text-xs font-medium ${breaching ? "text-red-600" : "text-amber-600"}`}
                            >
                              {breaching
                                ? "⚠ Breached"
                                : formatDate(exc.slaBreachAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  !!actionLoading?.startsWith(exc.id) ||
                                  ["RESOLVED", "SUPPRESSED"].includes(
                                    exc.status,
                                  )
                                }
                              >
                                Action <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {exc.status === "OPEN" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    doAction(exc.id, "ACKNOWLEDGE")
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Acknowledge
                                </DropdownMenuItem>
                              )}
                              {["OPEN", "ACKNOWLEDGED"].includes(
                                exc.status,
                              ) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setResolveDialog({
                                      open: true,
                                      id: exc.id,
                                      title: exc.title,
                                    });
                                    setResolution("");
                                  }}
                                  className="text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Resolve
                                </DropdownMenuItem>
                              )}
                              {["OPEN", "ACKNOWLEDGED"].includes(
                                exc.status,
                              ) && (
                                <DropdownMenuItem
                                  onClick={() => doAction(exc.id, "ESCALATE")}
                                  className="text-purple-700"
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Escalate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => doAction(exc.id, "SUPPRESS")}
                                className="text-muted-foreground"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suppress
                              </DropdownMenuItem>
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

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialog.open}
        onOpenChange={(o) => setResolveDialog((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Exception</DialogTitle>
            <DialogDescription>{resolveDialog.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Resolution notes</Label>
            <Textarea
              placeholder="Describe how this exception was resolved..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialog((d) => ({ ...d, open: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                doAction(
                  resolveDialog.id,
                  "RESOLVE",
                  resolution || "Manually resolved",
                );
                setResolveDialog((d) => ({ ...d, open: false }));
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardSidebar>
  );
}
