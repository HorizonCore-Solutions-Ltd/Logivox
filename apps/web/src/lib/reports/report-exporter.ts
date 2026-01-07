/**
 * Report Export System for LogiVox
 *
 * Handles exporting reports to PDF, Excel (XLSX), and CSV formats.
 * Supports custom formatting, charts, and branding.
 */

import { ReportConfig, FieldType, getFieldById } from "./report-types";

// Import ReportResult from report-engine
export interface ReportResult {
  data: any[];
  totalRows: number;
  executionTime: number;
  config: ReportConfig;
}

// ============================================================================
// Export Types
// ============================================================================

export enum ExportFormat {
  PDF = "pdf",
  EXCEL = "xlsx",
  CSV = "csv",
  JSON = "json",
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
  includeHeaders?: boolean;
  includeSummary?: boolean;
  pageOrientation?: "portrait" | "landscape";
}

// ============================================================================
// CSV Export
// ============================================================================

export function exportToCSV(
  result: ReportResult,
  options: ExportOptions = { format: ExportFormat.CSV },
): string {
  const { data, config } = result;

  if (data.length === 0) {
    return "";
  }

  const headers = config.fields.map((fieldId) => {
    const field = getFieldById(fieldId, config.category);
    return field?.name || fieldId;
  });

  const rows = data.map((row) => {
    return config.fields.map((fieldId) => {
      const value = row[fieldId];
      return formatCSVValue(value);
    });
  });

  // Build CSV content
  let csv = "";

  // Add headers
  if (options.includeHeaders !== false) {
    csv += headers.map(escapeCSV).join(",") + "\n";
  }

  // Add data rows
  rows.forEach((row) => {
    csv += row.map(escapeCSV).join(",") + "\n";
  });

  return csv;
}

function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ============================================================================
// Excel Export (Simplified - would use a library like xlsx in production)
// ============================================================================

export function exportToExcel(
  result: ReportResult,
  options: ExportOptions = { format: ExportFormat.EXCEL },
): string {
  // In production, this would use the 'xlsx' library
  // For now, return Excel-compatible CSV (tab-delimited)
  const { data, config } = result;

  if (data.length === 0) {
    return "";
  }

  const headers = config.fields.map((fieldId) => {
    const field = getFieldById(fieldId, config.category);
    return field?.name || fieldId;
  });

  const rows = data.map((row) => {
    return config.fields.map((fieldId) => {
      const value = row[fieldId];
      return formatExcelValue(value);
    });
  });

  // Build tab-delimited content
  let content = "";

  // Add title and metadata
  if (options.includeSummary !== false) {
    content += `${config.name}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Rows: ${data.length}\n\n`;
  }

  // Add headers
  content += headers.join("\t") + "\n";

  // Add data rows
  rows.forEach((row) => {
    content += row.join("\t") + "\n";
  });

  return content;
}

function formatExcelValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "number") return value.toString();
  return String(value);
}

// ============================================================================
// JSON Export
// ============================================================================

