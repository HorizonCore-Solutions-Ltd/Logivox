/**
 * POST /api/sales-orders/bulk-action
 *
 * Apply an action to multiple sales orders in one request.
 *
 * Body:
 *   action     "release" | "generate-invoice" | "close" | "approve" | "cancel"
 *   orderIds   string[]
 *   options    Record<string,any>  – passed through to the individual handler
 *
 * Returns:
 *   { results: Array<{ orderId, success, message, error }> }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ACTIONS = ["release", "generate-invoice", "close", "approve", "cancel"] as const;
type BulkAction = (typeof VALID_ACTIONS)[number];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { action, orderIds, options = {} } = body;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 },
      );
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds must be a non-empty array" },
        { status: 400 },
      );
    }

    // Limit batch size
    if (orderIds.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 orders per bulk action" },
        { status: 400 },
      );
    }

    // Fetch all orders at once (org-scoped)
    const orders = await prisma.salesOrder.findMany({
      where: { id: { in: orderIds }, organizationId },
      include: {
        items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
        customer: { select: { id: true, name: true, email: true } },
        organization: { select: { name: true, invoiceSettings: true, currency: true } },
        shipments: { take: 1, orderBy: { createdAt: "desc" }, select: { shipmentNumber: true } },
      },
    });

    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const results: Array<{
      orderId: string;
      soNumber?: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    for (const orderId of orderIds) {
      const order = orderMap.get(orderId);
      if (!order) {
        results.push({ orderId, success: false, error: "Order not found" });
        continue;
      }

      try {
        switch (action as BulkAction) {
          // ── Approve ──────────────────────────────────────────────────────
          case "approve": {
            if (!["DRAFT", "PENDING_APPROVAL"].includes(order.status)) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: `Cannot approve order in status "${order.status}"`,
              });
              break;
            }
            await prisma.salesOrder.update({
              where: { id: orderId },
              data: {
                status: "APPROVED",
                approvedById: session.user.id,
                approvedDate: new Date(),
              },
            });
            results.push({ orderId, soNumber: order.soNumber, success: true, message: "Approved" });
            break;
          }

          // ── Release ───────────────────────────────────────────────────────
          case "release": {
            if (!["APPROVED", "DRAFT"].includes(order.status)) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: `Cannot release order in status "${order.status}"`,
              });
              break;
            }
            const warehouseId = options.warehouseId || order.warehouseId;
            if (!warehouseId) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: "No warehouse assigned",
              });
              break;
            }
            await prisma.salesOrder.update({
              where: { id: orderId },
              data: {
                status: "RELEASED",
                warehouseId,
                releasedDate: new Date(),
                releasedById: session.user.id,
              },
            });
            results.push({ orderId, soNumber: order.soNumber, success: true, message: "Released" });
            break;
          }

          // ── Generate Invoice ────────────────────────────────────────────
          case "generate-invoice": {
            if (order.invoiceNumber) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: `Already invoiced as ${order.invoiceNumber}`,
              });
              break;
            }

            const settings = (order.organization.invoiceSettings as any) ?? {};
            const termsNet = options.dueInDays ?? settings.termsNet ?? 30;
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setDate(dueDate.getDate() + termsNet);

            const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
            const count = await prisma.invoice.count({ where: { organizationId } });
            const invoiceNumber = `INV-${dateStr}-${String(count + results.filter(r => r.success && action === "generate-invoice").length + 1).padStart(4, "0")}`;

            const lineItems = order.items.map((item) => ({
              description: `${item.inventoryItem?.sku ? `[${item.inventoryItem.sku}] ` : ""}${item.inventoryItem?.name ?? "Product"}`,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              amount: item.quantity * Number(item.unitPrice) * (1 - Number(item.discount ?? 0) / 100),
            }));

            await prisma.invoice.create({
              data: {
                organizationId,
                customerId: order.customerId,
                invoiceNumber,
                billingPeriodStart: order.orderDate,
                billingPeriodEnd: today,
                dueDate,
                subtotal: Number(order.subtotal),
                taxAmount: Number(order.taxAmount),
                discountAmount: Number(order.discount),
                shippingAmount: Number(order.shippingCost),
                totalAmount: Number(order.total),
                currency: order.currency,
                status: "DRAFT",
                salesOrderId: order.id,
                soNumber: order.soNumber,
                paymentTerms: `Net ${termsNet}`,
                lineItems: { create: lineItems },
              },
            });

            await prisma.salesOrder.update({
              where: { id: orderId },
              data: { status: "INVOICED", invoiceNumber, invoicedAt: today },
            });

            results.push({
              orderId, soNumber: order.soNumber, success: true,
              message: `Invoice ${invoiceNumber} generated`,
            });
            break;
          }

          // ── Close ────────────────────────────────────────────────────────
          case "close": {
            const closeable = ["INVOICED", "SHIPPED", "DELIVERED", "APPROVED", "RELEASED", "PACKED"];
            if (!closeable.includes(order.status)) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: `Cannot close order in status "${order.status}"`,
              });
              break;
            }
            await prisma.salesOrder.update({
              where: { id: orderId },
              data: {
                status: "CLOSED",
                closedAt: new Date(),
                closedById: session.user.id,
              },
            });
            results.push({ orderId, soNumber: order.soNumber, success: true, message: "Closed" });
            break;
          }

          // ── Cancel ───────────────────────────────────────────────────────
          case "cancel": {
            if (["SHIPPED", "DELIVERED", "CLOSED"].includes(order.status)) {
              results.push({
                orderId, soNumber: order.soNumber, success: false,
                error: `Cannot cancel an already ${order.status.toLowerCase()} order`,
              });
              break;
            }
            await prisma.salesOrder.update({
              where: { id: orderId },
              data: { status: "CANCELLED" },
            });
            results.push({ orderId, soNumber: order.soNumber, success: true, message: "Cancelled" });
            break;
          }
        }
      } catch (err: any) {
        results.push({ orderId, soNumber: order.soNumber, success: false, error: err.message });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      summary: { total: orderIds.length, succeeded, failed },
      results,
    });
  } catch (error: any) {
    console.error("[bulk-action]", error);
    return NextResponse.json(
      { error: "Bulk action failed", detail: error.message },
      { status: 500 },
    );
  }
}
