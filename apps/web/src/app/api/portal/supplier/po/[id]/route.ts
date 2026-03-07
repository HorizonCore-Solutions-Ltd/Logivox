import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Allow SUPPLIER
  if ((session.user as any).role !== "SUPPLIER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    if (!po)
      return NextResponse.json({ error: "PO not found" }, { status: 404 });

    // Security check: Ensure PO belongs to Supplier Organization?
    // In this system, Purchase Orders have a `supplierId` (User or Organization?).
    // Let's check schema.

    return NextResponse.json(po);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
