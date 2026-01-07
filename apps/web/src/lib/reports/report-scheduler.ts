/**
 * Report Scheduler for LogiVox
 *
 * Handles scheduled report generation and delivery via email.
 * Supports daily, weekly, and monthly schedules.
 */

import { ReportConfig } from "./report-types";

// ============================================================================
// Schedule Types
// ============================================================================

export enum ScheduleFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface Schedule {
  frequency: ScheduleFrequency;
  time: string; // HH:mm format
  dayOfWeek?: DayOfWeek; // For weekly schedules
  dayOfMonth?: number; // 1-31, for monthly schedules
  timezone?: string; // IANA timezone
}

export interface ScheduledReport {
  id: string;
  reportConfig: ReportConfig;
  schedule: Schedule;
  recipients: string[]; // Email addresses
  format: "pdf" | "csv" | "xlsx";
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// Schedule Helpers
// ============================================================================

export function calculateNextRun(
  schedule: Schedule,
  from: Date = new Date(),
): Date {
  const next = new Date(from);
  const timeParts = schedule.time.split(":").map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;

  // Set time
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, move to next occurrence
  if (next <= from) {
    switch (schedule.frequency) {
      case ScheduleFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;

      case ScheduleFrequency.WEEKLY:
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = next.getDay();
          let daysUntilNext = schedule.dayOfWeek - currentDay;
          if (daysUntilNext <= 0) {
            daysUntilNext += 7;
          }
          next.setDate(next.getDate() + daysUntilNext);
        }
        break;

      case ScheduleFrequency.MONTHLY:
        if (schedule.dayOfMonth !== undefined) {
          next.setDate(schedule.dayOfMonth);
          if (next <= from) {
            next.setMonth(next.getMonth() + 1);
          }
        }
        break;
    }
  }

  return next;
}

export function isScheduleDue(schedule: Schedule, lastRun?: Date): boolean {
  const now = new Date();

  if (!lastRun) {
    return true; // Never run before
  }

  const nextRun = calculateNextRun(schedule, lastRun);
  return now >= nextRun;
}

export function getScheduleDescription(schedule: Schedule): string {
  const { frequency, time, dayOfWeek, dayOfMonth } = schedule;

  switch (frequency) {
    case ScheduleFrequency.DAILY:
      return `Daily at ${time}`;

    case ScheduleFrequency.WEEKLY:
      if (dayOfWeek !== undefined) {
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        return `Every ${days[dayOfWeek]} at ${time}`;
      }
      return `Weekly at ${time}`;

    case ScheduleFrequency.MONTHLY:
      if (dayOfMonth !== undefined) {
        const suffix = getDayOrdinalSuffix(dayOfMonth);
        return `Monthly on the ${dayOfMonth}${suffix} at ${time}`;
      }
      return `Monthly at ${time}`;

    case ScheduleFrequency.CUSTOM:
      return `Custom schedule at ${time}`;

    default:
      return `Unknown schedule`;
  }
}

function getDayOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// ============================================================================
// Email Template
// ============================================================================

export function generateReportEmail(
  scheduledReport: ScheduledReport,
  reportData: { totalRows: number; executionTime: number },
): {
  subject: string;
  html: string;
  text: string;
} {
  const { reportConfig } = scheduledReport;

  const subject = `LogiVox Report: ${reportConfig.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .content h2 {
      color: #0066cc;
      font-size: 18px;
      margin-top: 0;
    }
    .info-box {
      background: #f5f8fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .info-item {
      margin: 8px 0;
    }
    .info-label {
      font-weight: 600;
      color: #555;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 LogiVox Report</h1>
  </div>

  <div class="content">
    <h2>${reportConfig.name}</h2>
    
    ${reportConfig.description ? `<p>${reportConfig.description}</p>` : ""}

    <div class="info-box">
      <div class="info-item">
        <span class="info-label">Category:</span> ${reportConfig.category}
      </div>
      <div class="info-item">
        <span class="info-label">Generated:</span> ${new Date().toLocaleString()}
      </div>
      <div class="info-item">
        <span class="info-label">Total Rows:</span> ${reportData.totalRows}
      </div>
      <div class="info-item">
        <span class="info-label">Execution Time:</span> ${reportData.executionTime}ms
      </div>
    </div>

    <p>
      Your scheduled report has been generated and is attached to this email.
    </p>

    <p>
      <strong>Schedule:</strong> ${getScheduleDescription(scheduledReport.schedule)}
    </p>
  </div>

  <div class="footer">
    <p>
      This is an automated email from LogiVox Reporting System.
      <br>
      &copy; ${new Date().getFullYear()} LogiVox. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
LogiVox Report: ${reportConfig.name}

${reportConfig.description || ""}

Report Details:
- Category: ${reportConfig.category}
- Generated: ${new Date().toLocaleString()}
- Total Rows: ${reportData.totalRows}
- Execution Time: ${reportData.executionTime}ms

Your scheduled report has been generated and is attached to this email.

Schedule: ${getScheduleDescription(scheduledReport.schedule)}

---
This is an automated email from LogiVox Reporting System.
© ${new Date().getFullYear()} LogiVox. All rights reserved.
  `.trim();

  return { subject, html, text };
}

// ============================================================================
// Schedule Validation
// ============================================================================

export function validateSchedule(schedule: Schedule): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(schedule.time)) {
    errors.push("Time must be in HH:mm format (e.g., 09:00, 14:30)");
  }

  // Validate frequency-specific fields
  if (schedule.frequency === ScheduleFrequency.WEEKLY) {
    if (schedule.dayOfWeek === undefined) {
      errors.push("Day of week is required for weekly schedules");
    } else if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      errors.push("Day of week must be between 0 (Sunday) and 6 (Saturday)");
    }
  }

  if (schedule.frequency === ScheduleFrequency.MONTHLY) {
    if (schedule.dayOfMonth === undefined) {
      errors.push("Day of month is required for monthly schedules");
    } else if (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
      errors.push("Day of month must be between 1 and 31");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateScheduledReport(report: Partial<ScheduledReport>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!report.reportConfig) {
    errors.push("Report configuration is required");
  }

  if (!report.schedule) {
    errors.push("Schedule is required");
  } else {
    const scheduleValidation = validateSchedule(report.schedule);
    if (!scheduleValidation.valid) {
      errors.push(...scheduleValidation.errors);
    }
  }

  if (!report.recipients || report.recipients.length === 0) {
    errors.push("At least one recipient email is required");
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    report.recipients.forEach((email, index) => {
      if (!emailRegex.test(email)) {
        errors.push(
          `Invalid email format for recipient ${index + 1}: ${email}`,
        );
      }
    });
  }

  if (!report.format) {
    errors.push("Export format is required");
  } else if (!["pdf", "csv", "xlsx"].includes(report.format)) {
    errors.push("Format must be pdf, csv, or xlsx");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Timezone Helpers
// ============================================================================

export function convertToTimezone(date: Date, timezone: string): Date {
  // In production, use a library like date-fns-tz or luxon
  // For now, return the date as-is
  return date;
}

export function getSupportedTimezones(): string[] {
  return [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Dubai",
    "Australia/Sydney",
    "Pacific/Auckland",
    "UTC",
  ];
}