export function exportToJSON(
  result: ReportResult,
  options: ExportOptions = { format: ExportFormat.JSON },
): string {
  const exportData: any = {
    report: {
      name: result.config.name,
      description: result.config.description,
      category: result.config.category,
      generatedAt: new Date().toISOString(),
      executionTime: result.executionTime,
      totalRows: result.totalRows,
    },
    data: result.data,
  };

  if (options.includeSummary) {
    exportData.summary = generateSummary(result);
  }

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// PDF Export (Simplified - would use a library like pdfkit in production)
// ============================================================================

export function exportToPDF(
  result: ReportResult,
  options: ExportOptions = { format: ExportFormat.PDF },
): string {
  // In production, this would use 'pdfkit' or similar
  // For now, return HTML that can be converted to PDF by the browser
  const { data, config } = result;

  const headers = config.fields.map((fieldId) => {
    const field = getFieldById(fieldId, config.category);
    return field?.name || fieldId;
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      color: #1a1a1a;
    }
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      color: #0066cc;
      margin-bottom: 10px;
    }
    .header .meta {
      font-size: 12px;
      color: #666;
    }
    .summary {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .summary div {
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead {
      background: #0066cc;
      color: white;
    }
    th, td {
      padding: 12px 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    tbody tr:hover {
      background: #f0f0f0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.name}</h1>
    <div class="meta">
      ${config.description || ""}
      <br>Generated: ${new Date().toLocaleString()}
      <br>Category: ${config.category}
    </div>
  </div>

  ${
    options.includeSummary
      ? `
  <div class="summary">
    <div><strong>Summary:</strong></div>
    <div>Total Rows: ${data.length}</div>
    <div>Execution Time: ${result.executionTime}ms</div>
  </div>
  `
      : ""
  }

  <table>
    <thead>
      <tr>
        ${headers.map((header) => `<th>${header}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) => `
        <tr>
          ${config.fields
            .map((fieldId) => {
              const value = row[fieldId];
              return `<td>${formatPDFValue(value)}</td>`;
            })
            .join("")}
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    LogiVox Reporting System &copy; ${new Date().getFullYear()}
    <br>Page 1 of 1
  </div>
</body>
</html>
  `;

  return html;
}

function formatPDFValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "number") {
    // Format currency
    if (value >= 0.01 && value < 1000000) {
      return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString();
  }
  return String(value);
}

// ============================================================================
// Summary Generation
// ============================================================================

function generateSummary(result: ReportResult): any {
  const { data, config } = result;

  const summary: any = {
    totalRows: data.length,
    executionTime: result.executionTime,
    fields: config.fields.length,
  };

  // Calculate numeric aggregations
  config.fields.forEach((fieldId) => {
    const field = getFieldById(fieldId, config.category);

    if (
      field?.type === FieldType.NUMBER ||
      field?.type === FieldType.CURRENCY
    ) {
      const values = data.map((row) => row[fieldId]).filter((v) => v != null);

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        summary[fieldId] = {
          sum,
          avg,
          min,
          max,
          count: values.length,
        };
      }
    }
  });

  return summary;
}

// ============================================================================
// Export Dispatcher
// ============================================================================

export function exportReport(
  result: ReportResult,
  options: ExportOptions,
): string {
  switch (options.format) {
    case ExportFormat.CSV:
      return exportToCSV(result, options);

    case ExportFormat.EXCEL:
      return exportToExcel(result, options);

    case ExportFormat.JSON:
      return exportToJSON(result, options);

    case ExportFormat.PDF:
      return exportToPDF(result, options);

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// ============================================================================
// Download Helpers
// ============================================================================

export function downloadReport(
  content: string,
  filename: string,
  format: ExportFormat,
): void {
  const mimeTypes: Record<ExportFormat, string> = {
    [ExportFormat.CSV]: "text/csv",
    [ExportFormat.EXCEL]: "application/vnd.ms-excel",
    [ExportFormat.JSON]: "application/json",
    [ExportFormat.PDF]: "text/html", // Would be 'application/pdf' with proper PDF generation
  };

  const extensions: Record<ExportFormat, string> = {
    [ExportFormat.CSV]: "csv",
    [ExportFormat.EXCEL]: "xlsx",
    [ExportFormat.JSON]: "json",
    [ExportFormat.PDF]: "html", // Would be 'pdf' with proper PDF generation
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${extensions[format]}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ============================================================================
// File Size Estimation
// ============================================================================

export function estimateExportSize(
  result: ReportResult,
  format: ExportFormat,
): number {
  const { data, config } = result;

  // Rough estimation in bytes
  const avgRowSize = 100; // Average bytes per row
  const headerSize = config.fields.length * 20;
  const metadataSize = 500;

  let baseSize = data.length * avgRowSize + headerSize + metadataSize;

  switch (format) {
    case ExportFormat.PDF:
      baseSize *= 3; // PDF is typically larger
      break;
    case ExportFormat.EXCEL:
      baseSize *= 1.5; // Excel has more overhead
      break;
    case ExportFormat.JSON:
      baseSize *= 2; // JSON is verbose
      break;
  }

  return baseSize;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
