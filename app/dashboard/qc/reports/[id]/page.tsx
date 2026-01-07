"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  Download,
  Mail,
  CheckCircle,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface QualityReport {
  id: string;
  reportNumber: string;
  reportName: string;
  reportType: string;
  category: string;
  description?: string;
  generatedBy: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  summary?: string;
  keyFindings?: string;
  recommendations?: string;
  metricsData?: Record<string, any>;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  recipients?: string[];
  emailedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const typeColors: Record<string, string> = {
  DAILY: "bg-blue-100 text-blue-800",
  WEEKLY: "bg-green-100 text-green-800",
  MONTHLY: "bg-purple-100 text-purple-800",
  QUARTERLY: "bg-orange-100 text-orange-800",
  ANNUAL: "bg-red-100 text-red-800",
  AD_HOC: "bg-gray-100 text-gray-800",
};

const categoryColors: Record<string, string> = {
  INSPECTION_SUMMARY: "bg-blue-100 text-blue-800",
  NCR_ANALYSIS: "bg-red-100 text-red-800",
  CAPA_EFFECTIVENESS: "bg-orange-100 text-orange-800",
  SUPPLIER_PERFORMANCE: "bg-green-100 text-green-800",
  QUALITY_TRENDS: "bg-purple-100 text-purple-800",
  COMPLIANCE: "bg-yellow-100 text-yellow-800",
  EXECUTIVE_SUMMARY: "bg-indigo-100 text-indigo-800",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PENDING_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PUBLISHED: "bg-purple-100 text-purple-800",
};

export default function QualityReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/qc/reports/${params.id}`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await fetch(`/api/qc/reports/${params.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard/qc/reports");
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/qc/reports/${params.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "PDF" }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.reportNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleEmailReport = async () => {
    const recipients = prompt(
      "Enter recipient email addresses (comma-separated):",
    );
    if (!recipients) return;

    setEmailing(true);
    try {
      await fetch(`/api/qc/reports/${params.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: recipients.split(",").map((e) => e.trim()),
        }),
      });
      alert("Report sent successfully!");
      fetchReport(); // Refresh to update emailedAt
    } catch (error) {
      console.error("Error emailing report:", error);
      alert("Failed to send report");
    } finally {
      setEmailing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">Report not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/qc/reports")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.reportNumber}</h1>
            <p className="text-muted-foreground">{report.reportName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleEmailReport}
            disabled={emailing}
          >
            <Mail className="w-4 h-4 mr-2" />
            {emailing ? "Sending..." : "Email"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/qc/reports/${params.id}/edit`)
            }
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={statusColors[report.status] || "bg-gray-100"}>
          {report.status.replace("_", " ")}
        </Badge>
        <Badge className={typeColors[report.reportType] || "bg-gray-100"}>
          {report.reportType.replace("_", " ")} Report
        </Badge>
        <Badge className={categoryColors[report.category] || "bg-gray-100"}>
          {report.category.replace("_", " ")}
        </Badge>
        {report.approvedBy && (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )}
        {report.emailedAt && (
          <Badge className="bg-blue-100 text-blue-800">
            <Mail className="w-3 h-3 mr-1" />
            Emailed
          </Badge>
        )}
      </div>

      {/* Period Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reporting Period</p>
              <p className="text-lg font-semibold">
                {new Date(report.periodStart).toLocaleDateString()} -{" "}
                {new Date(report.periodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Generated By</p>
              <p className="text-lg font-semibold">{report.generatedBy}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {report.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          {report.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Findings */}
          {report.keyFindings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {report.keyFindings}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {report.recommendations}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metrics Data */}
          {report.metricsData && Object.keys(report.metricsData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(report.metricsData).map(([key, value]) => (
                    <div key={key} className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-2xl font-bold">
                        {typeof value === "number" ? value.toFixed(2) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Attachments ({report.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.fileSize)} •{" "}
                            {new Date(
                              attachment.uploadedAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Info */}
          {report.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="text-sm font-medium">{report.approvedBy}</p>
                </div>
                {report.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Approved Date
                    </p>
                    <p className="text-sm">
                      {new Date(report.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Distribution */}
          {report.recipients && report.recipients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Distribution List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {report.recipients.map((recipient, index) => (
                    <p key={index} className="text-sm">
                      {recipient}
                    </p>
                  ))}
                </div>
                {report.emailedAt && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Sent: {new Date(report.emailedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(report.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.status === "DRAFT" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Submit for review */
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              )}
              {report.status === "APPROVED" && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Publish report */
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish Report
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  /* Duplicate report */
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Duplicate Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
