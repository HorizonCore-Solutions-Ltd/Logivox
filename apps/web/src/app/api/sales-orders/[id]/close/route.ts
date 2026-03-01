/**
 * POST /api/sales-orders/[id]/close
 *
 * Closes a SalesOrder. Validates that an invoice has been generated.
 * Optionally records a payment before closing.
 *
 * Body (all optional):
 *   recordPayment   boolean   – mark invoice as paid on close
 *   paymentRef      string    – payment reference / transaction ID
 *   paymentMethod   string    – BANK_TRANSFER | CARD | CASH | CREDIT_NOTE | OTHER
 *   paidAmount      number    – amount received (defaults to full total)
 *   notes           string    – closure notes
 *   force           boolean   – close even if no invoice (admin override)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const order = await prisma.salesOrder.findFirst({
      where: { id: params.id, organizationId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const closeable = [
      "INVOICED",
      "SHIPPED",
      "DELIVERED",
      "APPROVED",
      "RELEASED",
      "PACKED",
    ];
    if (!closeable.includes(order.status) && order.status !== "CLOSED") {
      return NextResponse.json(
        { error: `Cannot close order in status "${order.status}"` },
        { status: 422 },
      );
    }

    if (order.status === "CLOSED") {
      return NextResponse.json(
        { error: "Order is already closed" },
        { status: 422 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      recordPayment = false,
      paymentRef,
      paymentMethod = "OTHER",
      paidAmount,
      notes,
      force = false,
    } = body;

    // Invoice check (unless forced)
    if (!force && !order.invoiceNumber) {
      return NextResponse.json(
        {
          error:
            "No invoice has been generated for this order. Generate an invoice first or pass force=true.",
        },
        { status: 422 },
      );
    }

    const effectivePaidAmount = paidAmount ?? Number(order.total);
    const newPaymentStatus =
      effectivePaidAmount >= Number(order.total) ? "PAID" : "PARTIAL";

    // Build update data
    const updateData: any = {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: session.user.id,
    };

    if (recordPayment) {
      updateData.paymentStatus = newPaymentStatus;
      updateData.paidAmount = effectivePaidAmount;
      updateData.paymentMethod = paymentMethod;
    }

    if (notes) {
      updateData.internalNotes = order.internalNotes
        ? `${order.internalNotes}\n[CLOSE] ${notes}`
        : `[CLOSE] ${notes}`;
    }

    const updatedOrder = await prisma.salesOrder.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update linked invoice to PAID if payment recorded
    if (recordPayment && order.invoiceNumber) {
      await prisma.invoice.updateMany({
        where: { soNumber: order.soNumber, organizationId },
        data: {
          status: newPaymentStatus === "PAID" ? "PAID" : "PARTIALLY_PAID",
          paidAmount: effectivePaidAmount,
          paymentDate: new Date(),
          paymentRef: paymentRef ?? null,
          paymentMethod: paymentMethod,
        },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SALES_ORDER_CLOSED",
        resourceType: "SalesOrder",
        resourceId: params.id,
        details: {
          soNumber: order.soNumber,
          recordPayment,
          paymentRef,
          paidAmount: effectivePaidAmount,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${order.soNumber} closed${recordPayment ? ` — payment of ${order.currency} ${effectivePaidAmount.toFixed(2)} recorded` : ""}`,
    });
  } catch (error: any) {
    console.error("[close-order]", error);
    return NextResponse.json(
      { error: "Failed to close order", detail: error.message },
      { status: 500 },
    );
  }
}
