export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Validation schema for creating sales orders
const createSOSchema = z.object({
  customerId: z.string(),
  warehouseId: z.string().optional(),
  requestedDate: z.string().optional(),
  promisedDate: z.string().optional(),
  shippingMethod: z
    .enum(["STANDARD", "EXPRESS", "OVERNIGHT", "PICKUP", "FREIGHT"])
    .optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  paymentMethod: z.string().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL"]).optional(),
  items: z.array(
    z.object({
      inventoryItemId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      discount: z.number().nonnegative().optional(),
      taxRate: z.number().nonnegative().optional(),
      binLocation: z.string().optional(),
      batchNumber: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

// GET /api/sales-orders - List all sales orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizations?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");

    const where: any = { organizationId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { soNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [salesOrders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true,
              phone: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return NextResponse.json({
      salesOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales orders" },
      { status: 500 },
    );
  }
}

// POST /api/sales-orders - Create a new sales order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizations?.[0]?.id;
    const userId = session.user.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createSOSchema.parse(body);

    // Generate SO number: SO-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `SO-${dateStr}`;

    const lastSO = await prisma.salesOrder.findFirst({
      where: {
        organizationId,
        soNumber: { startsWith: prefix },
      },
      orderBy: { soNumber: "desc" },
    });

    let sequence = 1;
    if (lastSO) {
      const lastSequence = parseInt(lastSO.soNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }
    const soNumber = `${prefix}-${sequence.toString().padStart(3, "0")}`;

    // Calculate totals
    const items = validatedData.items;
    let subtotal = 0;
    let taxAmount = 0;

    const itemsToCreate = items.map((item) => {
      const discount = item.discount || 0;
      const taxRate = item.taxRate || 0;
      const lineSubtotal = item.quantity * item.unitPrice - discount;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        quantityPicked: 0,
        quantityPacked: 0,
        quantityShipped: 0,
        unitPrice: item.unitPrice,
        discount: discount,
        taxRate: taxRate,
        lineTotal: lineTotal,
        binLocation: item.binLocation,
        batchNumber: item.batchNumber,
        notes: item.notes,
      };
    });

    const total =
      subtotal + taxAmount + (validatedData.shippingAddress ? 0 : 0);

    // Create sales order with items
    const salesOrder = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const so = await tx.salesOrder.create({
          data: {
            organizationId,
            soNumber,
            customerId: validatedData.customerId,
            warehouseId: validatedData.warehouseId,
            status: (validatedData.status as any) || "DRAFT",
            orderDate: new Date(),
            requestedDate: validatedData.requestedDate
              ? new Date(validatedData.requestedDate)
              : null,
            promisedDate: validatedData.promisedDate
              ? new Date(validatedData.promisedDate)
              : null,
            shippingMethod: validatedData.shippingMethod as any,
            shippingAddress: validatedData.shippingAddress,
            shippingCity: validatedData.shippingCity,
            shippingState: validatedData.shippingState,
            shippingZip: validatedData.shippingZip,
            shippingCountry: validatedData.shippingCountry,
            subtotal,
            taxAmount,
            shippingCost: 0,
            discount: 0,
            total,
            paymentStatus: "UNPAID",
            paymentMethod: validatedData.paymentMethod,
            paidAmount: 0,
            priority: validatedData.priority || 0,
            notes: validatedData.notes,
            internalNotes: validatedData.internalNotes,
            createdById: userId,
            items: {
              create: itemsToCreate,
            },
          },
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
            customer: true,
            warehouse: true,
            createdBy: {
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
            action: "SALES_ORDER_CREATED",
            entityType: "SalesOrder",
            entityId: so.id,
            metadata: {
              soNumber: so.soNumber,
              customerId: validatedData.customerId,
              total: total.toString(),
              itemCount: items.length,
            },
          },
        });

        return so;
      },
    );

    return NextResponse.json(salesOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating sales order:", error);
    return NextResponse.json(
      { error: "Failed to create sales order" },
      { status: 500 },
    );
  }
}
