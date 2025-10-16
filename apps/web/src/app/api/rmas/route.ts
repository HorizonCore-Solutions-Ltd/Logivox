import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rmaItemSchema = z.object({
  inventoryId: z.string(),
  salesOrderItemId: z.string().optional(),
  quantityRequested: z.number().int().positive(),
  unitPrice: z.number(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED", "DEFECTIVE", "DESTROYED"]).optional(),
  action: z.enum(["REFUND", "EXCHANGE", "STORE_CREDIT", "REPAIR", "DISPOSE"]).optional().default("REFUND"),
  exchangeInventoryId: z.string().optional(),
  exchangeQuantity: z.number().int().positive().optional(),
});

const createRMASchema = z.object({
  salesOrderId: z.string().optional(),
  customerId: z.string(),
  returnReasonId: z.string(),
  customerNotes: z.string().optional(),
  returnTrackingNumber: z.string().optional(),
  returnCarrier: z.string().optional(),
  items: z.array(rmaItemSchema).min(1),
});

// GET /api/rmas - List RMAs
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: membership.organizationId,
    };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { rmaNumber: { contains: search, mode: "insensitive" } },
        { returnTrackingNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rmas, total] = await Promise.all([
      prisma.rMA.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              code: true,
            },
          },
          salesOrder: {
            select: {
              id: true,
              soNumber: true,
            },
          },
          returnReason: {
            select: {
              id: true,
              code: true,
              name: true,
              defaultAction: true,
            },
          },
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
        orderBy: { requestedDate: "desc" },
      }),
      prisma.rMA.count({ where }),
    ]);

    return NextResponse.json({
      rmas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching RMAs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RMAs" },
      { status: 500 }
    );
  }
}

// POST /api/rmas - Create new RMA with smart automation
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const data = createRMASchema.parse(body);

    // Validate customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        organizationId: membership.organizationId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get return reason configuration
    const returnReason = await prisma.returnReason.findFirst({
      where: {
        id: data.returnReasonId,
        organizationId: membership.organizationId,
      },
    });

    if (!returnReason) {
      return NextResponse.json(
        { error: "Return reason not found" },
        { status: 404 }
      );
    }

    // Validate sales order if provided
    if (data.salesOrderId) {
      const salesOrder = await prisma.salesOrder.findFirst({
        where: {
          id: data.salesOrderId,
          organizationId: membership.organizationId,
          customerId: data.customerId,
        },
      });

      if (!salesOrder) {
        return NextResponse.json(
          { error: "Sales order not found or does not belong to customer" },
          { status: 404 }
        );
      }

      // Check return window if configured
      if (returnReason.allowedDays && salesOrder.deliveredDate) {
        const daysSinceDelivery = Math.floor(
          (Date.now() - salesOrder.deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDelivery > returnReason.allowedDays) {
          return NextResponse.json(
            {
              error: `Return window expired. Returns allowed within ${returnReason.allowedDays} days of delivery.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate inventory items
    for (const item of data.items) {
      const inventory = await prisma.inventoryItem.findFirst({
        where: {
          id: item.inventoryId,
          organizationId: membership.organizationId,
        },
      });

      if (!inventory) {
        return NextResponse.json(
          { error: `Inventory item ${item.inventoryId} not found` },
          { status: 404 }
        );
      }

      // Validate exchange item if specified
      if (item.exchangeInventoryId) {
        const exchangeItem = await prisma.inventoryItem.findFirst({
          where: {
            id: item.exchangeInventoryId,
            organizationId: membership.organizationId,
          },
        });

        if (!exchangeItem) {
          return NextResponse.json(
            { error: `Exchange item ${item.exchangeInventoryId} not found` },
            { status: 404 }
          );
        }
      }
    }

    // Generate RMA number: RMA-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = (today.toISOString().split("T")[0] || "").replace(/-/g, "");
    const prefix = `RMA-${dateStr}`;

    const lastRMA = await prisma.rMA.findFirst({
      where: {
        organizationId: membership.organizationId,
        rmaNumber: { startsWith: prefix },
      },
      orderBy: { rmaNumber: "desc" },
    });

    let sequence = 1;
    if (lastRMA) {
      const lastSeq = parseInt(
        (lastRMA.rmaNumber.split("-")[2] || "0") || "0"
      );
      sequence = lastSeq + 1;
    }

    const rmaNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Smart automation: Determine if auto-approval applies
    const shouldAutoApprove = returnReason.autoApprove;
    const requiresApproval = !shouldAutoApprove;

    // Calculate totals
    const totalRefundAmount = data.items.reduce((sum, item) => {
      if (item.action === "REFUND" || !item.action) {
        return sum + item.unitPrice * item.quantityRequested;
      }
      return sum;
    }, 0);

    // Create RMA with items
    const rma = await prisma.rMA.create({
      data: {
        organizationId: membership.organizationId,
        rmaNumber,
        status: shouldAutoApprove ? "APPROVED" : "PENDING",
        salesOrderId: data.salesOrderId,
        customerId: data.customerId,
        returnReasonId: data.returnReasonId,
        customerNotes: data.customerNotes,
        returnTrackingNumber: data.returnTrackingNumber,
        returnCarrier: data.returnCarrier,
        requiresApproval,
        totalRefundAmount,
        approvedById: shouldAutoApprove ? session.user.id : undefined,
        approvedDate: shouldAutoApprove ? new Date() : undefined,
        items: {
          create: data.items.map((item: any) => ({
            inventoryId: item.inventoryId,
            salesOrderItemId: item.salesOrderItemId,
            quantityRequested: item.quantityRequested,
            condition: item.condition,
            action: item.action || returnReason.defaultAction || "REFUND",
            unitPrice: item.unitPrice,
            refundAmount:
              item.action === "REFUND" || !item.action
                ? item.unitPrice * item.quantityRequested
                : 0,
            exchangeInventoryId: item.exchangeInventoryId,
            exchangeQuantity: item.exchangeQuantity,
          })),
        },
      },
      include: {
        customer: true,
        salesOrder: {
          select: {
            soNumber: true,
          },
        },
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
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: shouldAutoApprove ? "RMA_AUTO_APPROVED" : "RMA_CREATED",
        entityType: "RMA",
        entityId: rma.id,
        metadata: {
          rmaNumber: rma.rmaNumber,
          customerName: customer.name,
          itemCount: data.items.length,
          autoApproved: shouldAutoApprove,
        },
      },
    });

    return NextResponse.json(rma, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating RMA:", error);
    return NextResponse.json(
      { error: "Failed to create RMA" },
      { status: 500 }
    );
  }
}
