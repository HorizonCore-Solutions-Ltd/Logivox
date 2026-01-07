export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSOSchema = z.object({
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  requestedDate: z.string().optional(),
  promisedDate: z.string().optional(),
  shippingMethod: z
    .enum(["STANDARD", "EXPRESS", "OVERNIGHT", "PICKUP", "FREIGHT"])
    .optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  paymentMethod: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "ON_HOLD", "CANCELLED"])
    .optional(),
});

//GET /api/sales-orders/[id] - Get a single sales order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizations?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const salesOrder = await prisma.salesOrder.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customer: true,
        warehouse: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pickedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        packedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            inventoryItem: true,
          },
        },
        pickLists: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
          },
        },
        shipments: true,
      },
    });

    if (!salesOrder) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(salesOrder);
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales order" },
      { status: 500 },
    );
  }
}

// PUT /api/sales-orders/[id] - Update a sales order
export async function PUT(
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
    });

    if (!existingSO) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 },
      );
    }

    // Cannot update if already shipped or delivered
    if (["SHIPPED", "DELIVERED"].includes(existingSO.status)) {
      return NextResponse.json(
        {
          error:
            "Cannot update sales order that is already shipped or delivered",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateSOSchema.parse(body);

    const salesOrder = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updated = await tx.salesOrder.update({
          where: { id: params.id },
          data: {
            customerId: validatedData.customerId,
            warehouseId: validatedData.warehouseId,
            requestedDate: validatedData.requestedDate
              ? new Date(validatedData.requestedDate)
              : undefined,
            promisedDate: validatedData.promisedDate
              ? new Date(validatedData.promisedDate)
              : undefined,
            shippingMethod: validatedData.shippingMethod as any,
            shippingAddress: validatedData.shippingAddress,
            shippingCity: validatedData.shippingCity,
            shippingState: validatedData.shippingState,
            shippingZip: validatedData.shippingZip,
            shippingCountry: validatedData.shippingCountry,
            paymentMethod: validatedData.paymentMethod,
            priority: validatedData.priority,
            notes: validatedData.notes,
            internalNotes: validatedData.internalNotes,
            status: validatedData.status as any,
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
            action: "SALES_ORDER_UPDATED",
            entityType: "SalesOrder",
            entityId: updated.id,
            metadata: {
              soNumber: updated.soNumber,
              changes: validatedData,
            },
          },
        });

        return updated;
      },
    );

    return NextResponse.json(salesOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating sales order:", error);
    return NextResponse.json(
      { error: "Failed to update sales order" },
      { status: 500 },
    );
  }
}

// DELETE /api/sales-orders/[id] - Delete a sales order
export async function DELETE(
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
    });

    if (!existingSO) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 },
      );
    }

    // Can only delete DRAFT or CANCELLED orders
    if (!["DRAFT", "CANCELLED"].includes(existingSO.status)) {
      return NextResponse.json(
        { error: "Can only delete DRAFT or CANCELLED sales orders" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.salesOrder.delete({
        where: { id: params.id },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: "SALES_ORDER_DELETED",
          entityType: "SalesOrder",
          entityId: params.id,
          metadata: {
            soNumber: existingSO.soNumber,
          },
        },
      });
    });

    return NextResponse.json({ message: "Sales order deleted successfully" });
  } catch (error) {
    console.error("Error deleting sales order:", error);
    return NextResponse.json(
      { error: "Failed to delete sales order" },
      { status: 500 },
    );
  }
}
