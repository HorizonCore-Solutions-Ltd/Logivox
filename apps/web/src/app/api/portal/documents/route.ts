/**
 * Customer Portal - Documents API
 * GET /api/portal/documents
 *
 * Returns a unified list of downloadable documents for the authenticated customer:
 *   - INVOICE      — one per shipped/delivered SalesOrder
 *   - PACKING_SLIP — one per Shipment
 *
 * Query params:
 *   type   (optional) INVOICE | PACKING_SLIP
 *   from   (optional) ISO date string — filter by document date >= from
 *   to     (optional) ISO date string — filter by document date <= to
 *   search (optional) free-text match on reference number
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PortalDocumentType = "INVOICE" | "PACKING_SLIP";

export interface PortalDocument {
  id: string;
  type: PortalDocumentType;
  title: string;
  reference: string; // SO number or shipment number
  date: string; // ISO date string
  amount: number | null; // total — null for packing slips
  currency: string;
  status: string;
  downloadUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve customer record via CustomerUser join
    const customerUser = await prisma.customerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        customerId: true,
        customer: { select: { organizationId: true } },
      },
    });

    if (!customerUser) {
      return NextResponse.json(
        { error: "Customer access required" },
        { status: 403 },
      );
    }

    const { customerId, customer } = customerUser;
    const organizationId = customer.organizationId;

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as PortalDocumentType | null;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const searchTerm = searchParams.get("search")?.toLowerCase();

    const fromDate = fromParam ? new Date(fromParam) : undefined;
    const toDate = toParam ? new Date(toParam) : undefined;

    const documents: PortalDocument[] = [];

    // ── 1. Invoices (one per shipped / delivered SalesOrder) ───────────────
    if (!typeFilter || typeFilter === "INVOICE") {
      const orders = await prisma.salesOrder.findMany({
        where: {
          customerId,
          organizationId,
          status: { in: ["SHIPPED", "DELIVERED"] },
          ...(fromDate && { orderDate: { gte: fromDate } }),
          ...(toDate && { orderDate: { lte: toDate } }),
        },
        select: {
          id: true,
          soNumber: true,
          orderDate: true,
          total: true,
          currency: true,
          status: true,
          paymentStatus: true,
        },
        orderBy: { orderDate: "desc" },
        take: 100,
      });

      for (const order of orders) {
        if (searchTerm && !order.soNumber.toLowerCase().includes(searchTerm)) {
          continue;
        }

        documents.push({
          id: `invoice-${order.id}`,
          type: "INVOICE",
          title: `Invoice — ${order.soNumber}`,
          reference: order.soNumber,
          date: order.orderDate.toISOString(),
          amount: Number(order.total),
          currency: order.currency,
          status: order.paymentStatus,
          downloadUrl: `/api/portal/orders/${order.id}/invoice`,
        });
      }
    }

    // ── 2. Packing slips (one per Shipment) ────────────────────────────────
    if (!typeFilter || typeFilter === "PACKING_SLIP") {
      const shipments = await prisma.shipment.findMany({
        where: {
          organizationId,
          salesOrder: { customerId },
          status: {
            in: ["SHIPPED", "DELIVERED", "IN_TRANSIT", "OUT_FOR_DELIVERY"],
          },
          ...(fromDate && { shippedDate: { gte: fromDate } }),
          ...(toDate && { shippedDate: { lte: toDate } }),
        },
        select: {
          id: true,
          shipmentNumber: true,
          shippedDate: true,
          estimatedDelivery: true,
          actualDelivery: true,
          status: true,
          carrierName: true,
          trackingNumber: true,
          currency: true,
          salesOrder: { select: { soNumber: true, id: true } },
        },
        orderBy: { shippedDate: "desc" },
        take: 100,
      });

      for (const shipment of shipments) {
        if (
          searchTerm &&
          !shipment.shipmentNumber.toLowerCase().includes(searchTerm) &&
          !(shipment.salesOrder?.soNumber ?? "")
            .toLowerCase()
            .includes(searchTerm)
        ) {
          continue;
        }

        const dateForDoc =
          shipment.shippedDate ?? shipment.actualDelivery ?? new Date();

        documents.push({
          id: `packing-${shipment.id}`,
          type: "PACKING_SLIP",
          title: `Packing Slip — ${shipment.shipmentNumber}`,
          reference: shipment.shipmentNumber,
          date: dateForDoc.toISOString(),
          amount: null,
          currency: shipment.currency ?? "USD",
          status: shipment.status,
          downloadUrl: `/api/portal/shipments/${shipment.id}/packing-slip`,
        });
      }
    }

    // Sort merged list by date descending
    documents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({ documents, total: documents.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[portal/documents] GET error:", message, error);
    return NextResponse.json(
      { error: "Failed to load documents" },
      { status: 500 },
    );
  }
}
