import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    const [grns, total] = await Promise.all([
      prisma.goodsReceiptNote.findMany({
        where,
        include: { items: { take: 5 } },
        orderBy: { receivedDate: "desc" },
        take: limit,
      }),
      prisma.goodsReceiptNote.count({ where }),
    ]);
    return NextResponse.json({ grns, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;
    const body = await request.json();
    const { purchaseOrderId, warehouseId, items, ...rest } = body;
    if (!purchaseOrderId)
      return NextResponse.json(
        { error: "purchaseOrderId is required" },
        { status: 400 },
      );
    const grnNumber = `GRN-${Date.now()}`;
    const grn = await prisma.goodsReceiptNote.create({
      data: {
        ...rest,
        organizationId: orgId,
        purchaseOrderId,
        warehouseId,
        grnNumber,
        receivedById: session.user.id ?? "unknown",
        items: items ? { create: items } : undefined,
      },
      include: { items: true },
    });
    return NextResponse.json({ success: true, grn }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
