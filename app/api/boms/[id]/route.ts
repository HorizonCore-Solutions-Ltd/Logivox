import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBOMSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  bomType: z.enum(['ASSEMBLY', 'DISASSEMBLY', 'KIT', 'RECIPE', 'CONFIGURATION']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  estimatedTime: z.number().int().optional(),
  laborCost: z.number().optional(),
  overheadCost: z.number().optional(),
  standardYield: z.number().min(0).max(100).optional(),
  scrapRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// GET /api/boms/[id] - Get BOM details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bom = await prisma.billOfMaterials.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            costPrice: true,
            sellingPrice: true,
          },
        },
        components: {
          include: {
            component: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                costPrice: true,
                quantity: true,
                availableQty: true,
              },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            assemblyOrders: true,
          },
        },
      },
    });

    if (!bom) {
      return NextResponse.json(
        { error: "BOM not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bom);
  } catch (error) {
    console.error("Error fetching BOM:", error);
    return NextResponse.json(
      { error: "Failed to fetch BOM" },
      { status: 500 }
    );
  }
}

// PATCH /api/boms/[id] - Update BOM
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateBOMSchema.parse(body);

    // Check if BOM is used in any assembly orders
    const usageCount = await prisma.assemblyOrder.count({
      where: { 
        bomId: params.id,
        status: { in: ['PENDING', 'READY', 'IN_PROGRESS'] }
      },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot modify BOM that is being used in active assembly orders",
          activeOrders: usageCount,
        },
        { status: 409 }
      );
    }

    const bom = await prisma.billOfMaterials.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        product: true,
        components: {
          include: {
            component: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return NextResponse.json(bom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating BOM:", error);
    return NextResponse.json(
      { error: "Failed to update BOM" },
      { status: 500 }
    );
  }
}

// DELETE /api/boms/[id] - Delete BOM
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if BOM is used in any assembly orders
    const orderCount = await prisma.assemblyOrder.count({
      where: { bomId: params.id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete BOM that has been used in assembly orders",
          orderCount,
        },
        { status: 409 }
      );
    }

    await prisma.billOfMaterials.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "BOM deleted successfully" });
  } catch (error) {
    console.error("Error deleting BOM:", error);
    return NextResponse.json(
      { error: "Failed to delete BOM" },
      { status: 500 }
    );
  }
}
