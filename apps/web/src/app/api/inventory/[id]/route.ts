import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"

// GET /api/inventory/[id] - Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        warehouse: true,
        category: true,
        organization: true,
        movements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      barcode,
      minStockLevel,
      reorderPoint,
      costPrice,
      sellingPrice,
      unit,
      warehouseId,
      categoryId,
    } = body

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    // Update item
    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name,
        description,
        barcode,
        minStockLevel,
        reorderPoint,
        costPrice,
        sellingPrice,
        unit,
        warehouseId,
        categoryId,
      },
      include: {
        warehouse: true,
        category: true,
        organization: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "INVENTORY_ITEM_UPDATED",
        entityType: "INVENTORY_ITEM",
        entityId: item.id,
        description: `Updated inventory item: ${item.name} (SKU: ${item.sku})`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        organizationId: item.organizationId,
        userId: user.id,
      },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    // Delete item (movements will be cascade deleted)
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "INVENTORY_ITEM_DELETED",
        entityType: "INVENTORY_ITEM",
        entityId: params.id,
        description: `Deleted inventory item: ${existingItem.name} (SKU: ${existingItem.sku})`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        organizationId: existingItem.organizationId,
        userId: user.id,
      },
    })

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    )
  }
}
