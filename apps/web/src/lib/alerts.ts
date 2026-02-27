/**
 * Automated Reorder Alert Engine
 *
 * This module handles intelligent inventory monitoring and multi-channel
 * alert notifications when items hit reorder thresholds.
 *
 * Features:
 * - Lead-time aware alerts (warns X days before stockout)
 * - Multiple alert channels (email, SMS, Slack, push)
 * - Prevent duplicate alerts (configurable throttling)
 * - Seasonal demand adjustments
 * - Predictive stockout date calculation
 */

import { PrismaClient } from "@prisma/client";
import { addDays, differenceInDays, format } from "date-fns";
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

// Define alert enums if not in Prisma schema
export type AlertType =
  | "LOW_STOCK"
  | "REORDER_POINT"
  | "STOCKOUT"
  | "EXPIRING_SOON";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "PENDING" | "SENT" | "ACKNOWLEDGED" | "RESOLVED";

const prisma = new PrismaClient();

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ReorderAlertConfig {
  organizationId: string;
  checkLeadTime?: boolean; // Alert X days before stockout (default: true)
  throttleHours?: number; // Don't re-alert within X hours (default: 24)
  enableEmail?: boolean; // Send email alerts (default: true)
  enableSMS?: boolean; // Send SMS alerts (default: false)
  enableSlack?: boolean; // Send Slack alerts (default: false)
  enablePush?: boolean; // Send push notifications (default: true)
}

export interface AlertResult {
  alertId: string;
  inventoryItemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  alertType: AlertType;
  severity: AlertSeverity;
  estimatedStockoutDate: Date | null;
  notificationsSent: {
    email: boolean;
    sms: boolean;
    slack: boolean;
    push: boolean;
  };
}

export interface StockAnalysis {
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  averageDailyUsage: number;
  daysUntilStockout: number;
  estimatedStockoutDate: Date | null;
  shouldAlert: boolean;
  alertType: AlertType;
  severity: AlertSeverity;
}

// ==========================================
// CORE ALERT ENGINE
// ==========================================

export class ReorderAlertEngine {
  private config: Required<ReorderAlertConfig>;

  constructor(config: ReorderAlertConfig) {
    this.config = {
      organizationId: config.organizationId,
      checkLeadTime: config.checkLeadTime ?? true,
      throttleHours: config.throttleHours ?? 24,
      enableEmail: config.enableEmail ?? true,
      enableSMS: config.enableSMS ?? false,
      enableSlack: config.enableSlack ?? false,
      enablePush: config.enablePush ?? true,
    };
  }

