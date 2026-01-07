export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      inventoryItemId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      notes: z.string().optional(),
    }),
  ),
  shippingMethod: z.enum(["STANDARD", "EXPRESS", "OVERNIGHT"]).optional(),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  requestedDate: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/portal/orders
 * List customer's orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get customer record
    const customer = await prisma.user.findUnique({
      where: { id: user.id },
      include: { customer: true },
    });

    if (!customer?.customerId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { customerId: customer.customerId };

    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { soNumber: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: "desc" },
        select: {
          id: true,
          soNumber: true,
          orderDate: true,
          status: true,
          requestedDate: true,
          total: true,
          trackingNumber: true,
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    const ordersFormatted = orders.map((order) => ({
      id: order.id,
      soNumber: order.soNumber,
      orderDate: order.orderDate,
      status: order.status,
      requestedDate: order.requestedDate,
      total: Number(order.total),
      trackingNumber: order.trackingNumber,
      itemCount: order.items.length,
    }));

    return NextResponse.json({
      orders: ordersFormatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Portal orders list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/portal/orders
 * Create new order from customer portal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get customer record with organization
    const customerUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!customerUser?.customerId || !customerUser.customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Calculate totals
    let subtotal = 0;
    for (const item of validated.items) {
      subtotal += item.quantity * item.unitPrice;
    }

    const taxAmount = subtotal * 0.1; // 10% tax (customize as needed)
    const shippingCost =
      validated.shippingMethod === "OVERNIGHT"
        ? 50
        : validated.shippingMethod === "EXPRESS"
          ? 25
          : 10;
    const total = subtotal + taxAmount + shippingCost;

    // Generate order number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.salesOrder.count({
      where: {
        organizationId: customerUser.customer.organizationId,
        soNumber: { startsWith: `SO-${dateStr}` },
      },
    });
    const soNumber = `SO-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    // Create order
    const order = await prisma.salesOrder.create({
      data: {
        organizationId: customerUser.customer.organizationId,
        soNumber,
        customerId: customerUser.customerId,
        status: "PENDING_APPROVAL", // Customer orders require approval
        subtotal,
        taxAmount,
        shippingCost,
        total,
        shippingMethod: validated.shippingMethod,
        shippingAddress: validated.shippingAddress,
        shippingCity: validated.shippingCity,
        shippingState: validated.shippingState,
        shippingZip: validated.shippingZip,
        shippingCountry: validated.shippingCountry,
        requestedDate: validated.requestedDate
          ? new Date(validated.requestedDate)
          : null,
        notes: validated.notes,
        createdById: user.id,
        items: {
          create: validated.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // TODO: Send notification to warehouse team about new customer order

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Portal order creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
