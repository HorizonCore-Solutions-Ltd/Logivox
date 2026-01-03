export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/sales-orders/[id]/approve - Approve a sales order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizations?.[0]?.id;
    const userId = session.user.id;

    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const existingSO = await prisma.salesOrder.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingSO) {
      return NextResponse.json({ error: "Sales order not found" }, { status: 404 });
    }

    if (existingSO.status !== "PENDING_APPROVAL" && existingSO.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Sales order cannot be approved in its current status" },
        { status: 400 }
      );
    }

    const salesOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.salesOrder.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedById: userId,
          approvedDate: new Date(),
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
          customer: true,
          warehouse: true,
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          organizationId,
          userId,
          action: "SALES_ORDER_APPROVED",
          entityType: "SalesOrder",
          entityId: updated.id,
          metadata: {
            soNumber: updated.soNumber,
            approvedDate: new Date().toISOString(),
          },
        },
      });

      return updated;
    });

    return NextResponse.json(salesOrder);
  } catch (error) {
    console.error("Error approving sales order:", error);
    return NextResponse.json(
      { error: "Failed to approve sales order" },
      { status: 500 }
    );
  }
}
