"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileText,
  TrendingUp,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditFinding {
  id: string;
  findingNumber: string;
  severity: "MAJOR" | "MINOR" | "OBSERVATION";
  status: "OPEN" | "CAPA_ASSIGNED" | "PENDING_VERIFICATION" | "VERIFIED" | "CLOSED";
  clause?: string;
  category?: string;
  description: string;
}

interface Audit {
  id: string;
  auditNumber: string;
  type: "INTERNAL" | "SUPPLIER" | "CUSTOMER" | "REGULATORY" | "CERTIFICATION";
  scope: string;
  standard?: string;
  auditDate: string;
  location?: string;
  auditorName: string;
  auditorOrg?: string;
  auditeeName?: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "REPORT_ISSUED" | "CLOSED";
  summary?: string;
  recommendations?: string;
  findings: AuditFinding[];
}

interface AuditMetrics {
  totalAudits: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  completionRate: number;
  totalFindings: number;
  findingsBySeverity: { MAJOR: number; MINOR: number; OBSERVATION: number };
  findingsByStatus: Record<string, number>;
  closureRate: number;
  openMajorFindings: number;
  period: { start: string; end: string };
}

interface ScheduleData {
  overdue: Audit[];
  upcoming: Audit[];
  recentlyClosed: Audit[];
  summary: { overdueCount: number; upcomingCount: number; recentlyClosedCount: number };
}

// ─── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_AUDITS: Audit[] = [
  { id: "A1", auditNumber: "AUD-001", type: "INTERNAL", scope: "Warehouse Operations — Zone A", standard: "ISO 9001:2015", auditDate: new Date(Date.now() - 7 * 86400000).toISOString(), location: "Site Alpha", auditorName: "Sarah Mitchell", auditorOrg: "Internal QA", auditeeName: "Ops Team", status: "REPORT_ISSUED", summary: "Minor process deviations found in putaway procedures.", findings: [{ id: "F1", findingNumber: "AUD-001-F001", severity: "MINOR", status: "CAPA_ASSIGNED", clause: "8.5.1", category: "Process Control", description: "Putaway confirmation steps not consistently followed." }, { id: "F2", findingNumber: "AUD-001-F002", severity: "OBSERVATION", status: "OPEN", clause: "7.5.3", category: "Documentation", description: "Label records not archived within SLA window." }] },
  { id: "A2", auditNumber: "AUD-002", type: "SUPPLIER", scope: "Supplier Quality — Acme Packaging", standard: "ISO 9001:2015", auditDate: new Date(Date.now() - 14 * 86400000).toISOString(), location: "Supplier Site", auditorName: "James Okafor", auditorOrg: "Procurement QA", status: "COMPLETED", findings: [{ id: "F3", findingNumber: "AUD-002-F001", severity: "MAJOR", status: "OPEN", clause: "4.4.1", category: "Process Compliance", description: "Critical process step omitted in packaging line—product integrity risk." }] },
  { id: "A3", auditNumber: "AUD-003", type: "REGULATORY", scope: "Food Safety Compliance", standard: "FSMA", auditDate: new Date(Date.now() - 2 * 86400000).toISOString(), location: "Cold Store B", auditorName: "FDA Inspector", status: "IN_PROGRESS", findings: [] },
  { id: "A4", auditNumber: "AUD-004", type: "INTERNAL", scope: "Returns Processing", standard: "ISO 9001:2015", auditDate: new Date(Date.now() + 5 * 86400000).toISOString(), location: "Returns Area", auditorName: "Priya Nair", status: "PLANNED", findings: [] },
  { id: "A5", auditNumber: "AUD-005", type: "CERTIFICATION", scope: "ISO 45001 Recertification", standard: "ISO 45001:2018", auditDate: new Date(Date.now() - 28 * 86400000).toISOString(), location: "HQ", auditorName: "BSI Certifying Body", status: "CLOSED", findings: [{ id: "F4", findingNumber: "AUD-005-F001", severity: "MINOR", status: "CLOSED", clause: "6.1.2.3", category: "Risk Assessment", description: "Hazard register not reviewed within required annual cycle." }] },
];

