/**
 * Customer Portal — Printable Invoice
 * GET /api/portal/orders/[id]/invoice
 *
 * Returns an HTML page the customer's browser can open and print/save-as-PDF.
 * Access is scoped to the authenticated customer's own orders only.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify customer identity
    const customerUser = await prisma.customerUser.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: {
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            organizationId: true,
            organization: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!customerUser) {
      return new NextResponse("Customer access required", { status: 403 });
    }

    // Fetch order — must belong to this customer
    const order = await prisma.salesOrder.findFirst({
      where: {
        id: params.id,
        customerId: customerUser.customerId,
        organizationId: customerUser.customer.organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: { sku: true, name: true, description: true },
            },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const org = customerUser.customer.organization;
    const cust = customerUser.customer;

    const fmt = (n: number | string | null | undefined) =>
      `$${Number(n ?? 0).toFixed(2)}`;

    const rowsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.inventoryItem?.sku ?? "—"}</td>
          <td>${item.inventoryItem?.name ?? "—"}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${fmt(item.unitPrice)}</td>
          <td class="right">${fmt(Number(item.unitPrice) * item.quantity)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${order.soNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }
    h1 { font-size: 28px; font-weight: 700; color: #1d4ed8; }
    h2 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .meta { text-align: right; }
    .meta p { margin-bottom: 2px; }
    .meta .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .addresses { display: flex; gap: 60px; margin-bottom: 32px; }
    .address-block p { margin-bottom: 2px; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 8px 12px; text-align: left; font-size: 12px; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .right { text-align: right; }
    thead th.right { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals table { margin-bottom: 0; }
    .totals tbody td { border: none; }
    .totals .grand { font-weight: 700; font-size: 15px; border-top: 2px solid #1d4ed8; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .status-PAID { background: #d1fae5; color: #065f46; }
    .status-UNPAID { background: #fee2e2; color: #991b1b; }
    .status-PARTIAL { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 16px; color: #9ca3af; font-size: 12px; text-align: center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${org.name}</h1>
      <p style="color:#6b7280;margin-top:4px;">Warehouse Management System</p>
    </div>
    <div class="meta">
      <p class="label">Invoice</p>
      <p style="font-size:22px;font-weight:700;">${order.soNumber}</p>
      <p class="label" style="margin-top:8px;">Date</p>
      <p>${new Date(order.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p class="label" style="margin-top:8px;">Payment status</p>
      <p><span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></p>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h2>Billed to</h2>
      <p><strong>${cust.name}</strong></p>
      ${cust.email ? `<p>${cust.email}</p>` : ""}
      ${cust.phone ? `<p>${cust.phone}</p>` : ""}
      ${cust.address ? `<p>${cust.address}</p>` : ""}
      ${cust.city ? `<p>${cust.city}</p>` : ""}
      ${cust.country ? `<p>${cust.country}</p>` : ""}
    </div>
    <div class="address-block">
      <h2>Ship to</h2>
      ${order.shippingAddress ? `<p>${order.shippingAddress}</p>` : ""}
      ${order.shippingCity ? `<p>${order.shippingCity}</p>` : ""}
      ${order.shippingState ? `<p>${order.shippingState}</p>` : ""}
      ${order.shippingZip ? `<p>${order.shippingZip}</p>` : ""}
      ${order.shippingCountry ? `<p>${order.shippingCountry}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tbody>
        <tr>
          <td>Subtotal</td>
          <td class="right">${fmt(order.subtotal)}</td>
        </tr>
        <tr>
          <td>Shipping</td>
          <td class="right">${fmt(order.shippingCost)}</td>
        </tr>
        <tr>
          <td>Tax</td>
          <td class="right">${fmt(order.taxAmount)}</td>
        </tr>
        <tr>
          <td>Discount</td>
          <td class="right">− ${fmt(order.discount)}</td>
        </tr>
        <tr class="grand">
          <td>Total (${order.currency})</td>
          <td class="right">${fmt(order.total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${order.notes ? `<p style="margin-top:24px;color:#6b7280;font-size:12px;"><strong>Notes:</strong> ${order.notes}</p>` : ""}

  <div class="footer">
    <p>Thank you for your business · ${org.name} · Generated ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="no-print" style="text-align:center;margin-top:32px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[portal/orders/invoice] GET error:", message, error);
    return new NextResponse("Failed to generate invoice", { status: 500 });
  }
}
