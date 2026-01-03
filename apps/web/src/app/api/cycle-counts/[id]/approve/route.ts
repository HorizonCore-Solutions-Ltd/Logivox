export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, Prisma } from "@/lib/prisma";
import { z } from "zod";

const approveCycleCountSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
  createAdjustments: z.boolean().optional().default(true),
});

// POST /api/cycle-counts/[id]/approve - Approve or reject cycle count
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

    const cycleCount = await prisma.cycleCount.findFirst({
      where: {
        id: params.id,
        organizationId: membership.organizationId,
      },
      include: {
        items: {
          where: {
            isCounted: true,
            variance: { not: 0 },
          },
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!cycleCount) {
      return NextResponse.json(
        { error: "Cycle count not found" },
        { status: 404 }
      );
    }

    if (cycleCount.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed cycle counts can be approved" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = approveCycleCountSchema.parse(body);

    if (data.action === "REJECT") {
      if (!data.rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      const updated = await prisma.cycleCount.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          metadata: {
            ...(cycleCount.metadata as object),
            rejectionReason: data.rejectionReason,
            rejectedAt: new Date().toISOString(),
            rejectedById: session.user.id,
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "CYCLE_COUNT_REJECTED",
          entityType: "CycleCount",
          entityId: updated.id,
          metadata: {
            countNumber: updated.countNumber,
            rejectionReason: data.rejectionReason,
          },
        },
      });

      return NextResponse.json(updated);
    }

    // APPROVE and create adjustments
    const today = new Date();
    const dateStr = (today.toISOString().split("T")[0] || "").replace(/-/g, "");
    const adjustmentPrefix = `ADJ-${dateStr}`;

    let adjustmentsCreated = 0;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create stock adjustments for each variance item
      for (const item of cycleCount.items) {
        if (data.createAdjustments && item.variance !== 0) {
          // Get next adjustment number
          const lastAdjustment = await tx.stockAdjustment.findFirst({
            where: {
              organizationId: membership.organizationId,
              adjustmentNumber: { startsWith: adjustmentPrefix },
            },
            orderBy: { adjustmentNumber: "desc" },
          });

          let sequence = 1;
          if (lastAdjustment) {
            const lastSeq = parseInt(
              (lastAdjustment.adjustmentNumber.split("-")[2] || "0") || "0"
            );
            sequence = lastSeq + 1;
          }

          const adjustmentNumber = `${adjustmentPrefix}-${sequence
            .toString()
            .padStart(3, "0")}`;

          // Create adjustment
          const adjustment = await tx.stockAdjustment.create({
            data: {
              organizationId: membership.organizationId,
              adjustmentNumber,
              status: "COMPLETED",
              inventoryId: item.inventoryId,
              locationId: item.locationId,
              quantityBefore: item.expectedQty,
              quantityAfter: item.countedQty || item.expectedQty,
              quantityChange: item.variance || 0,
              reason: "RECOUNT",
              reasonNotes: `From cycle count ${cycleCount.countNumber}`,
              requiresApproval: false,
              createdById: session.user.id,
              approvedById: session.user.id,
              completedById: session.user.id,
              approvedDate: new Date(),
              completedDate: new Date(),
              unitCost: item.unitCost ? parseFloat(item.unitCost.toString()) : null,
              totalCost: item.varianceValue
                ? parseFloat(item.varianceValue.toString())
                : null,
            },
          });

          // Update inventory
          const newQty = item.countedQty || item.expectedQty;
          await tx.inventoryItem.update({
            where: { id: item.inventoryId },
            data: {
              quantity: newQty,
              availableQty: newQty - item.inventoryItem.reservedQty,
              status:
                newQty === 0
                  ? "OUT_OF_STOCK"
                  : newQty <= (item.inventoryItem.minStockLevel || 0)
                  ? "LOW_STOCK"
                  : "ACTIVE",
            },
          });

          // Link adjustment to count item
          await tx.cycleCountItem.update({
            where: { id: item.id },
            data: {
              adjustmentId: adjustment.id,
              isReconciled: true,
              reconciledById: session.user.id,
              reconciledAt: new Date(),
            },
          });

          adjustmentsCreated++;
        }
      }

      // Approve the cycle count
      await tx.cycleCount.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedById: session.user.id,
          approvedDate: new Date(),
        },
      });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: "CYCLE_COUNT_APPROVED",
        entityType: "CycleCount",
        entityId: cycleCount.id,
        metadata: {
          countNumber: cycleCount.countNumber,
          adjustmentsCreated,
          varianceItems: cycleCount.varianceItems,
          totalVariance: cycleCount.totalVariance.toString(),
        },
      },
    });

    const updated = await prisma.cycleCount.findUnique({
      where: { id: params.id },
      include: {
        location: true,
        category: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          where: { variance: { not: 0 } },
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
            adjustment: {
              select: {
                id: true,
                adjustmentNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      adjustmentsCreated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error approving cycle count:", error);
    return NextResponse.json(
      { error: "Failed to approve cycle count" },
      { status: 500 }
    );
  }
}
