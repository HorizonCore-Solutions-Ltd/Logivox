'use client';

/**
 * Report Viewer Component for FlowStock
 * 
 * Displays executed report results with tables, charts, and export options.
 */

import React, { useState, useEffect } from 'react';
import { ReportConfig, ChartType } from '@/lib/reports/report-types';
import { executeReport } from '@/lib/reports/report-engine';
import { exportReport, ExportFormat, downloadReport } from '@/lib/reports/report-exporter';
import { ReportChart } from '@/components/reports/charts';

// ============================================================================
// Types
// ============================================================================

interface ReportViewerProps {
  config: ReportConfig;
  tenantId: string;
  onClose?: () => void;
  onSchedule?: (config: ReportConfig) => void;
}

interface ReportData {
  data: any[];
  totalRows: number;
  executionTime: number;
  config: ReportConfig;
}

// ============================================================================
// Report Viewer Component
// ============================================================================

export function ReportViewer({
  config,
  tenantId,
  onClose,
  onSchedule,
}: ReportViewerProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.PDF);
  const [exporting, setExporting] = useState(false);

  // Load report data
  useEffect(() => {
    loadReport();
  }, [config, tenantId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Execute report
      const result = await executeReport(config, tenantId);
      setReportData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
      console.error('Report execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const handleExport = async () => {
    if (!reportData) return;

    try {
      setExporting(true);

      const blob = await exportReport(reportData, {
        format: exportFormat,
        filename: config.name,
        includeCharts: true,
        includeHeaders: true,
        includeSummary: true,
      });

      downloadReport(blob, config.name, exportFormat);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-900">Failed to load report</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadReport}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!reportData || reportData.data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">📊</div>
          <p className="mt-4 text-sm font-medium text-gray-900">No data found</p>
          <p className="mt-1 text-sm text-gray-500">
            This report doesn't have any data to display
          </p>
        </div>
      </div>
    );
  }

  const fields = config.fields;
  const data = reportData.data;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                {config.category}
              </span>
            </div>
            {config.description && (
              <p className="mt-1 text-sm text-gray-600">{config.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{reportData.totalRows} rows</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{reportData.executionTime}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Print Report"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>

            {onSchedule && (
              <button
                onClick={() => onSchedule(config)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Schedule Report"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-2 rounded-md border border-gray-300">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="rounded-l-md border-0 bg-transparent px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none"
              >
                <option value={ExportFormat.PDF}>PDF</option>
                <option value={ExportFormat.EXCEL}>Excel</option>
                <option value={ExportFormat.CSV}>CSV</option>
                <option value={ExportFormat.JSON}>JSON</option>
              </select>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="rounded-r-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="rounded-lg border border-gray-200 bg-white">
          {/* Chart View */}
          {config.chartType && config.chartType !== ChartType.TABLE && (
            <div className="border-b border-gray-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Visualization
              </h2>
              <ReportChart
                data={data}
                type={config.chartType}
                xAxisKey={fields[0]}
                yAxisKeys={fields.slice(1)}
                height={400}
              />
            </div>
          )}

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {fields.map((fieldId) => (
                    <th
                      key={fieldId}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {fieldId.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {fields.map((fieldId) => (
                      <td
                        key={fieldId}
                        className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                      >
                        {formatCellValue(row[fieldId])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {data.length > 10 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-600">
              Showing {data.length} of {reportData.totalRows} rows
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'number') {
    // Check if it looks like currency
    if (Number.isInteger(value) && value > 100) {
      return value.toLocaleString();
    }
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
