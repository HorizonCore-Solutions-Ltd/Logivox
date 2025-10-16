import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating GRN
const updateGRNSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "QUALITY_CHECK", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
  warehouseId: z.string().optional(),
  receivingDock: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  qcStatus: z.string().optional(),
  qcNotes: z.string().optional(),
});

// GET /api/grn/[id] - Get GRN details
export async function GET(
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

    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            items: true,
          },
        },
        warehouse: true,
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        qcBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
              },
            },
            purchaseOrderItem: {
              select: {
                id: true,
                quantityOrdered: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    return NextResponse.json({ grn });
  } catch (error) {
    console.error("Error fetching GRN:", error);
    return NextResponse.json({ error: "Failed to fetch GRN" }, { status: 500 });
  }
}

// PUT /api/grn/[id] - Update GRN
export async function PUT(
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

    const body = await request.json();
    const validatedData = updateGRNSchema.parse(body);

    // Check if GRN exists
    const existingGRN = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingGRN) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    // Only allow updates if GRN is in DRAFT or PENDING status
    if (existingGRN.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot update completed GRN" },
        { status: 400 }
      );
    }

    // Update GRN
    const updatedGRN = await prisma.$transaction(async (tx: any) => {
      const grn = await tx.goodsReceiptNote.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          qcById: validatedData.qcStatus ? session.user.id : undefined,
          qcDate: validatedData.qcStatus ? new Date() : undefined,
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  sku: true,
                  name: true,
                },
              },
            },
          },
          purchaseOrder: {
            select: {
              poNumber: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "UPDATE",
          entityType: "GRN",
          entityId: grn.id,
          metadata: {
            grnNumber: grn.grnNumber,
            changes: validatedData,
          },
        },
      });

      return grn;
    });

    return NextResponse.json({ grn: updatedGRN });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating GRN:", error);
    return NextResponse.json({ error: "Failed to update GRN" }, { status: 500 });
  }
}

// DELETE /api/grn/[id] - Delete GRN (only DRAFT status)
export async function DELETE(
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

    // Check if GRN exists and is in DRAFT status
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    if (grn.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft GRNs can be deleted" },
        { status: 400 }
      );
    }

    // Delete GRN (items will be cascade deleted)
    await prisma.$transaction(async (tx: any) => {
      await tx.goodsReceiptNote.delete({
        where: { id: params.id },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "DELETE",
          entityType: "GRN",
          entityId: params.id,
          metadata: {
            grnNumber: grn.grnNumber,
          },
        },
      });
    });

    return NextResponse.json({ message: "GRN deleted successfully" });
  } catch (error) {
    console.error("Error deleting GRN:", error);
    return NextResponse.json({ error: "Failed to delete GRN" }, { status: 500 });
  }
}