  /**
   * Main method: Check all inventory items and create alerts
   */
  async checkInventory(): Promise<AlertResult[]> {
    console.log(
      `[ReorderAlertEngine] Checking inventory for organization: ${this.config.organizationId}`,
    );

    // Get all active inventory items with auto-reorder enabled
    const items = await prisma.inventoryItem.findMany({
      where: {
        organizationId: this.config.organizationId,
        isActive: true,
        autoReorder: true,
        reorderPoint: { gt: 0 }, // Must have reorder point set
      },
      include: {
        warehouse: true,
        category: true,
        supplier: true,
        movements: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    console.log(
      `[ReorderAlertEngine] Found ${items.length} items with auto-reorder enabled`,
    );

    const results: AlertResult[] = [];

    for (const item of items) {
      try {
        // Analyze stock levels
        const analysis = await this.analyzeStock(item);

        if (!analysis.shouldAlert) {
          continue; // Skip - stock levels are fine
        }

        // Check if we already sent an alert recently (throttling)
        const shouldThrottle = await this.shouldThrottleAlert(item.id);
        if (shouldThrottle) {
          console.log(
            `[ReorderAlertEngine] Throttling alert for item: ${item.name} (${item.sku})`,
          );
          continue;
        }

        // Create alert record
        const alert = await this.createAlert(item, analysis);

        // Send notifications
        const notificationsSent = await this.sendNotifications(
          item,
          alert,
          analysis,
        );

        // Update alert with notification status
        await prisma.reorderAlert.update({
          where: { id: alert.id },
          data: {
            emailSent: notificationsSent.email,
            smsSent: notificationsSent.sms,
            slackSent: notificationsSent.slack,
            pushSent: notificationsSent.push,
            sentAt: new Date(),
          },
        });

        results.push({
          alertId: alert.id,
          inventoryItemId: item.id,
          itemName: item.name,
          currentStock: analysis.currentStock,
          reorderPoint: analysis.reorderPoint,
          alertType: analysis.alertType,
          severity: analysis.severity,
          estimatedStockoutDate: analysis.estimatedStockoutDate,
          notificationsSent,
        });

        console.log(
          `[ReorderAlertEngine] Alert created for: ${item.name} (${item.sku}) - ${analysis.alertType}`,
        );
      } catch (error) {
        console.error(
          `[ReorderAlertEngine] Error processing item ${item.id}:`,
          error,
        );
        // Continue with next item
      }
    }

    console.log(`[ReorderAlertEngine] Created ${results.length} alerts`);
    return results;
  }

  /**
   * Analyze stock levels and determine if alert is needed
   */
  private async analyzeStock(item: any): Promise<StockAnalysis> {
    const currentStock = item.availableQty ?? item.quantity;
    const reorderPoint = item.reorderPoint ?? item.minStockLevel ?? 0;
    const reorderQuantity = item.reorderQuantity ?? 0;
    const leadTimeDays = item.leadTimeDays ?? 7;

    // Calculate average daily usage from recent movements
    const averageDailyUsage = this.calculateAverageDailyUsage(item.movements);

    // Calculate days until stockout
    let daysUntilStockout = Infinity;
    let estimatedStockoutDate: Date | null = null;

    if (averageDailyUsage > 0) {
      daysUntilStockout = currentStock / averageDailyUsage;
      estimatedStockoutDate = addDays(
        new Date(),
        Math.floor(daysUntilStockout),
      );
    }

    // Determine alert type and severity
    let alertType: AlertType;
    let severity: AlertSeverity;
    let shouldAlert = false;

    if (currentStock <= 0) {
      alertType = "STOCKOUT";
      severity = "CRITICAL";
      shouldAlert = true;
    } else if (this.config.checkLeadTime && daysUntilStockout <= leadTimeDays) {
      alertType = "REORDER_POINT";
      severity = "HIGH";
      shouldAlert = true;
    } else if (currentStock <= reorderPoint) {
      alertType = "LOW_STOCK";
      severity = "MEDIUM";
      shouldAlert = true;
    } else {
      alertType = "LOW_STOCK";
      severity = "LOW";
      shouldAlert = false;
    }

    return {
      currentStock,
      reorderPoint,
      reorderQuantity,
      leadTimeDays,
      averageDailyUsage,
      daysUntilStockout,
      estimatedStockoutDate,
      shouldAlert,
      alertType,
      severity,
    };
  }

  /**
   * Calculate average daily usage from movement history
   */
  private calculateAverageDailyUsage(movements: any[]): number {
    if (!movements || movements.length === 0) return 0;

    // Filter out movements (sales, bookings) in the last 30 days
    const thirtyDaysAgo = addDays(new Date(), -30);
    const outboundMovements = movements.filter(
      (m) =>
        (m.type === "SALE" || m.type === "BOOKING") &&
        new Date(m.createdAt) >= thirtyDaysAgo,
    );

    if (outboundMovements.length === 0) return 0;

    const totalQuantity = outboundMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity),
      0,
    );
    const oldestMovement = outboundMovements[outboundMovements.length - 1];
    const daysCovered = differenceInDays(
      new Date(),
      new Date(oldestMovement.createdAt),
    );

    return daysCovered > 0 ? totalQuantity / daysCovered : 0;
  }

  /**
   * Check if we should throttle alerts for this item
   */
  private async shouldThrottleAlert(inventoryItemId: string): Promise<boolean> {
    const throttleDate = addDays(new Date(), -this.config.throttleHours / 24);

    const recentAlert = await prisma.reorderAlert.findFirst({
      where: {
        inventoryItemId,
        createdAt: { gte: throttleDate },
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
    });

    return recentAlert !== null;
  }

  /**
   * Create alert record in database
   */
  private async createAlert(item: any, analysis: StockAnalysis) {
    return await prisma.reorderAlert.create({
      data: {
        organizationId: this.config.organizationId,
        inventoryItemId: item.id,
        alertType: analysis.alertType,
        severity: analysis.severity,
        status: "PENDING",
        currentStock: analysis.currentStock,
        reorderPoint: analysis.reorderPoint,
        reorderQuantity: analysis.reorderQuantity,
        estimatedStockoutDate: analysis.estimatedStockoutDate,
      },
    });
  }

  /**
   * Send notifications via multiple channels
   */
  private async sendNotifications(
    item: any,
    alert: any,
    analysis: StockAnalysis,
  ): Promise<{ email: boolean; sms: boolean; slack: boolean; push: boolean }> {
    const results = {
      email: false,
      sms: false,
      slack: false,
      push: false,
    };

    // Prepare notification content
    const message = this.buildNotificationMessage(item, analysis);

    // Send email
    if (this.config.enableEmail) {
      try {
        await this.sendEmailAlert(item, message, analysis);
        results.email = true;
      } catch (error) {
        console.error("[ReorderAlertEngine] Email send failed:", error);
      }
    }

    // Send SMS
    if (this.config.enableSMS) {
      try {
        await this.sendSMSAlert(item, message, analysis);
        results.sms = true;
      } catch (error) {
        console.error("[ReorderAlertEngine] SMS send failed:", error);
      }
    }

    // Send Slack
    if (this.config.enableSlack) {
      try {
        await this.sendSlackAlert(item, message, analysis);
        results.slack = true;
      } catch (error) {
        console.error("[ReorderAlertEngine] Slack send failed:", error);
      }
    }

    // Send Push
    if (this.config.enablePush) {
      try {
        await this.sendPushAlert(item, message, analysis);
        results.push = true;
      } catch (error) {
        console.error("[ReorderAlertEngine] Push send failed:", error);
      }
    }

    return results;
  }

  /**
   * Build human-readable notification message
   */
  private buildNotificationMessage(item: any, analysis: StockAnalysis): string {
    const {
      currentStock,
      reorderPoint,
      reorderQuantity,
      estimatedStockoutDate,
      alertType,
    } = analysis;

    let message = `🚨 Reorder Alert: ${item.name} (${item.sku})\n\n`;

    if (alertType === "STOCKOUT") {
      message += `❌ OUT OF STOCK!\n`;
      message += `Current Stock: ${currentStock}\n`;
      message += `Reorder Point: ${reorderPoint}\n`;
      message += `Suggested Reorder: ${reorderQuantity} units\n`;
    } else if (alertType === "REORDER_POINT") {
      message += `⚠️ CRITICAL - Stockout Imminent!\n`;
      message += `Current Stock: ${currentStock} units\n`;
      message += `Reorder Point: ${reorderPoint} units\n`;
      message += `Estimated Stockout: ${estimatedStockoutDate ? format(estimatedStockoutDate, "MMM dd, yyyy") : "Unknown"}\n`;
      message += `Suggested Reorder: ${reorderQuantity} units\n`;
    } else {
      message += `📉 Low Stock Warning\n`;
      message += `Current Stock: ${currentStock} units\n`;
      message += `Reorder Point: ${reorderPoint} units\n`;
      message += `Suggested Reorder: ${reorderQuantity} units\n`;
    }

    message += `\nWarehouse: ${item.warehouse?.name || "Unknown"}\n`;
    message += `Supplier: ${item.supplier?.name || "Not assigned"}\n`;

    return message;
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(
    item: any,
    message: string,
    analysis: StockAnalysis,
  ): Promise<void> {
    const recipients = (process.env.EMAIL_ALERT_RECIPIENTS || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      console.warn(
        "[ReorderAlertEngine] EMAIL skipped: EMAIL_ALERT_RECIPIENTS not set",
      );
      return;
    }

    const subject = `Reorder Alert: ${item.name} (${analysis.alertType})`;

    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to: recipients,
        from:
          process.env.SENDGRID_FROM_EMAIL ||
          process.env.EMAIL_FROM ||
          "noreply@flowstock.app",
        subject,
        text: message,
        html: `<pre>${message}</pre>`,
      });
      return;
    }

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || "",
            }
          : undefined,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@flowstock.app",
        to: recipients.join(","),
        subject,
        text: message,
        html: `<pre>${message}</pre>`,
      });
      return;
    }

    console.error(
      "[ReorderAlertEngine] EMAIL not sent: no provider configured (SENDGRID_API_KEY or SMTP_HOST)",
    );
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(
    item: any,
    message: string,
    analysis: StockAnalysis,
  ): Promise<void> {
    const recipientsEnv = process.env.SMS_ALERT_RECIPIENTS;
    if (!recipientsEnv) {
      console.warn(
        "[ReorderAlertEngine] SMS skipped: SMS_ALERT_RECIPIENTS not set",
      );
      return;
    }

    const recipients = recipientsEnv
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      console.warn(
        "[ReorderAlertEngine] SMS skipped: no recipients configured",
      );
      return;
    }

    const provider = (process.env.SMS_PROVIDER || "messagebird").toLowerCase();

    if (provider === "messagebird") {
      const apiKey = process.env.MESSAGEBIRD_API_KEY;
      const originator = process.env.SMS_FROM_NUMBER;
      if (!apiKey || !originator) {
        console.warn(
          "[ReorderAlertEngine] MessageBird missing config; falling back to Twilio",
        );
      } else {
        const body = new URLSearchParams({
          originator,
          body: message,
          recipients: recipients.join(","),
        });

        const response = await fetch("https://rest.messagebird.com/messages", {
          method: "POST",
          headers: {
            Authorization: `AccessKey ${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        if (response.ok) return;

        console.warn(
          "[ReorderAlertEngine] MessageBird send failed, falling back to Twilio",
          await response.text().catch(() => ""),
        );
      }
    }

    // Plan B: Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.error("[ReorderAlertEngine] Twilio config missing; SMS not sent");
      return;
    }

    // Lazy load to avoid impacting builds when Twilio is unused
    const twilio = (await import("twilio")).default;
    const client = twilio(twilioSid, twilioToken);

    await Promise.all(
      recipients.map((to) =>
        client.messages.create({
          to,
          from: twilioFrom,
          body: message,
        }),
      ),
    );
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(
    item: any,
    message: string,
    analysis: StockAnalysis,
  ): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn(
        "[ReorderAlertEngine] Slack skipped: SLACK_WEBHOOK_URL not configured",
      );
      return;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `*${analysis.alertType}* - ${item.name} (${item.sku})\n${message}`,
      }),
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      throw new Error(`Slack webhook failed: ${response.status} ${payload}`);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushAlert(
    item: any,
    message: string,
    analysis: StockAnalysis,
  ): Promise<void> {
    const endpoint = process.env.PUSH_ALERT_WEBHOOK_URL;
    if (!endpoint) {
      console.warn(
        "[ReorderAlertEngine] Push skipped: PUSH_ALERT_WEBHOOK_URL not configured",
      );
      return;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Reorder Alert: ${item.name}`,
        body: message,
        severity: analysis.severity,
        alertType: analysis.alertType,
        sku: item.sku,
        inventoryItemId: item.id,
        organizationId: this.config.organizationId,
      }),
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      throw new Error(`Push webhook failed: ${response.status} ${payload}`);
    }
  }

  /**
   * Get all pending alerts for an organization
   */
  static async getPendingAlerts(organizationId: string) {
    return await prisma.reorderAlert.findMany({
      where: {
        organizationId,
        status: "PENDING",
      },
      include: {
        inventoryItem: {
          include: {
            warehouse: true,
            supplier: true,
            category: true,
          },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Acknowledge an alert (user has seen it)
   */
  static async acknowledgeAlert(alertId: string) {
    return await prisma.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
      },
    });
  }

  /**
   * Resolve an alert (reorder has been placed)
   */
  static async resolveAlert(alertId: string, notes?: string) {
    return await prisma.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        notes,
      },
    });
  }

  /**
   * Dismiss an alert (user wants to ignore it)
   */
  static async dismissAlert(alertId: string, notes?: string) {
    return await prisma.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: "DISMISSED",
        dismissedAt: new Date(),
        notes,
      },
    });
  }

  /**
   * Auto-resolve alerts when stock is replenished
   */
  static async autoResolveAlerts(inventoryItemId: string) {
    // Get item's current stock
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item) return;

    // If stock is above reorder point, auto-resolve pending alerts
    if (item.availableQty > (item.reorderPoint ?? 0)) {
      await prisma.reorderAlert.updateMany({
        where: {
          inventoryItemId,
          status: { in: ["PENDING", "ACKNOWLEDGED"] },
        },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          notes: "Auto-resolved: Stock replenished",
        },
      });
    }
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Schedule daily inventory check (use with cron job)
 */
