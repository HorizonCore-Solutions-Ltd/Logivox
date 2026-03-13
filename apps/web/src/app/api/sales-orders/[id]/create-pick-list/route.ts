export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createPickListSchema = z.object({
  warehouseId: z.string(),
  assignedToId: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
});

// POST /api/sales-orders/[id]/create-pick-list - Create a pick list for a sales order
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
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!existingSO) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 },
      );
    }

    if (existingSO.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Sales order must be APPROVED to create a pick list" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = createPickListSchema.parse(body);

    // Generate pick list number: PICK-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `PICK-${dateStr}`;

    const lastPickList = await prisma.pickList.findFirst({
      where: {
        organizationId,
        pickListNumber: { startsWith: prefix },
      },
      orderBy: { pickListNumber: "desc" },
    });

    let sequence = 1;
    if (lastPickList) {
      const lastSequence = parseInt(lastPickList.pickListNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }
    const pickListNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    const pickList = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create pick list with items
        const pl = await tx.pickList.create({
          data: {
            organizationId,
            pickListNumber,
            salesOrderId: existingSO.id,
            warehouseId: validatedData.warehouseId,
            status: "PENDING",
            priority: validatedData.priority || existingSO.priority || 0,
            assignedToId: validatedData.assignedToId,
            assignedDate: validatedData.assignedToId ? new Date() : null,
            notes: validatedData.notes,
            createdById: userId,
            items: {
              create: existingSO.items.map((soItem: any) => ({
                salesOrderItemId: soItem.id,
                inventoryItemId: soItem.inventoryItemId,
                quantityToPick: soItem.quantity - soItem.quantityPicked,
                quantityPicked: 0,
                binLocation: soItem.binLocation,
                batchNumber: soItem.batchNumber,
              })),
            },
          },
          include: {
            items: {
              include: {
                inventoryItem: true,
                salesOrderItem: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            warehouse: true,
            salesOrder: true,
          },
        });

        // Update sales order status to PICKING
        await tx.salesOrder.update({
          where: { id: existingSO.id },
          data: {
            status: "PICKING",
          },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId,
            userId,
            action: "PICK_LIST_CREATED",
            entityType: "PickList",
            entityId: pl.id,
            metadata: {
              pickListNumber: pl.pickListNumber,
              soNumber: existingSO.soNumber,
              itemCount: existingSO.items.length,
            },
          },
        });

        return pl;
      },
    );

    return NextResponse.json(pickList, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating pick list:", error);
    return NextResponse.json(
      { error: "Failed to create pick list" },
      { status: 500 },
    );
  }
}
