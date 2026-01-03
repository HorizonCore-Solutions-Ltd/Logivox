export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const countItemSchema = z.object({
  countedQty: z.number().int().min(0),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/cycle-counts/[id]/items/[itemId]/count - Record item count
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    if (cycleCount.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cycle count must be in progress to record counts" },
        { status: 400 }
      );
    }

    const item = await prisma.cycleCountItem.findFirst({
      where: {
        id: params.itemId,
        cycleCountId: params.id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Cycle count item not found" },
        { status: 404 }
      );
    }

    if (item.isCounted) {
      return NextResponse.json(
        { error: "Item has already been counted" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = countItemSchema.parse(body);

    // Calculate variance
    const variance = data.countedQty - item.expectedQty;
    const variancePercent =
      item.expectedQty > 0
        ? ((variance / item.expectedQty) * 100).toFixed(2)
        : "0.00";
    const varianceValue = item.unitCost
      ? parseFloat((variance * parseFloat(item.unitCost.toString())).toFixed(2))
      : null;

    // Update the count item
    const updatedItem = await prisma.cycleCountItem.update({
      where: { id: params.itemId },
      data: {
        countedQty: data.countedQty,
        variance,
        variancePercent: parseFloat(variancePercent),
        varianceValue,
        isCounted: true,
        countedById: session.user.id,
        countedAt: new Date(),
        reason: data.reason,
        notes: data.notes,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            barcode: true,
          },
        },
        countedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update cycle count statistics
    const countStats = await prisma.cycleCountItem.aggregate({
      where: { cycleCountId: params.id },
      _count: { isCounted: true },
      _sum: { varianceValue: true },
    });

    const varianceItems = await prisma.cycleCountItem.count({
      where: {
        cycleCountId: params.id,
        isCounted: true,
        variance: { not: 0 },
      },
    });

    await prisma.cycleCount.update({
      where: { id: params.id },
      data: {
        countedItems: countStats._count.isCounted || 0,
        varianceItems,
        totalVariance: countStats._sum.varianceValue || 0,
      },
    });

    // Check if all items counted
    const allCounted =
      (countStats._count.isCounted || 0) >= cycleCount.totalItems;
    if (allCounted) {
      await prisma.cycleCount.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedDate: new Date(),
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "CYCLE_COUNT_COMPLETED",
          entityType: "CycleCount",
          entityId: cycleCount.id,
          metadata: {
            countNumber: cycleCount.countNumber,
            varianceItems,
            totalVariance: countStats._sum.varianceValue || 0,
          },
        },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error recording item count:", error);
    return NextResponse.json(
      { error: "Failed to record item count" },
      { status: 500 }
    );
  }
}
