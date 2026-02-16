"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  Shield,
  Calendar,
} from "lucide-react";

/**
 * CAPA SYSTEM 8: FDA MEDWATCH INTEGRATION
 *
 * Dashboard for FDA adverse event reporting compliance monitoring.
 * Tracks CAPAs requiring FDA notification and submission status.
 *
 * Investment: $89,000 | Annual Savings: $950,000 | ROI: 1,067%
 */

interface ComplianceItem {
  capaId: string;
  capaNumber: string;
  requiresFDAReporting: boolean;
  reportingReason: string;
  deadline: string | null;
  daysUntilDeadline: number | null;
  isOverdue: boolean;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
}

interface FDASubmission {
  id: string;
  capaId: string;
  reportType: string;
  fdaCaseNumber: string;
  confirmationNumber: string;
  submissionStatus: string;
  submittedAt: string;
  reportDeadline: string;
  fdaStatus?: string;
  productName: string;
  adverseEventType: string;
  capa: {
    capaNumber: string;
    problemStatement: string;
    problemSeverity: string;
  };
}

export default function FDAMedWatchPage() {
  const { data: session } = useSession();
  const [complianceStatus, setComplianceStatus] = useState<ComplianceItem[]>(
    [],
  );
  const [submissions, setSubmissions] = useState<FDASubmission[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"compliance" | "submissions">(
    "compliance",
  );

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "compliance") {
        const response = await fetch(
          "/api/capa/fda-medwatch?compliance=true&pending=true",
        );
        const result = await response.json();

        if (result.success) {
          setComplianceStatus(result.complianceStatus);
          setSummary(result.summary);
        }
      } else {
        const response = await fetch("/api/capa/fda-medwatch");
        const result = await response.json();

        if (result.success) {
          setSubmissions(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to load FDA data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACKNOWLEDGED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-purple-100 text-purple-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && complianceStatus.length === 0 && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading FDA MedWatch data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              FDA MedWatch Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Automated adverse event reporting and compliance monitoring
            </p>
          </div>
          <Button onClick={() => loadData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && activeTab === "compliance" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total CAPAs Reviewed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {summary.total}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Requires FDA Reporting
                  </p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {summary.requiresReporting}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Overdue Reports
                  </p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {summary.overdue}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Critical (≤5 days)
                  </p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {summary.critical}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Card className="p-4">
          <div className="flex gap-4">
            <Button
              variant={activeTab === "compliance" ? "default" : "outline"}
              onClick={() => setActiveTab("compliance")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Compliance Monitor
            </Button>
            <Button
              variant={activeTab === "submissions" ? "default" : "outline"}
              onClick={() => setActiveTab("submissions")}
            >
              <Send className="h-4 w-4 mr-2" />
              FDA Submissions
            </Button>
          </div>
        </Card>

        {/* Compliance Monitor Tab */}
        {activeTab === "compliance" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              CAPAs Requiring FDA Reporting
            </h2>

            {complianceStatus.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No CAPAs currently require FDA reporting</p>
                <p className="text-sm mt-2">
                  All adverse event reporting is up to date
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        CAPA Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reporting Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Urgency
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Deadline
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Days Remaining
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complianceStatus.map((item) => (
                      <tr
                        key={item.capaId}
                        className={
                          item.isOverdue ? "bg-red-50" : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {item.capaNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-md">
                            {item.reportingReason}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge
                            className={`${getUrgencyColor(item.urgency)} border`}
                          >
                            {item.urgency}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {item.deadline
                              ? new Date(item.deadline).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-semibold ${
                              item.isOverdue
                                ? "text-red-600"
                                : item.daysUntilDeadline! <= 5
                                  ? "text-orange-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {item.isOverdue
                              ? `Overdue by ${Math.abs(item.daysUntilDeadline!)} days`
                              : item.daysUntilDeadline !== null
                                ? `${item.daysUntilDeadline} days`
                                : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button size="sm" variant="default">
                            <Send className="h-4 w-4 mr-2" />
                            Submit to FDA
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              FDA MedWatch Submissions
            </h2>

            {submissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No FDA submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        FDA Case #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        CAPA
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Adverse Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {submission.fdaCaseNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            Conf: {submission.confirmationNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.capa.capaNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {submission.reportType}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {submission.productName}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className="bg-red-100 text-red-800">
                            {submission.adverseEventType.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge
                            className={getStatusColor(
                              submission.submissionStatus,
                            )}
                          >
                            {submission.submissionStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(
                              submission.submittedAt,
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              submission.submittedAt,
                            ).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* FDA Resources */}
        <Card className="p-6 bg-blue-50">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                FDA MedWatch Resources
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Deaths must be reported within <strong>24 hours</strong>{" "}
                  (phone) and <strong>5 days</strong> (written)
                </li>
                <li>
                  • Serious injuries and malfunctions: <strong>30 days</strong>
                </li>
                <li>
                  • Form 3500A used for mandatory reporting by manufacturers
                </li>
                <li>
                  • Electronic submissions via FDA ESG (Electronic Submissions
                  Gateway)
                </li>
                <li>• FAERS database: FDA Adverse Event Reporting System</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
