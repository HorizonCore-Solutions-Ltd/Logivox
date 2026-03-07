import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const refundSchema = z.object({
  reason: z.enum([
    "ITEM_NOT_ARRIVED",
    "DAMAGED_ITEM",
    "JOB_CANCELLED",
    "CUSTOMER_REQUEST",
    "OTHER",
  ]),
  amount: z.number().positive(),
  reasonDetails: z.string().optional(),
  rmaId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get organization from session (assuming logic similar to other routes)
    const organizationId = (session.user as any).organizations?.[0]?.id;
    if (!organizationId) {
      return new NextResponse("No organization found", { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason, amount, reasonDetails, rmaId } = refundSchema.parse(body);

    const order = await prisma.salesOrder.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        refunds: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Check if total refunded amount exceeds total paid amount
    const alreadyRefunded = order.refunds.reduce(
      (acc, refund) => acc + Number(refund.amount),
      0,
    );

    // Create Refund record
    const refund = await prisma.refund.create({
      data: {
        organizationId: order.organizationId,
        salesOrderId: order.id,
        amount,
        reason,
        reasonDetails,
        status: "PROCESSED",
        processedAt: new Date(),
        processedById: session.user.id,
        rmaId,
      },
    });

    const totalRefunded = alreadyRefunded + amount;
    const updates: any = {};

    // If fully refunded, mark as REFUNDED
    if (
      totalRefunded >= Number(order.paidAmount) &&
      Number(order.paidAmount) > 0
    ) {
      updates.paymentStatus = "REFUNDED";
    }

    if (reason === "JOB_CANCELLED" && order.status !== "CANCELLED") {
      updates.status = "CANCELLED";
    }

    if (Object.keys(updates).length > 0) {
      await prisma.salesOrder.update({
        where: { id },
        data: updates,
      });
    }

    return NextResponse.json(refund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), {
        status: 400,
      });
    }
    console.error("Refund error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
