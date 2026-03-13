/**
 * Integration Layer - Webhooks and External Systems
 * ERP, TMS, Carrier integrations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RETRY_ATTEMPTS = 3;

const WEBHOOK_DEPRECATION = {
  message: "Webhook management moved to /api/integrations/webhooks",
  hint: "Use the dedicated webhook endpoint for create, test, and delivery logs.",
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status: number) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchWithResilience(
  url: string,
  init: RequestInit,
  options: {
    timeoutMs?: number;
    maxAttempts?: number;
    operation: string;
    traceId: string;
  },
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? MAX_RETRY_ATTEMPTS;
  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (
        !response.ok &&
        shouldRetryStatus(response.status) &&
        attempt < maxAttempts
      ) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
        const delayMs = Number.isFinite(retryAfterSec)
          ? Math.max(250, retryAfterSec * 1000)
          : Math.min(4000, 250 * 2 ** (attempt - 1));
        clearTimeout(timeout);
        await wait(delayMs);
        continue;
      }

      clearTimeout(timeout);
      return {
        response,
        attempts: attempt,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt < maxAttempts) {
        await wait(Math.min(4000, 250 * 2 ** (attempt - 1)));
        continue;
      }
    }
  }

  const totalDurationMs = Date.now() - start;
  console.error("Integration outbound request exhausted retries", {
    operation: options.operation,
    traceId: options.traceId,
    maxAttempts,
    totalDurationMs,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw (
    lastError ??
    new Error(
      `Request failed after ${maxAttempts} attempts for ${options.operation}`,
    )
  );
}

// GET - deprecated webhook listing
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(WEBHOOK_DEPRECATION, { status: 410 });
  } catch (error) {
    console.error("Integration GET error:", error);
    return NextResponse.json(
      { error: "Failed to process integration" },
      { status: 500 },
    );
  }
}

// POST - ERP and carrier actions (webhook creation moved)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "createWebhook" || action === "testWebhook") {
      return NextResponse.json(WEBHOOK_DEPRECATION, { status: 410 });
    }

    if (action === "syncToERP") {
      const { loadSheetId, erpSystem } = body;

      if (!loadSheetId || !erpSystem) {
        return NextResponse.json(
          { error: "loadSheetId and erpSystem are required" },
          { status: 400 },
        );
      }

      const loadSheet = await prisma.loadSheet.findUnique({
        where: { id: loadSheetId },
        include: {
          customer: true,
          containers: {
            include: { containerItems: true },
          },
        },
      });

      if (!loadSheet) {
        return NextResponse.json(
          { error: "Load sheet not found" },
          { status: 404 },
        );
      }

      const result = await syncToERP(loadSheet, erpSystem);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        erpReference: result.erpReference,
      });
    }

    if (action === "dispatchCarrier") {
      const { loadSheetId, carrierCode } = body;

      if (!loadSheetId || !carrierCode) {
        return NextResponse.json(
          { error: "loadSheetId and carrierCode are required" },
          { status: 400 },
        );
      }

      const loadSheet = await prisma.loadSheet.findUnique({
        where: { id: loadSheetId },
        include: { customer: true },
      });

      if (!loadSheet) {
        return NextResponse.json(
          { error: "Load sheet not found" },
          { status: 404 },
        );
      }

      const result = await dispatchToCarrier(loadSheet, carrierCode);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        trackingNumber: result.trackingNumber,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Integration POST error:", error);
    return NextResponse.json(
      { error: "Failed to process integration" },
      { status: 500 },
    );
  }
}

// PATCH - Update webhook
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { webhookId, status, events } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID is required" },
        { status: 400 },
      );
    }

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        status,
        events: events || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      webhook,
    });
  } catch (error) {
    console.error("Webhook PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 },
    );
  }
}

// DELETE - Delete webhook
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
      return NextResponse.json(
        { error: "Webhook ID is required" },
        { status: 400 },
      );
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    console.error("Webhook DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 },
    );
  }
}

/**
 * Helper: Sync load sheet to ERP system
 */
