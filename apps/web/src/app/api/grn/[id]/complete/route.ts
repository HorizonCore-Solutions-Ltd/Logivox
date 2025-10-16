import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/grn/[id]/complete - Complete GRN and update inventory
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizations[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    // Check if GRN exists and is approved
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
            purchaseOrderItem: true,
          },
        },
        purchaseOrder: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    if (grn.status !== "APPROVED") {
      return NextResponse.json(
        { error: "GRN must be approved before completion" },
        { status: 400 }
      );
    }

    if (grn.status === "COMPLETED") {
      return NextResponse.json({ error: "GRN already completed" }, { status: 400 });
    }

    // Complete GRN - Update inventory and PO status
    const result = await prisma.$transaction(async (tx: any) => {
      // Update inventory quantities for each item
      for (const item of grn.items) {
        // Add accepted quantity to inventory
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.acceptedQuantity,
            },
            availableQty: {
              increment: item.acceptedQuantity,
            },
          },
        });

        // Create inventory movement record
        await tx.inventoryMovement.create({
          data: {
            organizationId,
            inventoryItemId: item.inventoryItemId,
            movementType: "INBOUND",
            quantity: item.acceptedQuantity,
            notes: `Received via GRN ${grn.grnNumber}`,
            performedById: session.user.id,
          },
        });

        // Update PO item received quantity
        if (item.purchaseOrderItemId) {
          await tx.purchaseOrderItem.update({
            where: { id: item.purchaseOrderItemId },
            data: {
              quantityReceived: {
                increment: item.acceptedQuantity,
              },
            },
          });
        }

        // Mark item as put-away completed
        await tx.gRNItem.update({
          where: { id: item.id },
          data: {
            putAwayCompleted: true,
          },
        });
      }

      // Update GRN status
      const completedGRN = await tx.goodsReceiptNote.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          putAwayCompleted: true,
          putAwayDate: new Date(),
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  sku: true,
                  name: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      // Check if all PO items are fully received
      const poItemsStatus = await tx.purchaseOrderItem.findMany({
        where: {
          purchaseOrderId: grn.purchaseOrderId,
        },
      });

      const allFullyReceived = poItemsStatus.every(
        (item: any) => item.quantityReceived >= item.quantityOrdered
      );

      const anyReceived = poItemsStatus.some(
        (item: any) => item.quantityReceived > 0
      );

      // Update PO status based on receipt status
      let newPOStatus: string;
      if (allFullyReceived) {
        newPOStatus = "RECEIVED";
      } else if (anyReceived) {
        newPOStatus = "PARTIALLY_RECEIVED";
      } else {
        newPOStatus = grn.purchaseOrder.status;
      }

      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: {
          status: newPOStatus,
          receivedDate: allFullyReceived ? new Date() : null,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "COMPLETE",
          entityType: "GRN",
          entityId: completedGRN.id,
          metadata: {
            grnNumber: completedGRN.grnNumber,
            itemCount: completedGRN.items.length,
            totalAccepted: completedGRN.items.reduce(
              (sum: number, item: any) => sum + item.acceptedQuantity,
              0
            ),
            poStatus: newPOStatus,
          },
        },
      });

      return completedGRN;
    });

    return NextResponse.json({
      grn: result,
      message: "GRN completed successfully and inventory updated",
    });
  } catch (error) {
    console.error("Error completing GRN:", error);
    return NextResponse.json(
      { error: "Failed to complete GRN" },
      { status: 500 }
    );
  }
}
