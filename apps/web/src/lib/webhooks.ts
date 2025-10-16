import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  organizationId: string
}

export async function triggerWebhook(
  organizationId: string,
  event: string,
  data: any
) {
  try {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: {
          has: event,
        },
      },
    })

    if (webhooks.length === 0) {
      return
    }

    // Create payload
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      organizationId,
    }

    // Deliver to each webhook
    const deliveryPromises = webhooks.map((webhook: any) =>
      deliverWebhook(webhook, payload)
    )

    await Promise.allSettled(deliveryPromises)
  } catch (error) {
    console.error("Webhook trigger error:", error)
  }
}

async function deliverWebhook(
  webhook: { id: string; url: string; secret: string | null },
  payload: WebhookPayload
) {
  const deliveryId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // Create signature if secret is provided
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Delivery": deliveryId,
    }

    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(JSON.stringify(payload))
        .digest("hex")
      headers["X-Webhook-Signature"] = `sha256=${signature}`
    }

    // Send webhook
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    const duration = Date.now() - startTime
    const responseBody = await response.text().catch(() => "")

    // Log delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.stringify(payload),
        statusCode: response.status,
        responseBody: responseBody.substring(0, 10000), // Limit response size
        duration,
        success: response.ok,
      },
    })

    return { success: response.ok, statusCode: response.status }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Log failed delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.stringify(payload),
        statusCode: 0,
        responseBody: errorMessage,
        duration,
        success: false,
      },
    })

    return { success: false, error: errorMessage }
  }
}

// Helper to trigger specific events
export const WebhookEvents = {
  INVENTORY_CREATED: "inventory.created",
  INVENTORY_UPDATED: "inventory.updated",
  INVENTORY_DELETED: "inventory.deleted",
  BOOKING_CREATED: "booking.created",
  BOOKING_UPDATED: "booking.updated",
  BOOKING_FULFILLED: "booking.fulfilled",
  BOOKING_CANCELLED: "booking.cancelled",
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  LOW_STOCK_ALERT: "inventory.low_stock",
}
