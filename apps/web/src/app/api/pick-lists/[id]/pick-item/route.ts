export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema
const pickItemSchema = z.object({
  pickListItemId: z.string(),
  quantityPicked: z.number().int().min(0),
  binLocation: z.string().optional(),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
});

/**
 * @route POST /api/pick-lists/:id/pick-item
 * @desc Record a picked item (update quantity picked)
 * @access Private
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pickListId = params.id;
    const body = await req.json();

    // Validate request body
    const validatedData = pickItemSchema.parse(body);

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to update pick list item and inventory
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get pick list with authorization check
        const pickList = await tx.pickList.findFirst({
          where: {
            id: pickListId,
            organizationId,
          },
          include: {
            salesOrder: true,
            items: {
              where: { id: validatedData.pickListItemId },
              include: {
                inventoryItem: true,
                salesOrderItem: true,
              },
            },
          },
        });

        if (!pickList) {
          throw new Error("Pick list not found");
        }

        if (pickList.status === "PICKED" || pickList.status === "CANCELLED") {
          throw new Error(
            `Cannot update pick list with status: ${pickList.status}`,
          );
        }

        const pickListItem = pickList.items[0];
        if (!pickListItem) {
          throw new Error("Pick list item not found");
        }

        // Validate quantity
        const newTotalPicked =
          pickListItem.quantityPicked + validatedData.quantityPicked;
        if (newTotalPicked > pickListItem.quantityToPick) {
          throw new Error(
            `Cannot pick ${validatedData.quantityPicked}. Would exceed quantity to pick (${pickListItem.quantityToPick})`,
          );
        }

        // Update pick list item
        const updatedItem = await tx.pickListItem.update({
          where: { id: validatedData.pickListItemId },
          data: {
            quantityPicked: newTotalPicked,
            pickedAt:
              newTotalPicked === pickListItem.quantityToPick
                ? new Date()
                : undefined,
            ...(validatedData.binLocation && {
              binLocation: validatedData.binLocation,
            }),
            ...(validatedData.batchNumber && {
              batchNumber: validatedData.batchNumber,
            }),
            ...(validatedData.serialNumbers && {
              serialNumbers: validatedData.serialNumbers as any,
            }),
          },
        });

        // Update sales order item quantities
        await tx.salesOrderItem.update({
          where: { id: pickListItem.salesOrderItemId },
          data: {
            quantityPicked: {
              increment: validatedData.quantityPicked,
            },
          },
        });

        // Reserve inventory (reduce available, increase reserved)
        await tx.inventoryItem.update({
          where: { id: pickListItem.inventoryItemId },
          data: {
            availableQty: {
              decrement: validatedData.quantityPicked,
            },
            reservedQty: {
              increment: validatedData.quantityPicked,
            },
          },
        });

        // Auto-update pick list status if all items are picked
        const allItems = await tx.pickListItem.findMany({
          where: { pickListId },
        });

        const allPicked = allItems.every(
          (item: any) => item.quantityPicked >= item.quantityToPick,
        );

        if (allPicked && pickList.status !== "PICKED") {
          await tx.pickList.update({
            where: { id: pickListId },
            data: {
              status: "PICKED",
              completedDate: new Date(),
            },
          });

          // Update sales order status
          await tx.salesOrder.update({
            where: { id: pickList.salesOrderId },
            data: {
              status: "PICKED",
              pickedById: session.user.id,
              pickedDate: new Date(),
            },
          });

          // Create activity log for completion
          await tx.activityLog.create({
            data: {
              organizationId,
              userId: session.user.id,
              action: "PICK_LIST_COMPLETED",
              entityType: "PICK_LIST",
              entityId: pickListId,
              metadata: {
                pickListNumber: pickList.pickListNumber,
                salesOrderNumber: pickList.salesOrder.soNumber,
                totalItems: allItems.length,
              },
            },
          });
        } else {
          // Log individual item pick
          await tx.activityLog.create({
            data: {
              organizationId,
              userId: session.user.id,
              action: "ITEM_PICKED",
              entityType: "PICK_LIST_ITEM",
              entityId: updatedItem.id,
              metadata: {
                pickListNumber: pickList.pickListNumber,
                itemName: pickListItem.inventoryItem.name,
                quantityPicked: validatedData.quantityPicked,
                totalPicked: newTotalPicked,
                quantityToPick: pickListItem.quantityToPick,
              },
            },
          });
        }

        return {
          pickListItem: updatedItem,
          pickListCompleted: allPicked,
        };
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error picking item:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to pick item" },
      { status: 500 },
    );
  }
}