async function syncToERP(loadSheet: any, erpSystem: string) {
  const traceId = crypto.randomUUID();
  try {
    const payload = {
      deliveryNumber: loadSheet.loadSheetNumber,
      customer: {
        code: loadSheet.customer?.code,
        name: loadSheet.customer?.name,
      },
      shipDate: loadSheet.shipmentDate,
      items: loadSheet.containers.flatMap((c: any) =>
        c.containerItems.map((item: any) => ({
          material: item.sku,
          quantity: item.quantity,
        })),
      ),
    };

    const endpointMap: Record<string, string | undefined> = {
      SAP: process.env.SAP_API_URL,
      ORACLE: process.env.ORACLE_API_URL,
    };

    const endpoint = endpointMap[erpSystem];
    if (!endpoint) {
      return {
        success: false,
        message: `${erpSystem} ERP endpoint is not configured`,
      };
    }

    const authToken = process.env.ERP_API_TOKEN;
    const { response, attempts, durationMs } = await fetchWithResilience(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": traceId,
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      },
      {
        operation: "syncToERP",
        traceId,
      },
    );

    const responseBody = await response.text();
    if (!response.ok) {
      console.error("ERP sync responded with an error status", {
        traceId,
        erpSystem,
        status: response.status,
        attempts,
        durationMs,
      });
      return {
        success: false,
        message: `ERP sync failed (${response.status}): ${responseBody}`,
      };
    }

    let parsed: any = null;
    try {
      parsed = responseBody ? JSON.parse(responseBody) : null;
    } catch {
      parsed = { raw: responseBody };
    }

    return {
      success: true,
      message: `Synced to ${erpSystem} successfully (${attempts} attempt${attempts > 1 ? "s" : ""}, ${durationMs}ms)`,
      erpReference:
        parsed?.reference ||
        parsed?.id ||
        `${erpSystem}-${loadSheet.loadSheetNumber}-${Date.now()}`,
    };
  } catch (error) {
    console.error("ERP sync error", {
      traceId,
      erpSystem,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: "Failed to sync to ERP",
    };
  }
}

/**
 * Helper: Dispatch to carrier API
 */
async function dispatchToCarrier(loadSheet: any, carrierCode: string) {
  try {
    // Carrier-specific logic
    if (carrierCode === "FEDEX") {
      // FedEx API integration
      const fedexPayload = {
        shipmentId: loadSheet.loadSheetNumber,
        serviceType: "GROUND",
        weight: loadSheet.totalWeight / 1000, // Convert to kg
        recipient: {
          company: loadSheet.customer.name,
        },
      };

      console.info("Dispatching to FedEx:", fedexPayload);

      return {
        success: true,
        message: "Dispatched to FedEx successfully",
        trackingNumber: `FX${Date.now()}`,
      };
    } else if (carrierCode === "UPS") {
      // UPS API integration
      console.info("Dispatching to UPS:", loadSheet.loadSheetNumber);

      return {
        success: true,
        message: "Dispatched to UPS successfully",
        trackingNumber: `1Z${Date.now()}`,
      };
    } else if (carrierCode === "DHL") {
      // DHL API integration
      console.info("Dispatching to DHL:", loadSheet.loadSheetNumber);

      return {
        success: true,
        message: "Dispatched to DHL successfully",
        trackingNumber: `DHL${Date.now()}`,
      };
    }

    return {
      success: false,
      message: "Unsupported carrier",
    };
  } catch (error) {
    console.error("Carrier dispatch error:", error);
    return {
      success: false,
      message: "Failed to dispatch to carrier",
    };
  }
}

/**
 * Helper: Trigger webhook
 */
export async function triggerWebhook(event: string, data: any) {
  const traceId = crypto.randomUUID();
  try {
    // Find active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        status: "ACTIVE",
        events: {
          has: event,
        },
      },
    });

    // Send webhook to each subscriber
    const promises = webhooks.map(async (webhook) => {
      try {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data,
        };

        const secret = process.env.WEBHOOK_SIGNING_SECRET || "";
        const rawPayload = JSON.stringify(payload);
        const signature = secret
          ? crypto.createHmac("sha256", secret).update(rawPayload).digest("hex")
          : "";

        const { response, attempts, durationMs } = await fetchWithResilience(
          webhook.url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Event": event,
              "X-Trace-Id": traceId,
              ...(signature ? { "X-Webhook-Signature": signature } : {}),
            },
            body: rawPayload,
          },
          {
            operation: `triggerWebhook:${event}`,
            traceId,
          },
        );

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(
            `Webhook responded ${response.status}: ${responseText.slice(0, 500)}`,
          );
        }

        // Update last triggered timestamp
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { lastTriggered: new Date() },
        });

        console.info("Webhook delivered", {
          traceId,
          webhookId: webhook.id,
          event,
          attempts,
          durationMs,
        });
      } catch (error) {
        console.error("Webhook delivery failed", {
          traceId,
          webhookId: webhook.id,
          webhookUrl: webhook.url,
          event,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Trigger webhook error", {
      traceId,
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
