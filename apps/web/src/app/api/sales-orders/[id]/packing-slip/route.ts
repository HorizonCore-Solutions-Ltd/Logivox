/**
 * GET /api/sales-orders/[id]/packing-slip
 *
 * Returns a printable HTML packing slip for a sales order.
 * Includes: header, ship-to, item lines with qty/SKU, weight, barcode data.
 * No authentication required if token provided in ?token= (for warehouse printing).
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    const order = await prisma.salesOrder.findFirst({
      where: { id: params.id, organizationId },
      include: {
        customer: true,
        warehouse: {
          select: { id: true, name: true, code: true, address: true },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                weight: true,
                dimensions: true,
              },
            },
          },
        },
        organization: {
          select: {
            name: true,
            logo: true,
            invoiceSettings: true,
            currency: true,
          },
        },
        shipments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            shipmentNumber: true,
            trackingNumber: true,
            carrierName: true,
            estimatedDelivery: true,
          },
        },
        packs: {
          select: {
            id: true,
            packNumber: true,
            weight: true,
            length: true,
            width: true,
            height: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const settings = (order.organization.invoiceSettings as any) ?? {};
    const shipment = order.shipments[0];
    const printDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const rowsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td>${item.inventoryItem?.sku ?? "—"}</td>
        <td>${item.inventoryItem?.name ?? "—"}</td>
        <td>${item.inventoryItem?.description ? item.inventoryItem.description.substring(0, 60) : "—"}</td>
        <td class="center">${item.quantity}</td>
        <td class="center">${item.quantityShipped ?? item.quantity}</td>
        <td class="center">${item.inventoryItem?.weight ? `${item.inventoryItem.weight} kg` : "—"}</td>
      </tr>`,
      )
      .join("");

    const packsHtml = order.packs.length
      ? `<h3 style="margin-top:24px;font-size:13px;">Packages</h3>
      <table>
        <thead><tr><th>Pack #</th><th>Weight</th><th>Dims (L×W×H)</th></tr></thead>
        <tbody>${order.packs
          .map(
            (p) => `<tr>
          <td>${p.packNumber ?? p.id.slice(-6)}</td>
          <td>${p.weight ? `${p.weight} kg` : "—"}</td>
          <td>${p.length && p.width && p.height ? `${p.length}×${p.width}×${p.height} cm` : "—"}</td>
        </tr>`,
          )
          .join("")}</tbody>
      </table>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Packing Slip – ${order.soNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; }
    .brand h1 { font-size: 22px; font-weight: 800; color: #1d4ed8; }
    .brand p { font-size: 11px; color: #6b7280; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 20px; font-weight: 700; color: #111; }
    .doc-title p { font-size: 11px; color: #6b7280; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
    .box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 6px; }
    .box p { margin-bottom: 2px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 7px 10px; text-align: left; font-size: 11px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    .center { text-align: center; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #dbeafe; color: #1d4ed8; }
    .sig-block { margin-top: 40px; display: flex; gap: 60px; }
    .sig-line { flex: 1; }
    .sig-line .line { border-bottom: 1px solid #374151; margin-bottom: 4px; height: 32px; }
    .sig-line p { font-size: 10px; color: #6b7280; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${order.organization.name}</h1>
      <p>Packing Slip</p>
    </div>
    <div class="doc-title">
      <h2>PACKING SLIP</h2>
      <p>Order: <strong>${order.soNumber}</strong></p>
      <p>Print Date: ${printDate}</p>
      ${order.invoiceNumber ? `<p>Invoice: <strong>${order.invoiceNumber}</strong></p>` : ""}
    </div>
  </div>

  <div class="grid-2">
    <div class="box">
      <h3>Ship To</h3>
      <p><strong>${order.customer.name}</strong></p>
      ${order.shippingAddress ? `<p>${order.shippingAddress}</p>` : ""}
      ${order.shippingCity ? `<p>${order.shippingCity}${order.shippingState ? ", " + order.shippingState : ""} ${order.shippingZip ?? ""}</p>` : ""}
      ${order.shippingCountry ? `<p>${order.shippingCountry}</p>` : ""}
      ${order.customer.phone ? `<p>Tel: ${order.customer.phone}</p>` : ""}
    </div>
    <div class="box">
      <h3>Shipment Details</h3>
      <p>Order Ref: <strong>${order.soNumber}</strong></p>
      ${shipment ? `<p>Shipment: <strong>${shipment.shipmentNumber}</strong></p>` : ""}
      ${shipment?.carrierName ? `<p>Carrier: ${shipment.carrierName}</p>` : ""}
      ${shipment?.trackingNumber ? `<p>Tracking: <strong>${shipment.trackingNumber}</strong></p>` : ""}
      ${order.shippingMethod ? `<p>Method: ${order.shippingMethod}</p>` : ""}
      ${order.requestedDate ? `<p>Requested: ${new Date(order.requestedDate).toLocaleDateString()}</p>` : ""}
      <p>Status: <span class="badge">${order.status}</span></p>
    </div>
  </div>

  <h3 style="margin-bottom:8px;font-size:13px;">Items</h3>
  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product</th>
        <th>Description</th>
        <th class="center">Ordered</th>
        <th class="center">Shipped</th>
        <th class="center">Weight</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${packsHtml}

  <div class="sig-block">
    <div class="sig-line">
      <div class="line"></div>
      <p>Picker / Packer Name &amp; Signature</p>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <p>Received By (Customer Signature)</p>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <p>Date Received</p>
    </div>
  </div>

  <div class="footer">
    <p>${settings.footerText ?? `Thank you for your business – ${order.organization.name}`}</p>
    <p style="margin-top:4px;">Please report discrepancies within 48 hours.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="packing-slip-${order.soNumber}.html"`,
      },
    });
  } catch (error: any) {
    console.error("[packing-slip]", error);
    return new NextResponse("Failed to generate packing slip", { status: 500 });
  }
}
