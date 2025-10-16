import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"

// POST /api/inventory/[id]/adjust - Adjust inventory quantity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quantity, type, reference, notes } = body

    // Validate required fields
    if (quantity === undefined || !type) {
      return NextResponse.json(
        { error: "Missing required fields: quantity, type" },
        { status: 400 }
      )
    }

    // Get current inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    // Calculate new quantity based on movement type
    let newQuantity = item.quantity
    const adjustmentAmount = Math.abs(quantity)

    switch (type) {
      case "PURCHASE":
      case "RETURN":
      case "ADJUSTMENT":
        newQuantity += adjustmentAmount
        break
      case "SALE":
      case "DAMAGE":
      case "TRANSFER":
        newQuantity -= adjustmentAmount
        break
      default:
        return NextResponse.json(
          { error: "Invalid movement type" },
          { status: 400 }
        )
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Insufficient quantity. Cannot reduce below 0." },
        { status: 400 }
      )
    }

    // Calculate new available quantity
    const newAvailableQuantity = newQuantity - item.reservedQuantity

    // Determine new status
    let newStatus = item.status
    if (newQuantity === 0) {
      newStatus = "OUT_OF_STOCK"
    } else if (item.minStockLevel && newQuantity <= item.minStockLevel) {
      newStatus = "LOW_STOCK"
    } else {
      newStatus = "ACTIVE"
    }

    // Update item and create movement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: params.id },
        data: {
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
          status: newStatus,
        },
        include: {
          warehouse: true,
          category: true,
        },
      })

      // Create movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          type,
          quantity: adjustmentAmount,
          reference,
          notes,
          organizationId: item.organizationId,
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          userId: user.id,
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "INVENTORY_ADJUSTED",
          entityType: "INVENTORY_ITEM",
          entityId: item.id,
          description: `${type}: ${adjustmentAmount} units of ${item.name} (${item.sku}). New quantity: ${newQuantity}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          organizationId: item.organizationId,
          userId: user.id,
        },
      })

      return { updatedItem, movement }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error adjusting inventory:", error)
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 }
    )
  }
}
