import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const receiveItemSchema = z.object({
  itemId: z.string(),
  quantityReceived: z.number().int().positive(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED", "DEFECTIVE", "DESTROYED"]),
  notes: z.string().optional(),
});

const receiveRMASchema = z.object({
  items: z.array(receiveItemSchema).min(1),
});

// POST /api/rmas/[id]/receive - Receive returned items
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
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 }
      );
    }

    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        items: true,
        returnReason: true,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    if (rma.status !== "APPROVED" && rma.status !== "IN_TRANSIT") {
      return NextResponse.json(
        { error: "RMA must be approved or in transit to receive items" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = receiveRMASchema.parse(body);

    // Validate all items belong to this RMA
    for (const item of data.items) {
      const rmaItem = rma.items.find((i: any) => i.id === item.itemId);
      if (!rmaItem) {
        return NextResponse.json(
          { error: `Item ${item.itemId} not found in RMA` },
          { status: 404 }
        );
      }

      if (item.quantityReceived > rmaItem.quantityRequested) {
        return NextResponse.json(
          {
            error: `Received quantity cannot exceed requested quantity for item ${item.itemId}`,
          },
          { status: 400 }
        );
      }
    }

    // Update RMA items with received quantities and conditions
    for (const item of data.items) {
      await prisma.rMAItem.update({
        where: { id: item.itemId },
        data: {
          quantityReceived: item.quantityReceived,
          condition: item.condition,
          inspectionNotes: item.notes,
        },
      });
    }

    // Determine next status based on QC requirement
    const nextStatus = rma.returnReason.requiresQC ? "INSPECTING" : "RECEIVED";

    // Update RMA status
    const updated = await prisma.rMA.update({
      where: { id: params.id },
      data: {
        status: nextStatus,
        receivedDate: new Date(),
      },
      include: {
        customer: true,
        returnReason: true,
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
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RMA_RECEIVED",
        entityType: "RMA",
        entityId: updated.id,
        metadata: {
          rmaNumber: updated.rmaNumber,
          itemsReceived: data.items.length,
          requiresQC: rma.returnReason.requiresQC,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error receiving RMA:", error);
    return NextResponse.json(
      { error: "Failed to receive RMA" },
      { status: 500 }
    );
  }
}