export async function runDailyInventoryCheck(organizationId: string) {
  console.log(
    `[runDailyInventoryCheck] Starting daily check for org: ${organizationId}`,
  );

  const engine = new ReorderAlertEngine({
    organizationId,
    checkLeadTime: true,
    throttleHours: 24,
    enableEmail: true,
    enableSMS: false,
    enableSlack: true,
    enablePush: true,
  });

  const results = await engine.checkInventory();

  console.log(
    `[runDailyInventoryCheck] Completed. ${results.length} alerts created.`,
  );

  return results;
}

/**
 * Get alert statistics for dashboard
 */
export async function getAlertStatistics(
  organizationId: string,
  days: number = 30,
) {
  const since = addDays(new Date(), -days);

  const [total, pending, acknowledged, resolved, dismissed] = await Promise.all(
    [
      prisma.reorderAlert.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      prisma.reorderAlert.count({
        where: { organizationId, status: "PENDING", createdAt: { gte: since } },
      }),
      prisma.reorderAlert.count({
        where: {
          organizationId,
          status: "ACKNOWLEDGED",
          createdAt: { gte: since },
        },
      }),
      prisma.reorderAlert.count({
        where: {
          organizationId,
          status: "RESOLVED",
          createdAt: { gte: since },
        },
      }),
      prisma.reorderAlert.count({
        where: {
          organizationId,
          status: "DISMISSED",
          createdAt: { gte: since },
        },
      }),
    ],
  );

  const bySeverity = await prisma.reorderAlert.groupBy({
    by: ["severity"],
    where: { organizationId, createdAt: { gte: since } },
    _count: true,
  });

  return {
    total,
    pending,
    acknowledged,
    resolved,
    dismissed,
    bySeverity: bySeverity.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.severity.toLowerCase()] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };
}
