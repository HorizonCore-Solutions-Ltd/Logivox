import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inspectItemSchema = z.object({
  itemId: z.string(),
  condition: z.enum([
    "NEW",
    "GOOD",
    "FAIR",
    "DAMAGED",
    "DEFECTIVE",
    "DESTROYED",
  ]),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const inspectRMASchema = z.object({
  items: z.array(inspectItemSchema).min(1),
  qcNotes: z.string().optional(),
});

// POST /api/rmas/[id]/inspect - QC inspection workflow
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
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ["ADMIN", "MANAGER"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    if (rma.status !== "INSPECTING") {
      return NextResponse.json(
        { error: "RMA must be in INSPECTING status" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = inspectRMASchema.parse(body);

    // Validate items
    for (const item of data.items) {
      const rmaItem = rma.items.find((i: any) => i.id === item.itemId);
      if (!rmaItem) {
        return NextResponse.json(
          { error: `Item ${item.itemId} not found in RMA` },
          { status: 404 }
        );
      }
    }

    // Update items with inspection results
    for (const item of data.items) {
      await prisma.rMAItem.update({
        where: { id: item.itemId },
        data: {
          condition: item.condition,
          inspectionNotes: item.notes,
          photos: item.photos || [],
          isInspected: true,
        },
      });
    }

    // Update RMA
    await prisma.rMA.update({
      where: { id: params.id },
      data: {
        status: "RECEIVED",
        inspectedById: session.user.id,
        inspectedDate: new Date(),
        qcNotes: data.qcNotes,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "RMA_INSPECTED",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
          itemsInspected: data.items.length,
        },
      },
    });

    const updated = await prisma.rMA.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        returnReason: true,
        inspectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error inspecting RMA:", error);
    return NextResponse.json(
      { error: "Failed to inspect RMA" },
      { status: 500 }
    );
  }
}
