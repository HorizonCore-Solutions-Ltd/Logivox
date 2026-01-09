/**
 * Customer Portal - Returns API
 * POST /api/portal/returns - Customer initiates return
 * GET /api/portal/returns - List customer's returns
 * GET /api/portal/returns/[id] - Get return details
 * POST /api/portal/returns/[id]/cancel - Cancel return request
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReturnSchema = z.object({
  salesOrderId: z.string(),
  items: z
    .array(
      z.object({
        salesOrderItemId: z.string(),
        quantity: z.number().int().positive(),
        reason: z.string(),
        condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED", "DEFECTIVE"]),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  returnMethod: z
    .enum(["PREPAID_LABEL", "DROP_OFF", "PICKUP"])
    .default("PREPAID_LABEL"),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a customer
    const customerUser = await prisma.customerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        customer: true,
      },
    });

    if (!customerUser) {
      return NextResponse.json(
        { error: "Customer access required" },
        { status: 403 },
      );
    }

    // Get customer's returns
    const returns = await prisma.rMA.findMany({
      where: {
        customerId: customerUser.customerId,
      },
      include: {
        returnReason: {
          select: {
            reason: true,
            category: true,
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
        salesOrder: {
          select: {
            soNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a customer
    const customerUser = await prisma.customerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        customer: true,
      },
    });

    if (!customerUser) {
      return NextResponse.json(
        { error: "Customer access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createReturnSchema.parse(body);

    // Validate sales order belongs to customer
    const salesOrder = await prisma.salesOrder.findFirst({
      where: {
        id: data.salesOrderId,
        customerId: customerUser.customerId,
        organizationId: customerUser.customer.organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!salesOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is eligible for return
    if (!salesOrder.deliveredDate) {
      return NextResponse.json(
        { error: "Order must be delivered before return can be initiated" },
        { status: 400 },
      );
    }

    // Get or create return reason
    const returnReasonMap = new Map<string, string>();
    for (const item of data.items) {
      if (!returnReasonMap.has(item.reason)) {
        let reason = await prisma.returnReason.findFirst({
          where: {
            organizationId: customerUser.customer.organizationId,
            reason: item.reason,
          },
        });

        if (!reason) {
          // Create default return reason
          reason = await prisma.returnReason.create({
            data: {
              organizationId: customerUser.customer.organizationId,
              reason: item.reason,
              category: "OTHER",
              allowedDays: 30,
              autoApprove: false,
              defaultAction: "REFUND",
              requiresQC: true,
            },
          });
        }

        returnReasonMap.set(item.reason, reason.id);
      }
    }

    // Use the first reason as primary (most common case)
    const primaryReasonId = returnReasonMap.values().next().value;

    // Generate RMA number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]!.replace(/-/g, "");
    const prefix = `RMA-${dateStr}`;

    const lastRMA = await prisma.rMA.findFirst({
      where: {
        organizationId: customerUser.customer.organizationId,
        rmaNumber: { startsWith: prefix },
      },
      orderBy: { rmaNumber: "desc" },
    });

    let sequence = 1;
    if (lastRMA) {
      const lastSeq = parseInt(lastRMA.rmaNumber.split("-")[2] || "0");
      sequence = lastSeq + 1;
    }

    const rmaNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Create RMA items array
    const rmaItems = [];
    let totalRefundAmount = 0;

    for (const item of data.items) {
      const orderItem = salesOrder.items.find(
        (oi: any) => oi.id === item.salesOrderItemId,
      );

      if (!orderItem) {
        return NextResponse.json(
          { error: `Order item ${item.salesOrderItemId} not found` },
          { status: 404 },
        );
      }

      if (item.quantity > orderItem.quantity) {
        return NextResponse.json(
          {
            error: `Return quantity exceeds ordered quantity for ${orderItem.inventoryItem.name}`,
          },
          { status: 400 },
        );
      }

      const refundAmount = orderItem.unitPrice * item.quantity;
      totalRefundAmount += refundAmount;

      rmaItems.push({
        inventoryId: orderItem.inventoryId,
        salesOrderItemId: item.salesOrderItemId,
        quantityRequested: item.quantity,
        condition: item.condition,
        action: "REFUND",
        unitPrice: orderItem.unitPrice,
        refundAmount,
        metadata: {
          reason: item.reason,
          notes: item.notes,
          photos: item.photos,
        },
      });
    }

    // Create RMA
    const rma = await prisma.rMA.create({
      data: {
        organizationId: customerUser.customer.organizationId,
        rmaNumber,
        status: "PENDING", // Requires approval
        salesOrderId: data.salesOrderId,
        customerId: customerUser.customerId,
        returnReasonId: primaryReasonId,
        customerNotes: data.notes,
        totalRefundAmount,
        requiresApproval: true,
        notifyCustomer: true,
        metadata: {
          returnMethod: data.returnMethod,
          initiatedVia: "CUSTOMER_PORTAL",
        },
        items: {
          create: rmaItems,
        },
      },
      include: {
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
        salesOrder: {
          select: {
            soNumber: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: customerUser.customer.organizationId,
        userId: session.user.id,
        action: "RETURN_INITIATED_BY_CUSTOMER",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
          orderNumber: salesOrder.soNumber,
          itemCount: rmaItems.length,
          totalAmount: totalRefundAmount,
        },
      },
    });

    return NextResponse.json(
      {
        rma,
        message:
          "Return request submitted successfully. You will receive a confirmation email shortly.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating return:", error);
    return NextResponse.json(
      { error: "Failed to create return request" },
      { status: 500 },
    );
  }
}
