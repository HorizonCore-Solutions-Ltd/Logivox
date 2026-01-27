export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";

// Input validation schema
const createInventorySchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  barcode: z.string().max(100).optional(),
  quantity: z.number().int().min(0),
  minStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  unit: z.string().max(20),
  organizationId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
});

// GET /api/inventory - List all inventory items for current organization
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Input validation for query parameters
    const organizationId = searchParams.get("organizationId");
    const warehouseId = searchParams.get("warehouseId");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    // Validate organization access
    if (organizationId && !user.organizations?.some(org => org.id === organizationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build secure where clause
    const where: any = {
      // Ensure user can only access their organization's data
      organization: {
        members: {
          some: {
            userId: user.id,
            isActive: true
          }
        }
      }
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status && ['ACTIVE', 'INACTIVE', 'DISCONTINUED'].includes(status)) {
      where.status = status;
    }

    if (search && search.length <= 100) { // Limit search length
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true }
        },
        category: {
          select: { id: true, name: true }
        },
        organization: {
          select: { id: true, name: true }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000, // Limit results
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_LIST",
        userId: user.id,
        metadata: {
          itemCount: items.length,
          filters: { organizationId, warehouseId, categoryId, status, search: !!search }
        }
      }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching inventory items:", error);
    
    // Security: Don't expose internal errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      description,
      barcode,
      quantity,
      minStockLevel,
      reorderPoint,
      costPrice,
      sellingPrice,
      unit,
      organizationId,
      warehouseId,
      categoryId,
    } = body;

    // Validate required fields
    if (!name || !sku || !organizationId || !warehouseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if SKU already exists
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        sku,
        organizationId,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "SKU already exists in this organization" },
        { status: 409 },
      );
    }

    // Calculate quantities
    const qty = quantity || 0;
    const reserved = 0;
    const available = qty - reserved;

    // Determine status
    let status = "ACTIVE";
    if (qty === 0) {
      status = "OUT_OF_STOCK";
    } else if (minStockLevel && qty <= minStockLevel) {
      status = "LOW_STOCK";
    }

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku,
        description,
        barcode,
        quantity: qty,
        reservedQuantity: reserved,
        availableQuantity: available,
        minStockLevel: minStockLevel || 0,
        reorderPoint: reorderPoint || 0,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        unit: unit || "piece",
        status,
        organizationId,
        warehouseId,
        categoryId,
      },
      include: {
        warehouse: true,
        category: true,
        organization: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "INVENTORY_ITEM_CREATED",
        entityType: "INVENTORY_ITEM",
        entityId: item.id,
        description: `Created inventory item: ${item.name} (SKU: ${item.sku})`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        organizationId,
        userId: user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 },
    );
  }
}
