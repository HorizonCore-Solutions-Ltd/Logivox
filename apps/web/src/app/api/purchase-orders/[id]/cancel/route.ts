export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(1).optional(),
});

// ============================================================================
// POST /api/purchase-orders/[id]/cancel - Cancel purchase order
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

    const body = await req.json();
    const { reason } = cancelSchema.parse(body);

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        receipts: true,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }

    // Check if PO can be cancelled
    if (["RECEIVED", "CLOSED", "CANCELLED"].includes(existingPO.status)) {
      return NextResponse.json(
        {
          error: `Cannot cancel purchase order with status: ${existingPO.status}`,
        },
        { status: 400 },
      );
    }

    // Check if any items have been received
    if (existingPO.receipts.length > 0) {
      return NextResponse.json(
        { error: "Cannot cancel purchase order with receipts" },
        { status: 400 },
      );
    }

    // Cancel PO
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledDate: new Date(),
        internalNotes: reason
          ? `${existingPO.internalNotes || ""}\n\nCancellation Reason: ${reason}`
          : existingPO.internalNotes,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: "CANCEL",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        metadata: {
          poNumber: purchaseOrder.poNumber,
          status: "CANCELLED",
          reason: reason || "No reason provided",
        },
      },
    });

    return NextResponse.json({
      purchaseOrder,
      message: "Purchase order cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling purchase order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel purchase order" },
      { status: 500 },
    );
  }
}
