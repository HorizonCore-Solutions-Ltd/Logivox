export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/warehouse-transfers/[id]/complete - Complete transfer
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

    if (transfer.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Only in-progress transfers can be completed" },
        { status: 400 },
      );
    }

    // Check if inventory item has sufficient quantity
    if (transfer.inventoryItem.quantity < transfer.quantity) {
      return NextResponse.json(
        { error: "Insufficient inventory quantity" },
        { status: 400 },
      );
    }

    // Complete transfer in a transaction
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Update transfer status
        const updatedTransfer = await tx.warehouseTransfer.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            completedById: session.user.id,
            completedDate: new Date(),
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
            completedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Note: In a real implementation, you would update inventory location tracking
        // This would require additional inventory location records
        // For now, we're just marking the transfer as complete

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId: membership.organizationId,
            userId: session.user.id,
            action: "TRANSFER_COMPLETED",
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

        return updatedTransfer;
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error completing transfer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete transfer" },
      { status: 500 },
    );
  }
}
