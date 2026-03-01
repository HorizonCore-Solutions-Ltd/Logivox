/**
 * Customer Portal — Printable Packing Slip
 * GET /api/portal/shipments/[id]/packing-slip
 *
 * Returns an HTML page the customer's browser can open and print.
 * Access is scoped to the authenticated customer's own shipments only.
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
            organizationId: true,
            organization: { select: { name: true } },
          },
        },
      },
    });

    if (!customerUser) {
      return new NextResponse("Customer access required", { status: 403 });
    }

    // Fetch shipment — must belong to an order owned by this customer
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: params.id,
        organizationId: customerUser.customer.organizationId,
        salesOrder: { customerId: customerUser.customerId },
      },
      include: {
        salesOrder: {
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: { sku: true, name: true, description: true },
                },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      return new NextResponse("Shipment not found", { status: 404 });
    }

    const org = customerUser.customer.organization;
    const order = shipment.salesOrder;

    const rowsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.inventoryItem?.sku ?? "—"}</td>
          <td>${item.inventoryItem?.name ?? "—"}</td>
          <td class="right">${item.quantity}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Packing Slip ${shipment.shipmentNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }
    h1 { font-size: 24px; font-weight: 700; color: #1d4ed8; }
    h2 { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .meta { text-align: right; }
    .meta .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta p { margin-bottom: 4px; }
    .section { margin-bottom: 28px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-block p { margin-bottom: 2px; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 8px 12px; text-align: left; font-size: 12px; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .right { text-align: right; }
    thead th.right { text-align: right; }
    .barcode-area { border: 2px dashed #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; color: #9ca3af; font-size: 12px; }
    .footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 16px; color: #9ca3af; font-size: 12px; text-align: center; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1e40af; }
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
      <p style="color:#6b7280;margin-top:2px;font-size:12px;">Packing Slip</p>
    </div>
    <div class="meta">
      <p class="label">Shipment #</p>
      <p style="font-size:20px;font-weight:700;">${shipment.shipmentNumber}</p>
      <p class="label" style="margin-top:8px;">Order #</p>
      <p style="font-weight:600;">${order.soNumber}</p>
      ${shipment.shippedDate ? `<p class="label" style="margin-top:8px;">Shipped</p><p>${new Date(shipment.shippedDate).toLocaleDateString()}</p>` : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h2>Carrier</h2>
      <p>${shipment.carrierName ?? "—"}</p>
      ${shipment.carrierService ? `<p>${shipment.carrierService}</p>` : ""}
    </div>
    <div class="info-block">
      <h2>Tracking</h2>
      ${
        shipment.trackingNumber
          ? `<p><strong>${shipment.trackingNumber}</strong></p>${
              shipment.trackingUrl
                ? `<p><a href="${shipment.trackingUrl}" style="color:#1d4ed8;">${shipment.trackingUrl}</a></p>`
                : ""
            }`
          : "<p>Not yet assigned</p>"
      }
    </div>
    <div class="info-block">
      <h2>Ship to</h2>
      ${shipment.recipientName ? `<p><strong>${shipment.recipientName}</strong></p>` : ""}
      ${shipment.addressLine1 ? `<p>${shipment.addressLine1}</p>` : ""}
      ${shipment.addressLine2 ? `<p>${shipment.addressLine2}</p>` : ""}
      ${shipment.city ? `<p>${[shipment.city, shipment.state, shipment.postalCode].filter(Boolean).join(", ")}</p>` : ""}
      ${shipment.country ? `<p>${shipment.country}</p>` : ""}
    </div>
    <div class="info-block">
      <h2>Status</h2>
      <p><span class="status-badge">${shipment.status}</span></p>
      ${shipment.estimatedDelivery ? `<p style="margin-top:6px;color:#6b7280;font-size:12px;">Est. delivery: ${new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>` : ""}
    </div>
  </div>

  <h2 style="margin-bottom:8px;">Items in this shipment</h2>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Description</th>
        <th class="right">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${shipment.notes ? `<p style="color:#6b7280;font-size:12px;margin-bottom:16px;"><strong>Notes:</strong> ${shipment.notes}</p>` : ""}

  <div class="footer">
    <p>${org.name} · Packing Slip · Generated ${new Date().toLocaleDateString()}</p>
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
    console.error("[portal/shipments/packing-slip] GET error:", message, error);
    return new NextResponse("Failed to generate packing slip", { status: 500 });
  }
}
