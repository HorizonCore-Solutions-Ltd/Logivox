export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCycleCountSchema = z.object({
  scheduledDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/cycle-counts/[id] - Get cycle count details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 404 },
      );
    }

    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        location: true,
        category: true,
        assignedTo: {
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
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
                barcode: true,
              },
            },
            location: {
              select: {
                id: true,
                locationCode: true,
                name: true,
              },
            },
            countedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            reconciledBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cycleCount) {
      return NextResponse.json(
        { error: "Cycle count not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(cycleCount);
  } catch (error) {
    console.error("Error fetching cycle count:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle count" },
      { status: 500 },
    );
  }
}

// PUT /api/cycle-counts/[id] - Update cycle count
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 404 },
      );
    }

    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!cycleCount) {
      return NextResponse.json(
        { error: "Cycle count not found" },
        { status: 404 },
      );
    }

    // Can't update completed or approved counts
    if (["COMPLETED", "APPROVED"].includes(cycleCount.status)) {
      return NextResponse.json(
        { error: "Cannot update completed or approved cycle count" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data = updateCycleCountSchema.parse(body);

    const updated = await prisma.cycleCount.update({
      where: { id: params.id },
      data,
      include: {
        location: true,
        category: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "CYCLE_COUNT_UPDATED",
        entityType: "CycleCount",
        entityId: updated.id,
        metadata: {
          countNumber: updated.countNumber,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating cycle count:", error);
    return NextResponse.json(
      { error: "Failed to update cycle count" },
      { status: 500 },
    );
  }
}

// DELETE /api/cycle-counts/[id] - Delete cycle count
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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
        { status: 403 },
      );
    }

    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!cycleCount) {
      return NextResponse.json(
        { error: "Cycle count not found" },
        { status: 404 },
      );
    }

    // Can only delete planned counts
    if (cycleCount.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Can only delete planned cycle counts" },
        { status: 400 },
      );
    }

    await prisma.cycleCount.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "CYCLE_COUNT_DELETED",
        entityType: "CycleCount",
        entityId: cycleCount.id,
        metadata: {
          countNumber: cycleCount.countNumber,
        },
      },
    });

    return NextResponse.json({ message: "Cycle count deleted successfully" });
  } catch (error) {
    console.error("Error deleting cycle count:", error);
    return NextResponse.json(
      { error: "Failed to delete cycle count" },
      { status: 500 },
    );
  }
}
