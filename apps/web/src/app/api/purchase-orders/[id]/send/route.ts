export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================================
// POST /api/purchase-orders/[id]/send - Mark purchase order as sent
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    if (existingPO.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: `Cannot send purchase order with status: ${existingPO.status}`,
        },
        { status: 400 },
      );
    }

    const sentNote = `[${new Date().toISOString()}] Purchase order sent to supplier${existingPO.supplier.email ? ` (${existingPO.supplier.email})` : ""}.`;

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        internalNotes: existingPO.internalNotes
          ? `${existingPO.internalNotes}\n${sentNote}`
          : sentNote,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: "SEND",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        metadata: {
          poNumber: purchaseOrder.poNumber,
          status: "SENT",
          supplierEmail: existingPO.supplier.email,
        },
      },
    });

    return NextResponse.json({
      purchaseOrder,
      message: "Purchase order marked as sent",
    });
  } catch (error) {
    console.error("Error sending purchase order:", error);
    return NextResponse.json(
      { error: "Failed to send purchase order" },
      { status: 500 },
    );
  }
}
