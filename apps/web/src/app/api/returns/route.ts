import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET /api/returns  – list RMAs with summary stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      (where as any).OR = [
        { rmaNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [rmas, total, pendingCount, approvedCount, receivedCount] = await Promise.all([
      prisma.rMA.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          returnReason: { select: { name: true, code: true } },
          items: { select: { id: true, quantityRequested: true, refundAmount: true } },
          salesOrder: { select: { soNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.rMA.count({ where }),
      prisma.rMA.count({ where: { status: "PENDING" } }),
      prisma.rMA.count({ where: { status: "APPROVED" } }),
      prisma.rMA.count({ where: { status: "RECEIVED" } }),
    ]);

    // Total refund value of open/in-progress RMAs
    const openRmas = await prisma.rMA.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] } },
      select: { totalRefundAmount: true },
    });
    const refundValue = openRmas.reduce(
      (sum, r) => sum + Number(r.totalRefundAmount ?? 0),
      0,
    );

    const returns = rmas.map((r) => ({
      id: r.id,
      rmaNumber: r.rmaNumber,
      status: r.status,
      reason: r.returnReason.name,
      customerId: r.customerId,
      customerName: r.customer.name,
      orderId: r.salesOrderId,
      orderNumber: r.salesOrder?.soNumber,
      totalItems: r.items.reduce((s, i) => s + i.quantityRequested, 0),
      refundAmount: r.items.reduce((s, i) => s + Number(i.refundAmount ?? 0), 0),
      lines: r.items.map((i) => ({ id: i.id })),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      returns,
      total,
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        received: receivedCount,
        refundValue: Math.round(refundValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error("GET /api/returns error:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}
