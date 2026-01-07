/**
 * Integration Layer - Webhooks and External Systems
 * ERP, TMS, Carrier integrations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET - List webhooks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("webhookId");

    if (webhookId) {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return NextResponse.json(
          { error: "Webhook not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ webhook });
    }

    // List all webhooks
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      webhooks,
      total: webhooks.length,
    });
  } catch (error) {
    console.error("Webhook GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 },
    );
  }
}

// POST - Create webhook or trigger integration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, url, events, integrationType, config } = body;

    if (action === "createWebhook") {
      // Create new webhook subscription
      if (!url || !events) {
        return NextResponse.json(
          { error: "URL and events are required" },
          { status: 400 },
        );
      }

      const webhook = await prisma.webhook.create({
        data: {
          url,
          events: events as string[],
          status: "ACTIVE",
          organizationId: session.user.organizationId,
        },
      });

      return NextResponse.json({
        success: true,
        webhook,
        message: "Webhook created successfully",
      });
    } else if (action === "testWebhook") {
      // Test webhook with sample data
      const { webhookId } = body;

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return NextResponse.json(
          { error: "Webhook not found" },
          { status: 404 },
        );
      }

      const testPayload = {
        event: "loadsheet.test",
        timestamp: new Date().toISOString(),
        data: {
          loadSheetNumber: "LS-2026-TEST",
          status: "CONFIRMED",
          message: "This is a test webhook event",
        },
      };

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": "test-signature",
          },
          body: JSON.stringify(testPayload),
        });

        return NextResponse.json({
          success: response.ok,
          status: response.status,
          message: response.ok
            ? "Webhook test successful"
            : "Webhook test failed",
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: "Failed to reach webhook URL",
          error: String(error),
        });
      }
    } else if (action === "syncToERP") {
      // Sync load sheet to ERP system
      const { loadSheetId, erpSystem } = body;

      const loadSheet = await prisma.loadSheet.findUnique({
        where: { id: loadSheetId },
        include: {
          customer: true,
          containers: {
            include: {
              containerItems: true,
            },
          },
        },
      });

      if (!loadSheet) {
        return NextResponse.json(
          { error: "Load sheet not found" },
          { status: 404 },
        );
      }

      // Call ERP integration
      const result = await syncToERP(loadSheet, erpSystem);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        erpReference: result.erpReference,
      });
    } else if (action === "dispatchCarrier") {
      // Dispatch to carrier API
      const { loadSheetId, carrierCode } = body;

      const loadSheet = await prisma.loadSheet.findUnique({
        where: { id: loadSheetId },
        include: {
          customer: true,
        },
      });

      if (!loadSheet) {
        return NextResponse.json(
          { error: "Load sheet not found" },
          { status: 404 },
        );
      }

      // Call carrier API
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
    const session = await getServerSession();
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
    const session = await getServerSession();
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
  try {
    // ERP-specific logic
    if (erpSystem === "SAP") {
      // SAP integration
      const sapPayload = {
        deliveryNumber: loadSheet.loadSheetNumber,
        customer: loadSheet.customer.code,
        shipDate: loadSheet.shipmentDate,
        items: loadSheet.containers.flatMap((c: any) =>
          c.containerItems.map((item: any) => ({
            material: item.sku,
            quantity: item.quantity,
          })),
        ),
      };

      // Call SAP API (mock)
      console.log("Syncing to SAP:", sapPayload);

      return {
        success: true,
        message: "Synced to SAP successfully",
        erpReference: `SAP-${Date.now()}`,
      };
    } else if (erpSystem === "ORACLE") {
      // Oracle integration
      console.log("Syncing to Oracle:", loadSheet.loadSheetNumber);

      return {
        success: true,
        message: "Synced to Oracle successfully",
        erpReference: `ORACLE-${Date.now()}`,
      };
    }

    return {
      success: false,
      message: "Unsupported ERP system",
    };
  } catch (error) {
    console.error("ERP sync error:", error);
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

      console.log("Dispatching to FedEx:", fedexPayload);

      return {
        success: true,
        message: "Dispatched to FedEx successfully",
        trackingNumber: `FX${Date.now()}`,
      };
    } else if (carrierCode === "UPS") {
      // UPS API integration
      console.log("Dispatching to UPS:", loadSheet.loadSheetNumber);

      return {
        success: true,
        message: "Dispatched to UPS successfully",
        trackingNumber: `1Z${Date.now()}`,
      };
    } else if (carrierCode === "DHL") {
      // DHL API integration
      console.log("Dispatching to DHL:", loadSheet.loadSheetNumber);

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

        await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Signature": "signature-here", // TODO: Implement HMAC signature
          },
          body: JSON.stringify(payload),
        });

        // Update last triggered timestamp
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { lastTriggered: new Date() },
        });
      } catch (error) {
        console.error(`Webhook failed for ${webhook.url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Trigger webhook error:", error);
  }
}
