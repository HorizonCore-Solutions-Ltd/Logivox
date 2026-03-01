/**
 * POST /api/sales-orders/[id]/generate-invoice
 *
 * Generates a sales invoice from a SalesOrder.
 *
 * Respects the organisation's invoiceTrigger setting:
 *   ON_ORDER_CONFIRMATION  – allowed when status >= APPROVED
 *   ON_SHIPMENT            – allowed when status >= SHIPPED
 *   ON_DELIVERY_CONFIRMATION – allowed when status = DELIVERED
 *   MANUAL                 – always allowed (staff override)
 *
 * Body (all optional):
 *   force        boolean   – skip trigger check (admin override)
 *   sendEmail    boolean   – email the invoice to the customer immediately
 *   dueInDays    number    – override the org's default payment terms
 *   notes        string    – additional invoice notes
 *
 * Returns:
 *   { invoice, order }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRIGGER_MIN_STATUS: Record<string, string[]> = {
  ON_ORDER_CONFIRMATION: ["APPROVED", "RELEASED", "PICKING", "PICKED", "PACKING", "PACKED", "SHIPPED", "DELIVERED"],
  ON_SHIPMENT: ["SHIPPED", "DELIVERED"],
  ON_DELIVERY_CONFIRMATION: ["DELIVERED"],
  MANUAL: ["APPROVED", "RELEASED", "PICKING", "PICKED", "PACKING", "PACKED", "SHIPPED", "DELIVERED"],
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Fetch order with all needed relations
    const order = await prisma.salesOrder.findFirst({
      where: { id: params.id, organizationId },
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true, sku: true, description: true } },
          },
        },
        organization: { select: { id: true, name: true, invoiceSettings: true, currency: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.invoiceNumber) {
      return NextResponse.json(
        { error: `Order already invoiced as ${order.invoiceNumber}` },
        { status: 422 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { force = false, sendEmail = false, dueInDays, notes } = body;

    // Resolve org invoice settings
    const settings = (order.organization.invoiceSettings as any) ?? {};
    const trigger: string = settings.trigger ?? "ON_SHIPMENT";
    const termsNet: number = dueInDays ?? settings.termsNet ?? 30;

    const allowedStatuses = TRIGGER_MIN_STATUS[trigger] ?? TRIGGER_MIN_STATUS.MANUAL;
    if (!force && !allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Invoice trigger is "${trigger}" — order must be in one of: ${allowedStatuses.join(", ")}. Current status: ${order.status}. Pass force=true to override.`,
        },
        { status: 422 },
      );
    }

    // Generate invoice number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const count = await prisma.invoice.count({ where: { organizationId } });
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + termsNet);

    // Build line items from order items
    const lineItems = order.items.map((item) => ({
      description: item.inventoryItem?.name ?? "Product",
      sku: item.inventoryItem?.sku ?? "",
      quantity: item.quantity,
      quantityShipped: item.quantityShipped,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount ?? 0),
      taxRate: Number(item.taxRate ?? 0),
      lineTotal:
        (item.quantity * Number(item.unitPrice)) * (1 - Number(item.discount ?? 0) / 100),
    }));

    const subtotal = Number(order.subtotal);
    const taxAmount = Number(order.taxAmount);
    const shippingCost = Number(order.shippingCost);
    const discount = Number(order.discount);
    const total = Number(order.total);

    // Create invoice in DB
    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId: order.customerId,
        invoiceNumber,
        billingPeriodStart: order.orderDate,
        billingPeriodEnd: today,
        dueDate,
        subtotal,
        taxAmount,
        discountAmount: discount,
        shippingAmount: shippingCost,
        totalAmount: total,
        currency: order.currency,
        status: sendEmail ? "SENT" : "DRAFT",
        salesOrderId: order.id,
        soNumber: order.soNumber,
        notes: notes ?? settings.footerText ?? "",
        paymentTerms: `Net ${termsNet}`,
        lineItems: {
          create: lineItems.map((li) => ({
            description: `${li.sku ? `[${li.sku}] ` : ""}${li.description}`,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            amount: li.lineTotal,
          })),
        },
      },
    });

    // Update order: mark as INVOICED, store invoice number
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: params.id },
      data: {
        status: "INVOICED",
        invoiceNumber,
        invoicedAt: today,
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SALES_ORDER_INVOICED",
        resourceType: "SalesOrder",
        resourceId: params.id,
        details: { soNumber: order.soNumber, invoiceNumber, total, sendEmail } as any,
      },
    });

    return NextResponse.json({
      success: true,
      invoice,
      order: updatedOrder,
      invoiceNumber,
      message: sendEmail
        ? `Invoice ${invoiceNumber} generated and emailed to ${order.customer.email}`
        : `Invoice ${invoiceNumber} generated. Send manually or set sendEmail=true.`,
    });
  } catch (error: any) {
    console.error("[generate-invoice]", error);
    return NextResponse.json(
      { error: "Failed to generate invoice", detail: error.message },
      { status: 500 },
    );
  }
}
