export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating/updating PO
const purchaseOrderSchema = z.object({
  supplierId: z.string().cuid(),
  expectedDate: z.string().datetime().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryCountry: z.string().optional(),
  deliveryNotes: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().cuid().optional(),
        sku: z.string().min(1),
        description: z.string().min(1),
        quantityOrdered: z.number().int().positive(),
        unitPrice: z.number().positive(),
        tax: z.number().nonnegative().optional(),
      }),
    )
    .min(1),
});

// ============================================================================
// POST /api/purchase-orders - Create new purchase order
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = purchaseOrderSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 400 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Generate PO number
    const poCount = await prisma.purchaseOrder.count({
      where: { organizationId },
    });
    const poNumber = `PO-${Date.now()}-${String(poCount + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitPrice,
      0,
    );
    const tax = validatedData.items.reduce(
      (sum, item) => sum + (item.tax || 0),
      0,
    );
    const totalAmount = subtotal + tax;

    // Create PO with items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.create({
        data: {
          organizationId,
          supplierId: validatedData.supplierId,
          poNumber,
          status: "DRAFT",
          priority: validatedData.priority || "MEDIUM",
          expectedDate: validatedData.expectedDate
            ? new Date(validatedData.expectedDate)
            : null,
          subtotal,
          tax,
          totalAmount,
          deliveryAddress: validatedData.deliveryAddress,
          deliveryCity: validatedData.deliveryCity,
          deliveryCountry: validatedData.deliveryCountry,
          deliveryNotes: validatedData.deliveryNotes,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          createdById: session.user.id,
        },
        include: {
          supplier: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create PO items
      const items = await Promise.all(
        validatedData.items.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: po.id,
              inventoryItemId: item.inventoryItemId,
              sku: item.sku,
              description: item.description,
              quantityOrdered: item.quantityOrdered,
              unitPrice: item.unitPrice,
              tax: item.tax || 0,
              totalPrice:
                item.quantityOrdered * item.unitPrice + (item.tax || 0),
            },
          }),
        ),
      );

      return { ...po, items };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "CREATE",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        metadata: { poNumber },
      },
    });

    return NextResponse.json(
      {
        purchaseOrder,
        message: "Purchase order created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating purchase order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 },
    );
  }
}

// ============================================================================
// GET /api/purchase-orders - List all purchase orders
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 400 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    // Get purchase orders with pagination
    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
              email: true,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 },
    );
  }
}
