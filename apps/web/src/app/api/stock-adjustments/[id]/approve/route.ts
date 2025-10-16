import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const approveSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

// POST /api/stock-adjustments/[id]/approve - Approve or reject adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { status: 404 }
      );
    }

    // Check if user has approval permissions
    if (!["MANAGER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to approve adjustments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { approved, rejectionReason } = approveSchema.parse(body);

    const adjustment = await prisma.stockAdjustment.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        inventoryItem: true,
        location: true,
      },
    });

    if (!adjustment) {
      return NextResponse.json(
        { error: "Adjustment not found" },
        { status: 404 }
      );
    }

    if (adjustment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending adjustments can be approved/rejected" },
        { status: 400 }
      );
    }

    // Handle approval or rejection in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (approved) {
        // Approve and apply adjustment
        const updatedAdjustment = await tx.stockAdjustment.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            approvedById: session.user.id,
            approvedDate: new Date(),
            completedById: session.user.id,
            completedDate: new Date(),
          },
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
            location: {
              select: {
                id: true,
                locationCode: true,
                name: true,
              },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Update inventory quantity
        const updatedInventory = await tx.inventoryItem.update({
          where: { id: adjustment.inventoryId },
          data: {
            quantity: adjustment.quantityAfter,
            availableQty: adjustment.quantityAfter - adjustment.inventoryItem.reservedQty,
          },
        });

        // Check inventory status
        let newStatus = updatedInventory.status;
        if (updatedInventory.quantity === 0) {
          newStatus = "OUT_OF_STOCK";
        } else if (
          updatedInventory.minStockLevel &&
          updatedInventory.quantity <= updatedInventory.minStockLevel
        ) {
          newStatus = "LOW_STOCK";
        } else {
          newStatus = "ACTIVE";
        }

        if (newStatus !== updatedInventory.status) {
          await tx.inventoryItem.update({
            where: { id: adjustment.inventoryId },
            data: { status: newStatus },
          });
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId: membership.organizationId,
            userId: session.user.id,
            action: "ADJUSTMENT_APPROVED",
            entityType: "STOCK_ADJUSTMENT",
            entityId: updatedAdjustment.id,
            metadata: {
              adjustmentNumber: updatedAdjustment.adjustmentNumber,
              item: adjustment.inventoryItem.name,
              quantityChange: adjustment.quantityChange,
              reason: adjustment.reason,
              quantityBefore: adjustment.quantityBefore,
              quantityAfter: adjustment.quantityAfter,
            },
          },
        });

        return updatedAdjustment;
      } else {
        // Reject adjustment
        if (!rejectionReason) {
          throw new Error("Rejection reason is required");
        }

        const updatedAdjustment = await tx.stockAdjustment.update({
          where: { id: params.id },
          data: {
            status: "REJECTED",
            approvedById: session.user.id,
            approvedDate: new Date(),
            rejectionReason,
          },
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
            location: {
              select: {
                id: true,
                locationCode: true,
                name: true,
              },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId: membership.organizationId,
            userId: session.user.id,
            action: "ADJUSTMENT_REJECTED",
            entityType: "STOCK_ADJUSTMENT",
            entityId: updatedAdjustment.id,
            metadata: {
              adjustmentNumber: updatedAdjustment.adjustmentNumber,
              item: adjustment.inventoryItem.name,
              rejectionReason,
            },
          },
        });

        return updatedAdjustment;
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error approving/rejecting adjustment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process adjustment approval" },
      { status: 500 }
    );
  }
}
