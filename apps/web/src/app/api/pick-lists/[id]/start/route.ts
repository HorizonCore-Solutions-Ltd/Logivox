import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @route POST /api/pick-lists/:id/start
 * @desc Start a pick list (set status to IN_PROGRESS)
 * @access Private
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pickListId = params.id;

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Start transaction to update pick list
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get pick list with authorization check
      const pickList = await tx.pickList.findFirst({
        where: {
          id: pickListId,
          organizationId
        },
        include: {
          salesOrder: true
        }
      });

      if (!pickList) {
        throw new Error("Pick list not found");
      }

      // Validate current status
      if (pickList.status !== "PENDING") {
        throw new Error(`Cannot start pick list with status: ${pickList.status}`);
      }

      // Update pick list status
      const updatedPickList = await tx.pickList.update({
        where: { id: pickListId },
        data: {
          status: "IN_PROGRESS",
          startedDate: new Date(),
          // Optionally assign to current user if not already assigned
          ...((!pickList.assignedToId) && {
            assignedToId: session.user.id,
            assignedDate: new Date()
          })
        }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "PICK_LIST_STARTED",
          entityType: "PICK_LIST",
          entityId: pickListId,
          metadata: {
            pickListNumber: pickList.pickListNumber,
            salesOrderNumber: pickList.salesOrder.soNumber,
            startedById: session.user.id
          }
        }
      });

      return updatedPickList;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error starting pick list:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start pick list" },
      { status: 500 }
    );
  }
}
