import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateContract } from "../../../../../../../lib/api-middleware";
import { MovementType } from "@prisma/client";

const adjustSchema = z.object({
  inventoryItemId: z.string(),
  quantityChange: z.number().int(),
  reason: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, errorResponse } = await validateContract(request, adjustSchema);
  if (errorResponse) return errorResponse;

  try {
    const { inventoryItemId, quantityChange, reason, notes } = data!;

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: { organizationId: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 },
      );
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        organizationId: membership.organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        quantity: true,
        reservedQty: true,
        sku: true,
        name: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const nextQuantity = item.quantity + quantityChange;
    if (nextQuantity < 0) {
      return NextResponse.json(
        { error: "Adjustment would result in negative quantity" },
        { status: 400 },
      );
    }

    const nextAvailableQty = Math.max(0, nextQuantity - item.reservedQty);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          quantity: nextQuantity,
          availableQty: nextAvailableQty,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryItemId,
          quantity: Math.abs(quantityChange),
          type:
            quantityChange < 0 ? MovementType.DAMAGE : MovementType.ADJUSTMENT,
          reason,
          notes,
        },
      });

      await tx.activityLog.create({
        data: {
          action: "STOCK_ADJUSTMENT",
          entityType: "INVENTORY_ITEM",
          entityId: inventoryItemId,
          userId: session.user.id,
          organizationId: item.organizationId,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          metadata: {
            reason,
            quantityChange,
            previousQuantity: item.quantity,
            newQuantity: nextQuantity,
            movementId: movement.id,
          },
        },
      });

      return updatedItem;
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: "Inventory adjusted successfully",
    });
  } catch (error) {
    console.error("Adjustment failed", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 },
    );
  }
}