const DEMO_METRICS: AuditMetrics = {
  totalAudits: 5,
  byStatus: { PLANNED: 1, IN_PROGRESS: 1, COMPLETED: 1, REPORT_ISSUED: 1, CLOSED: 1 },
  byType: { INTERNAL: 2, SUPPLIER: 1, CUSTOMER: 0, REGULATORY: 1, CERTIFICATION: 1 },
  completionRate: 60,
  totalFindings: 4,
  findingsBySeverity: { MAJOR: 1, MINOR: 2, OBSERVATION: 1 },
  findingsByStatus: { OPEN: 2, CAPA_ASSIGNED: 1, PENDING_VERIFICATION: 0, VERIFIED: 0, CLOSED: 1 },
  closureRate: 25,
  openMajorFindings: 1,
  period: { start: new Date(Date.now() - 90 * 86400000).toISOString(), end: new Date().toISOString() },
};

// ─── Config ────────────────────────────────────────────────────────────────────

const AUDIT_STATUS_CFG: Record<string, { badge: string; label: string; dot: string }> = {
  PLANNED: { badge: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-400", label: "Planned" },
  IN_PROGRESS: { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", dot: "bg-yellow-400 animate-pulse", label: "In Progress" },
  COMPLETED: { badge: "bg-teal-100 text-teal-800 border-teal-300", dot: "bg-teal-500", label: "Completed" },
  REPORT_ISSUED: { badge: "bg-violet-100 text-violet-800 border-violet-300", dot: "bg-violet-500", label: "Report Issued" },
  CLOSED: { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", label: "Closed" },
};

const FINDING_SEVERITY_CFG = {
  MAJOR: { badge: "bg-red-100 text-red-800 border-red-300", color: "#ef4444" },
  MINOR: { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", color: "#f59e0b" },
  OBSERVATION: { badge: "bg-blue-100 text-blue-800 border-blue-300", color: "#3b82f6" },
};

const AUDIT_TYPE_LABEL: Record<string, string> = {
  INTERNAL: "Internal", SUPPLIER: "Supplier", CUSTOMER: "Customer",
  REGULATORY: "Regulatory", CERTIFICATION: "Certification",
};

function timeAgo(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d < 0) return `in ${Math.abs(d)}d`;
  return `${d}d ago`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AuditReportPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "schedule" | "findings">("list");
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [auditsRes, metricsRes, schedRes] = await Promise.all([
        fetch("/api/qc/audits"),
        fetch("/api/qc/audits/metrics"),
        fetch("/api/qc/audits/schedule"),
      ]);
      if (auditsRes.ok) {
        const d = await auditsRes.json();
        if (d.data?.length) setAudits(d.data);
      }
      if (metricsRes.ok) {
        const d = await metricsRes.json();
        if (d.data) setMetrics(d.data);
      }
      if (schedRes.ok) {
        const d = await schedRes.json();
        if (d.data) setSchedule(d.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Use demo data if nothing returned from API
  const dAudits = audits.length > 0 ? audits : DEMO_AUDITS;
  const dMetrics = metrics ?? DEMO_METRICS;
  const dSchedule = schedule ?? {
    overdue: DEMO_AUDITS.filter((a) => a.status === "IN_PROGRESS"),
    upcoming: DEMO_AUDITS.filter((a) => a.status === "PLANNED"),
    recentlyClosed: DEMO_AUDITS.filter((a) => a.status === "CLOSED" || a.status === "REPORT_ISSUED"),
    summary: { overdueCount: 1, upcomingCount: 1, recentlyClosedCount: 2 },
  };

  const allFindings = dAudits.flatMap((a) => a.findings.map((f) => ({ ...f, auditNumber: a.auditNumber, auditType: a.type })));
  const openFindings = allFindings.filter((f) => f.status !== "CLOSED" && f.status !== "VERIFIED");
  const majorOpen = openFindings.filter((f) => f.severity === "MAJOR");

  const severityPieData = [
    { name: "Major", value: dMetrics.findingsBySeverity.MAJOR, fill: "#ef4444" },
    { name: "Minor", value: dMetrics.findingsBySeverity.MINOR, fill: "#f59e0b" },
    { name: "Observation", value: dMetrics.findingsBySeverity.OBSERVATION, fill: "#3b82f6" },
  ];

  const typeBarData = Object.entries(dMetrics.byType)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: AUDIT_TYPE_LABEL[k] ?? k, count: v }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-violet-600" />
            Audit Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Internal · Supplier · Regulatory · Certification audits — findings, schedule &amp; closure tracking
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Alert: Open Major Findings */}
      {majorOpen.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{majorOpen.length} Major Finding{majorOpen.length > 1 ? "s" : ""} Require Immediate Action</p>
            <p className="text-sm text-red-700 mt-0.5">
              {majorOpen.map((f) => `${f.auditNumber} — ${f.findingNumber}`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Audits (90d)</p>
            <p className="text-3xl font-bold">{dMetrics.totalAudits}</p>
            <Progress value={dMetrics.completionRate} className="h-1.5 mt-2" />
            <p className="text-xs text-gray-400 mt-1">{dMetrics.completionRate}% completed</p>
          </CardContent>
        </Card>
        <Card className={dMetrics.openMajorFindings > 0 ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Open Major Findings</p>
            <p className={`text-3xl font-bold ${dMetrics.openMajorFindings > 0 ? "text-red-700" : "text-green-700"}`}>
              {dMetrics.openMajorFindings}
            </p>
            <p className="text-xs text-gray-500 mt-1">{dMetrics.findingsBySeverity.MINOR} minor · {dMetrics.findingsBySeverity.OBSERVATION} obs</p>
          </CardContent>
        </Card>
        <Card className={dMetrics.closureRate >= 80 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Finding Closure Rate</p>
            <p className={`text-3xl font-bold ${dMetrics.closureRate >= 80 ? "text-green-700" : "text-yellow-700"}`}>
              {dMetrics.closureRate}%
            </p>
            <Progress value={dMetrics.closureRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className={dSchedule.summary.overdueCount > 0 ? "border-orange-300 bg-orange-50" : ""}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Overdue Audits</p>
            <p className={`text-3xl font-bold ${dSchedule.summary.overdueCount > 0 ? "text-orange-700" : "text-gray-700"}`}>
              {dSchedule.summary.overdueCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">{dSchedule.summary.upcomingCount} upcoming (30d)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Findings by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={severityPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {severityPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Audits by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["list", "schedule", "findings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "list" ? "All Audits" : tab === "schedule" ? "Schedule" : "Open Findings"}
            {tab === "findings" && openFindings.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{openFindings.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: All Audits */}
      {activeTab === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {["Audit #", "Type", "Scope", "Standard", "Date", "Auditor", "Findings", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dAudits.map((audit) => {
                    const cfg = AUDIT_STATUS_CFG[audit.status];
                    const majorCount = audit.findings.filter((f) => f.severity === "MAJOR" && f.status !== "CLOSED").length;
                    return (
                      <tr key={audit.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{audit.auditNumber}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{AUDIT_TYPE_LABEL[audit.type]}</Badge></td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{audit.scope}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{audit.standard ?? "—"}</td>
                        <td className="px-4 py-3 text-xs">{new Date(audit.auditDate).toLocaleDateString()} <span className="text-gray-400">({timeAgo(audit.auditDate)})</span></td>
                        <td className="px-4 py-3 text-xs">{audit.auditorName}</td>
                        <td className="px-4 py-3">
                          {audit.findings.length > 0 ? (
                            <span className="flex items-center gap-1">
                              {majorCount > 0 && <span className="text-xs font-bold text-red-700">{majorCount}M</span>}
                              <span className="text-xs text-muted-foreground">{audit.findings.length} total</span>
                            </span>
                          ) : <span className="text-xs text-gray-400">None</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <Badge className={`text-xs border ${cfg.badge} px-1.5`}>{cfg.label}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedAudit(selectedAudit?.id === audit.id ? null : audit)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inline detail expand */}
            {selectedAudit && (
              <div className="border-t bg-muted/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedAudit.auditNumber} — {selectedAudit.scope}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAudit(null)}><XCircle className="h-4 w-4" /></Button>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Auditor:</span> {selectedAudit.auditorName}{selectedAudit.auditorOrg ? ` (${selectedAudit.auditorOrg})` : ""}</div>
                  <div><span className="text-muted-foreground">Auditee:</span> {selectedAudit.auditeeName ?? "—"}</div>
                  <div><span className="text-muted-foreground">Location:</span> {selectedAudit.location ?? "—"}</div>
                </div>
                {selectedAudit.summary && <p className="text-sm bg-white border rounded p-3">{selectedAudit.summary}</p>}
                {selectedAudit.recommendations && (
                  <div><p className="text-xs font-semibold text-muted-foreground mb-1">RECOMMENDATIONS</p><p className="text-sm">{selectedAudit.recommendations}</p></div>
                )}
                {selectedAudit.findings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">FINDINGS ({selectedAudit.findings.length})</p>
                    <div className="space-y-2">
                      {selectedAudit.findings.map((f) => (
                        <div key={f.id} className={`rounded-lg border p-3 text-sm ${f.severity === "MAJOR" ? "bg-red-50 border-red-200" : f.severity === "MINOR" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold">{f.findingNumber}</span>
                            <Badge className={`text-xs border ${FINDING_SEVERITY_CFG[f.severity].badge}`}>{f.severity}</Badge>
                            {f.clause && <span className="text-xs text-muted-foreground">Clause {f.clause}</span>}
                            {f.category && <span className="text-xs text-muted-foreground">· {f.category}</span>}
                          </div>
                          <p className="text-sm">{f.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Status: <span className="font-medium">{f.status.replace("_", " ")}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Schedule */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {dSchedule.overdue.length > 0 && (
            <Card className="border-orange-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-4 w-4" /> Overdue ({dSchedule.overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dSchedule.overdue.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-semibold mr-2">{a.auditNumber}</span>
                      <span className="text-muted-foreground">{a.scope}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span><User className="h-3 w-3 inline mr-1" />{a.auditorName}</span>
                      <span className="text-orange-700 font-semibold">{timeAgo(a.auditDate)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {dSchedule.upcoming.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" /> Upcoming (30 days) — {dSchedule.upcoming.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dSchedule.upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-semibold mr-2">{a.auditNumber}</span>
                      <Badge variant="outline" className="text-xs mr-2">{AUDIT_TYPE_LABEL[a.type]}</Badge>
                      <span className="text-muted-foreground">{a.scope}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span><User className="h-3 w-3 inline mr-1" />{a.auditorName}</span>
                      <span className="text-blue-700 font-semibold">{new Date(a.auditDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {dSchedule.recentlyClosed.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Recently Closed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dSchedule.recentlyClosed.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div>
                      <span className="font-mono font-semibold mr-2">{a.auditNumber}</span>
                      <span className="text-muted-foreground">{a.scope}</span>
                    </div>
                    <span className="text-xs text-green-700">{timeAgo(a.auditDate)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Open Findings */}
      {activeTab === "findings" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open Findings ({openFindings.length})</CardTitle>
            <CardDescription>All findings requiring action — sorted by severity</CardDescription>
          </CardHeader>
          <CardContent>
            {openFindings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
                <p className="font-medium">All findings are closed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...openFindings].sort((a, b) => {
                  const order = { MAJOR: 0, MINOR: 1, OBSERVATION: 2 };
                  return order[a.severity] - order[b.severity];
                }).map((f) => (
                  <div key={f.id} className={`rounded-lg border p-4 ${f.severity === "MAJOR" ? "bg-red-50 border-red-300" : f.severity === "MINOR" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold">{f.findingNumber}</span>
                          <Badge className={`text-xs border ${FINDING_SEVERITY_CFG[f.severity].badge}`}>{f.severity}</Badge>
                          <Badge variant="outline" className="text-xs">{AUDIT_TYPE_LABEL[(f as any).auditType] ?? ""}</Badge>
                          {(f as any).clause && <span className="text-xs text-muted-foreground">Clause {(f as any).clause}</span>}
                        </div>
                        <p className="text-sm">{f.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-muted-foreground">{(f as any).auditNumber}</p>
                        <p className="text-xs mt-1">{f.status.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
