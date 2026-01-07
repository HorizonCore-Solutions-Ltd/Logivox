"use client";

/**
 * Report View Page for LogiVox
 *
 * Display and interact with report results.
 */

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReportViewer } from "@/components/reports/report-viewer";
import { getReportTemplate } from "@/lib/reports/report-templates";
import { ReportConfig } from "@/lib/reports/report-types";

export default function ReportViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("id");

  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      // Load report configuration
      const template = getReportTemplate(reportId);
      if (template) {
        setReportConfig(template);
      }
      setLoading(false);
    }
  }, [reportId]);

  const handleClose = () => {
    router.push("/dashboard/reports");
  };

  const handleSchedule = (config: ReportConfig) => {
    // In production, open schedule modal
    console.log("Schedule report:", config);
    alert("Report scheduling coming soon!");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!reportConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">❌</div>
          <p className="mt-4 text-sm font-medium text-gray-900">
            Report not found
          </p>
          <button
            onClick={handleClose}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReportViewer
      config={reportConfig}
      tenantId="default-tenant" // TODO: Get from session
      onClose={handleClose}
      onSchedule={handleSchedule}
    />
  );
}
