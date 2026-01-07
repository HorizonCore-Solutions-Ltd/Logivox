import { prisma } from "@/lib/prisma";
import fetch from "node-fetch";

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  organizationId: string;
}

interface WebhookRetryConfig {
  maxRetries?: number;
  retryDelays?: number[]; // In seconds
  timeout?: number; // In milliseconds
}

const DEFAULT_CONFIG: Required<WebhookRetryConfig> = {
  maxRetries: 5,
  retryDelays: [30, 60, 300, 900, 3600], // 30s, 1m, 5m, 15m, 1h
  timeout: 10000, // 10 seconds
};

/**
 * Send a webhook with automatic retry logic
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  config: WebhookRetryConfig = {},
): Promise<{ success: boolean; attempts: number; error?: string }> {
  const { maxRetries, retryDelays, timeout } = { ...DEFAULT_CONFIG, ...config };
  let attempts = 0;
  let lastError: string | undefined;

  // Create webhook log entry
  const webhookLog = await prisma.webhookLog.create({
    data: {
      url,
      event: payload.event,
      payload,
      organizationId: payload.organizationId,
      status: "PENDING",
      attempts: 0,
    },
  });

  while (attempts < maxRetries) {
    attempts++;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "LogiVox-WMS-Webhook/1.0",
          "X-Webhook-Signature": generateSignature(payload),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success if 2xx status code
      if (response.ok) {
        await prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: {
            status: "SUCCESS",
            attempts,
            responseStatus: response.status,
            responseBody: await response.text(),
            completedAt: new Date(),
          },
        });

        return { success: true, attempts };
      }

      // Non-2xx response
      lastError = `HTTP ${response.status}: ${response.statusText}`;
      await updateWebhookLogError(
        webhookLog.id,
        attempts,
        lastError,
        response.status,
      );

      // Don't retry on 4xx errors (client errors - bad request, auth, etc.)
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (error: any) {
      lastError = error.message || "Unknown error";
      await updateWebhookLogError(webhookLog.id, attempts, lastError);

      // Don't retry on network timeouts beyond certain threshold
      if (error.name === "AbortError" && attempts >= 3) {
        break;
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempts < maxRetries) {
      const delay =
        retryDelays[attempts - 1] || retryDelays[retryDelays.length - 1];
      await sleep(delay * 1000);
    }
  }

  // All retries failed
  await prisma.webhookLog.update({
    where: { id: webhookLog.id },
    data: {
      status: "FAILED",
      attempts,
      errorMessage: lastError,
      completedAt: new Date(),
    },
  });

  return { success: false, attempts, error: lastError };
}

/**
 * Update webhook log with error details
 */
async function updateWebhookLogError(
  logId: string,
  attempts: number,
  errorMessage: string,
  responseStatus?: number,
) {
  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "RETRYING",
      attempts,
      errorMessage,
      responseStatus,
      lastAttemptAt: new Date(),
    },
  });
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: any): string {
  const crypto = require("crypto");
  const secret = process.env.WEBHOOK_SECRET || "default-webhook-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry failed webhooks (to be called by cron job)
 */
export async function retryFailedWebhooks() {
  const failedWebhooks = await prisma.webhookLog.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: 5 },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    take: 50,
  });

  const results = await Promise.allSettled(
    failedWebhooks.map(async (webhook) => {
      return sendWebhook(webhook.url, webhook.payload as WebhookPayload, {
        maxRetries: 5 - webhook.attempts, // Remaining retries
      });
    }),
  );

  return {
    total: failedWebhooks.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
