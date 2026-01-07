export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/sales-orders/[id]/cancel - Cancel a sales order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizations?.[0]?.id;
    const userId = session.user.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const existingSO = await prisma.salesOrder.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!existingSO) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 },
      );
    }

    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(existingSO.status)) {
      return NextResponse.json(
        { error: "Cannot cancel sales order in its current status" },
        { status: 400 },
      );
    }

    const salesOrder = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // If items were picked, release reserved inventory
        if (existingSO.status === "PICKED" || existingSO.status === "PICKING") {
          for (const item of existingSO.items) {
            if (item.quantityPicked > 0) {
              await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: {
                  reservedQty: {
                    decrement: item.quantityPicked,
                  },
                  availableQty: {
                    increment: item.quantityPicked,
                  },
                },
              });
            }
          }
        }

        const updated = await tx.salesOrder.update({
          where: { id: params.id },
          data: {
            status: "CANCELLED",
          },
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
            customer: true,
            warehouse: true,
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId,
            userId,
            action: "SALES_ORDER_CANCELLED",
            entityType: "SalesOrder",
            entityId: updated.id,
            metadata: {
              soNumber: updated.soNumber,
              cancelledDate: new Date().toISOString(),
              previousStatus: existingSO.status,
            },
          },
        });

        return updated;
      },
    );

    return NextResponse.json(salesOrder);
  } catch (error) {
    console.error("Error cancelling sales order:", error);
    return NextResponse.json(
      { error: "Failed to cancel sales order" },
      { status: 500 },
    );
  }
}
