import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssemblyOrderSchema = z.object({
  bomId: z.string().min(1, "BOM ID is required"),
  plannedQuantity: z.number().int().min(1, "Planned quantity must be at least 1"),
  priority: z.number().int().min(0).max(10).default(0),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  warehouseId: z.string().optional(),
  workstationId: z.string().optional(),
  assignedToId: z.string().optional(),
  autoDeduct: z.boolean().default(true),
  qcRequired: z.boolean().default(false),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  salesOrderId: z.string().optional(),
  notes: z.string().optional(),
});

// Helper function to generate assembly order number
async function generateAssemblyOrderNumber(organizationId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const lastOrder = await prisma.assemblyOrder.findFirst({
    where: {
      organizationId,
      orderNumber: {
        startsWith: `ASM-${dateStr}`,
      },
    },
    orderBy: { orderNumber: 'desc' },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `ASM-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

// Helper function to check component availability
async function checkComponentAvailability(
  bomId: string,
  quantity: number,
  organizationId: string
) {
  const bom = await prisma.billOfMaterials.findUnique({
    where: { id: bomId },
    include: {
      components: {
        include: {
          component: true,
        },
      },
    },
  });

  if (!bom) {
    throw new Error("BOM not found");
  }

  const shortages = [];
  
  for (const bomComp of bom.components) {
    const required = Number(bomComp.quantity) * quantity;
    const available = bomComp.component.availableQty;
    
    if (available < required && !bomComp.isOptional) {
      shortages.push({
        componentId: bomComp.componentId,
        sku: bomComp.component.sku,
        name: bomComp.component.name,
        required,
        available,
        shortage: required - available,
      });
    }
  }

  return shortages;
}

// GET /api/assembly-orders - List all assembly orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = {
      organizationId,
      ...(status && { status: status as any }),
      ...(productId && { productId }),
    };

    const [orders, total] = await Promise.all([
      prisma.assemblyOrder.findMany({
        where,
        include: {
          bom: {
            select: {
              id: true,
              bomNumber: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              componentIssues: true,
              productionLogs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.assemblyOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching assembly orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch assembly orders" },
      { status: 500 }
    );
  }
}

// POST /api/assembly-orders - Create new assembly order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAssemblyOrderSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get BOM
    const bom = await prisma.billOfMaterials.findUnique({
      where: { id: validatedData.bomId },
      include: {
        product: true,
      },
    });

    if (!bom) {
      return NextResponse.json(
        { error: "BOM not found" },
        { status: 404 }
      );
    }

    // Check component availability
    const shortages = await checkComponentAvailability(
      validatedData.bomId,
      validatedData.plannedQuantity,
      organizationId
    );

    if (shortages.length > 0) {
      return NextResponse.json(
        {
          error: "Insufficient components",
          shortages,
        },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = await generateAssemblyOrderNumber(organizationId);

    // Create assembly order
    const order = await prisma.assemblyOrder.create({
      data: {
        organizationId,
        orderNumber,
        bomId: validatedData.bomId,
        productId: bom.productId,
        plannedQuantity: validatedData.plannedQuantity,
        priority: validatedData.priority,
        scheduledStart: validatedData.scheduledStart ? new Date(validatedData.scheduledStart) : null,
        scheduledEnd: validatedData.scheduledEnd ? new Date(validatedData.scheduledEnd) : null,
        warehouseId: validatedData.warehouseId,
        workstationId: validatedData.workstationId,
        assignedToId: validatedData.assignedToId,
        autoDeduct: validatedData.autoDeduct,
        qcRequired: validatedData.qcRequired,
        referenceType: validatedData.referenceType,
        referenceId: validatedData.referenceId,
        salesOrderId: validatedData.salesOrderId,
        notes: validatedData.notes,
        status: 'PENDING',
        createdById: session.user.id,
      },
      include: {
        bom: {
          include: {
            components: {
              include: {
                component: true,
              },
            },
          },
        },
        product: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating assembly order:", error);
    return NextResponse.json(
      { error: "Failed to create assembly order" },
      { status: 500 }
    );
  }
}
