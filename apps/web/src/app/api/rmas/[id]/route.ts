export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rmas/[id] - Get RMA details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 },
      );
    }

    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        customer: true,
        salesOrder: {
          include: {
            items: {
              select: {
                id: true,
                inventoryItemId: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
        returnReason: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inspectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
                barcode: true,
              },
            },
            salesOrderItem: {
              select: {
                id: true,
                quantity: true,
                unitPrice: true,
              },
            },
            restockLocation: {
              select: {
                id: true,
                locationCode: true,
                name: true,
              },
            },
            restockedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            exchangeItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    return NextResponse.json(rma);
  } catch (error) {
    console.error("Error fetching RMA:", error);
    return NextResponse.json({ error: "Failed to fetch RMA" }, { status: 500 });
  }
}

// DELETE /api/rmas/[id] - Cancel RMA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    // Can only cancel pending or approved RMAs
    if (!["PENDING", "APPROVED"].includes(rma.status)) {
      return NextResponse.json(
        { error: "Can only cancel pending or approved RMAs" },
        { status: 400 },
      );
    }

    await prisma.rMA.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RMA_CANCELLED",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
        },
      },
    });

    return NextResponse.json({ message: "RMA cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling RMA:", error);
    return NextResponse.json(
      { error: "Failed to cancel RMA" },
      { status: 500 },
    );
  }
}
