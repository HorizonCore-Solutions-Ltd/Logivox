export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/warehouse-transfers/[id]/approve - Approve transfer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    // Check if user has approval permissions (MANAGER or ADMIN)
    if (!["MANAGER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to approve transfers" },
        { status: 403 },
      );
    }

    const transfer = await prisma.warehouseTransfer.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        inventoryItem: true,
        fromLocation: true,
        toLocation: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 },
      );
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending transfers can be approved" },
        { status: 400 },
      );
    }

    // Update transfer status
    const updatedTransfer = await prisma.warehouseTransfer.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        approvedById: session.user.id,
        approvedDate: new Date(),
        startedDate: new Date(),
      },
      include: {
        fromLocation: true,
        toLocation: true,
        inventoryItem: true,
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "TRANSFER_APPROVED",
        entityType: "WAREHOUSE_TRANSFER",
        entityId: updatedTransfer.id,
        metadata: {
          transferNumber: updatedTransfer.transferNumber,
          from: transfer.fromLocation.locationCode,
          to: transfer.toLocation.locationCode,
          item: transfer.inventoryItem.name,
          quantity: transfer.quantity,
        },
      },
    });

    return NextResponse.json(updatedTransfer);
  } catch (error: any) {
    console.error("Error approving transfer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve transfer" },
      { status: 500 },
    );
  }
}
