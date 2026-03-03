"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Plus,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";

type ReportType =
  | "INSPECTION_SUMMARY"
  | "NCR_SUMMARY"
  | "SUPPLIER_QUALITY"
  | "CALIBRATION_STATUS"
  | "FMEA_RISK"
  | "AUDIT_FINDINGS"
  | "CAPA_STATUS"
  | "QUALITY_TREND";

interface QCReport {
  id: string;
  reportNumber: string;
  title: string;
  type: ReportType;
  status: "DRAFT" | "GENERATING" | "READY" | "FAILED";
  generatedAt: string | null;
  createdAt: string;
  createdBy: string;
  format: "PDF" | "XLSX" | "CSV";
  fileSizeKb: number | null;
}

const MOCK: QCReport[] = [
  {
    id: "1",
    reportNumber: "RPT-2026-0041",
    title: "February 2026 Inspection Summary",
    type: "INSPECTION_SUMMARY",
    status: "READY",
    generatedAt: "2026-03-01T08:00:00Z",
    createdAt: "2026-03-01T07:50:00Z",
    createdBy: "Quality Manager",
    format: "PDF",
    fileSizeKb: 284,
  },
  {
    id: "2",
    reportNumber: "RPT-2026-0040",
    title: "Q1 2026 Supplier Quality Scorecard",
    type: "SUPPLIER_QUALITY",
    status: "READY",
    generatedAt: "2026-03-01T07:15:00Z",
    createdAt: "2026-03-01T07:10:00Z",
    createdBy: "Supplier QE",
    format: "XLSX",
    fileSizeKb: 142,
  },
  {
    id: "3",
    reportNumber: "RPT-2026-0039",
    title: "Open NCR Status Report — Week 9",
    type: "NCR_SUMMARY",
    status: "READY",
    generatedAt: "2026-02-28T16:00:00Z",
    createdAt: "2026-02-28T15:55:00Z",
    createdBy: "QC Inspector",
    format: "PDF",
    fileSizeKb: 98,
  },
  {
    id: "4",
    reportNumber: "RPT-2026-0038",
    title: "Calibration Compliance — March 2026",
    type: "CALIBRATION_STATUS",
    status: "GENERATING",
    generatedAt: null,
    createdAt: "2026-03-02T06:30:00Z",
    createdBy: "Metrology Lead",
    format: "PDF",
    fileSizeKb: null,
  },
  {
    id: "5",
    reportNumber: "RPT-2026-0037",
    title: "FMEA High-Risk Items Export",
    type: "FMEA_RISK",
    status: "READY",
    generatedAt: "2026-02-27T12:00:00Z",
    createdAt: "2026-02-27T11:50:00Z",
    createdBy: "Process Engineer",
    format: "XLSX",
    fileSizeKb: 211,
  },
];

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "INSPECTION_SUMMARY", label: "Inspection Summary" },
  { value: "NCR_SUMMARY", label: "NCR Summary" },
  { value: "SUPPLIER_QUALITY", label: "Supplier Quality" },
  { value: "CALIBRATION_STATUS", label: "Calibration Status" },
  { value: "FMEA_RISK", label: "FMEA Risk" },
  { value: "AUDIT_FINDINGS", label: "Audit Findings" },
  { value: "CAPA_STATUS", label: "CAPA Status" },
  { value: "QUALITY_TREND", label: "Quality Trend" },
];

const STATUS_STYLES: Record<QCReport["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  GENERATING: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-600",
};

const FORMAT_STYLES: Record<QCReport["format"], string> = {
  PDF: "bg-red-50 text-red-700",
  XLSX: "bg-emerald-50 text-emerald-700",
  CSV: "bg-yellow-50 text-yellow-700",
};

export default function QCReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<QCReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newReportType, setNewReportType] =
    useState<ReportType>("INSPECTION_SUMMARY");
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportFormat, setNewReportFormat] = useState<
    "PDF" | "XLSX" | "CSV"
  >("PDF");

  useEffect(() => {
    loadReports();
  }, [typeFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/qc/reports?${params}`);
      const data = await res.json();
      setReports(
        Array.isArray(data.reports ?? data) ? (data.reports ?? data) : MOCK,
      );
    } catch {
      setReports(MOCK);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!newReportTitle.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/qc/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newReportType,
          title: newReportTitle,
          format: newReportFormat,
        }),
      });
      if (res.ok) {
        setShowGenerateModal(false);
        setNewReportTitle("");
        loadReports();
      }
    } catch {
      // fall through
    } finally {
      setGenerating(false);
    }
  };

  const filtered =
    typeFilter === "all"
      ? reports
      : reports.filter((r) => r.type === typeFilter);
  const ready = reports.filter((r) => r.status === "READY").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/qc")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> QC
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-7 w-7 text-indigo-600" />
                QC Reports
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Generate and export quality reports
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowGenerateModal(true)}>
              <Plus className="h-4 w-4 mr-1" /> Generate Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {reports.length}
              </p>
              <p className="text-xs text-gray-500 uppercase mt-1">
                Total Reports
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold text-green-600">{ready}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">
                Ready to Download
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {reports.filter((r) => r.status === "GENERATING").length}
              </p>
              <p className="text-xs text-gray-500 uppercase mt-1">Generating</p>
            </CardContent>
          </Card>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            All
          </Button>
          {REPORT_TYPES.map((rt) => (
            <Button
              key={rt.value}
              variant={typeFilter === rt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(rt.value)}
            >
              {rt.label}
            </Button>
          ))}
        </div>

        {/* Report List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No reports found.
                </CardContent>
              </Card>
            ) : (
              filtered.map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">
                            {report.reportNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status]}`}
                          >
                            {report.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${FORMAT_STYLES[report.format]}`}
                          >
                            {report.format}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 mt-1 truncate">
                          {report.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {
                            REPORT_TYPES.find((rt) => rt.value === report.type)
                              ?.label
                          }{" "}
                          ·{" "}
                          {report.generatedAt
                            ? `Generated ${new Date(report.generatedAt).toLocaleDateString()}`
                            : `Requested ${new Date(report.createdAt).toLocaleDateString()}`}{" "}
                          · by {report.createdBy}
                          {report.fileSizeKb && ` · ${report.fileSizeKb} KB`}
                        </p>
                      </div>
                      {report.status === "READY" && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`/api/qc/reports/${report.id}?download=true`}
                            download
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </a>
                        </Button>
                      )}
                      {report.status === "GENERATING" && (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Generate New Report
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., March 2026 Inspection Summary"
                    value={newReportTitle}
                    onChange={(e) => setNewReportTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newReportType}
                    onChange={(e) =>
                      setNewReportType(e.target.value as ReportType)
                    }
                  >
                    {REPORT_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <div className="flex gap-2">
                    {(["PDF", "XLSX", "CSV"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setNewReportFormat(fmt)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${newReportFormat === fmt ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={generating || !newReportTitle.trim()}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />{" "}
                      Generating…
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
