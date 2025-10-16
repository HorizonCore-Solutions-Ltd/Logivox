import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approveRMASchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

// POST /api/rmas/[id]/approve - Approve or reject RMA
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
    });

    if (!rma) {
      return NextResponse.json({ error: "RMA not found" }, { status: 404 });
    }

    if (rma.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending RMAs can be approved or rejected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = approveRMASchema.parse(body);

    if (data.action === "REJECT") {
      if (!data.rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      const updated = await prisma.rMA.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionReason: data.rejectionReason,
        },
        include: {
          customer: true,
          returnReason: true,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: "RMA_REJECTED",
          entityType: "RMA",
          entityId: updated.id,
          metadata: {
            rmaNumber: updated.rmaNumber,
            rejectionReason: data.rejectionReason,
          },
        },
      });

      return NextResponse.json(updated);
    }

    // APPROVE
    const updated = await prisma.rMA.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedDate: new Date(),
      },
      include: {
        customer: true,
        returnReason: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
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
        action: "RMA_APPROVED",
        entityType: "RMA",
        entityId: updated.id,
        metadata: {
          rmaNumber: updated.rmaNumber,
          customerName: updated.customer.name,
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

    console.error("Error approving RMA:", error);
    return NextResponse.json(
      { error: "Failed to approve RMA" },
      { status: 500 }
    );
  }
}
