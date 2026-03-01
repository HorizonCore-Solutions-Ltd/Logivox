"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ShieldCheck,
  Plus,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart2,
  Download,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ComplianceReport {
  id: string;
  reportNumber: string;
  reportType: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
  summary: string;
  publishedAt: string | null;
}

const STATUS_CFG: Record<string, { color: string; icon: typeof CheckCircle2 }> =
  {
    DRAFT: { color: "bg-gray-100 text-gray-700", icon: FileText },
    PENDING: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    PUBLISHED: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    ARCHIVED: { color: "bg-slate-100 text-slate-600", icon: FileText },
  };

const REPORT_TYPES = [
  { value: "DAILY_SUMMARY", label: "Daily Summary" },
  { value: "WEEKLY_SUMMARY", label: "Weekly Summary" },
  { value: "MONTHLY_SUMMARY", label: "Monthly Summary" },
  { value: "VENDOR_COMPLIANCE", label: "Vendor Compliance" },
  { value: "SECURITY_AUDIT", label: "Security Audit" },
  { value: "CUSTOM", label: "Custom Range" },
];

const blankForm = {
  reportType: "MONTHLY_SUMMARY",
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10),
  periodEnd: new Date().toISOString().slice(0, 10),
  title: "",
  recipientEmails: "",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ComplianceAutomationPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Summary stats
  const total = reports.length;
  const published = reports.filter((r) => r.status === "PUBLISHED").length;
  const drafts = reports.filter((r) => r.status === "DRAFT").length;
  const thisMonth = reports.filter((r) => {
    const d = new Date(r.generatedAt);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (typeFilter !== "ALL") params.append("reportType", typeFilter);
      const res = await fetch(`/api/compliance/reports?${params}`);
      if (!res.ok) throw new Error();
      const { reports: data } = await res.json();
      setReports(data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Apply period preset ──────────────────────────────────────────────────

  const applyPreset = (type: string) => {
    const now = new Date();
    let start: Date;
    let end = now;
    if (type === "DAILY_SUMMARY") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    } else if (type === "WEEKLY_SUMMARY") {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
    } else if (type === "MONTHLY_SUMMARY" || type === "VENDOR_COMPLIANCE") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === "SECURITY_AUDIT") {
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else {
      return; // CUSTOM — don't change
    }
    setForm((f) => ({
      ...f,
      reportType: type,
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
    }));
  };

  // ── Generate ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const payload: Record<string, unknown> = {
        reportType: form.reportType,
        periodStart: new Date(form.periodStart).toISOString(),
        periodEnd: new Date(form.periodEnd + "T23:59:59").toISOString(),
      };
      if (form.title) payload.title = form.title;
      if (form.recipientEmails) {
        payload.recipientEmails = form.recipientEmails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/compliance/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }

      toast({ title: "Compliance report generated" });
      setDialogOpen(false);
      setForm(blankForm);
      await fetchReports();
    } catch (err) {
      toast({
        title: "Failed to generate report",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/compliance/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          publishedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Report published" });
      await fetchReports();
    } catch {
      toast({ title: "Failed to publish", variant: "destructive" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Compliance Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Auto-generate compliance reports from live operational data — vendor
            checks, NCRs, CAPAs, incidents, and gate activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate Compliance Report</DialogTitle>
                <DialogDescription>
                  Aggregates live data from vendor checks, NCRs, CAPAs, and
                  incidents into a structured report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="cr-type">Report Type</Label>
                  <Select
                    value={form.reportType}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, reportType: v }));
                      applyPreset(v);
                    }}
                  >
                    <SelectTrigger id="cr-type" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cr-start">Period Start</Label>
                    <Input
                      id="cr-start"
                      type="date"
                      className="mt-1"
                      value={form.periodStart}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, periodStart: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cr-end">Period End</Label>
                    <Input
                      id="cr-end"
                      type="date"
                      className="mt-1"
                      value={form.periodEnd}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, periodEnd: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cr-title">Custom Title (optional)</Label>
                  <Input
                    id="cr-title"
                    className="mt-1"
                    placeholder="Leave blank to auto-generate"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cr-emails">
                    Recipient Emails (optional, comma-separated)
                  </Label>
                  <Input
                    id="cr-emails"
                    className="mt-1"
                    placeholder="cso@company.com, legal@company.com"
                    value={form.recipientEmails}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        recipientEmails: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="w-4 h-4" /> Total Reports
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Published
            </div>
            <p className="text-2xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="w-4 h-4 text-gray-500" /> Drafts
            </div>
            <p className="text-2xl font-bold">{drafts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart2 className="w-4 h-4 text-blue-500" /> This Month
            </div>
            <p className="text-2xl font-bold">{thisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-20" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium">No compliance reports yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Click &ldquo;Generate Report&rdquo; to automatically compile a
              compliance report from your live operational data.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.DRAFT;
            const StatusIcon = cfg.icon;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <StatusIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{r.title}</p>
                        <Badge
                          className={`text-xs ${cfg.color}`}
                          variant="outline"
                        >
                          {r.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {r.reportType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.reportNumber} · Generated{" "}
                        {new Date(r.generatedAt).toLocaleString()} · Period:{" "}
                        {new Date(r.periodStart).toLocaleDateString()} –{" "}
                        {new Date(r.periodEnd).toLocaleDateString()}
                      </p>

                      {expandedId === r.id && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t pt-2">
                          {r.summary}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedId(expandedId === r.id ? null : r.id)
                        }
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {r.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(r.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Publish
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
