import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/cycle-counts/[id]/start - Start cycle count
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

    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
    });

    if (!cycleCount) {
      return NextResponse.json(
        { error: "Cycle count not found" },
        { status: 404 }
      );
    }

    if (cycleCount.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Only planned cycle counts can be started" },
        { status: 400 }
      );
    }

    const updated = await prisma.cycleCount.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        startedDate: new Date(),
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
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "CYCLE_COUNT_STARTED",
        entityType: "CycleCount",
        entityId: updated.id,
        metadata: {
          countNumber: updated.countNumber,
          totalItems: updated.totalItems,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error starting cycle count:", error);
    return NextResponse.json(
      { error: "Failed to start cycle count" },
      { status: 500 }
    );
  }
}
