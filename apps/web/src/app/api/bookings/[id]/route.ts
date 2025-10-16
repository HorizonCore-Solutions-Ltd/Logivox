import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: true },
    })

    if (!user?.organizations?.[0]?.id) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const organizationId = user.organizations[0].id

    // Fetch booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: {
              include: {
                warehouse: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Booking fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizations: true },
    })

    if (!user?.organizations?.[0]?.id) {
      return NextResponse.json(
        { message: "No organization found" },
        { status: 404 }
      )
    }

    const organizationId = user.organizations[0].id

    // Verify booking exists and belongs to organization
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    if (!existingBooking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    // Validate status transition
    const validStatuses = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      )
    }

    // If status is changing to FULFILLED, reserve inventory
    if (status === "FULFILLED" && existingBooking.status !== "FULFILLED") {
      // Update inventory quantities
      for (const item of existingBooking.items) {
        const inventoryItem = item.inventoryItem

        // Check if enough stock available
        if (inventoryItem.availableQuantity < item.quantity) {
          return NextResponse.json(
            {
              message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.availableQuantity}, Required: ${item.quantity}`,
            },
            { status: 400 }
          )
        }

        // Update inventory - reduce available quantity, increase reserved quantity
        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            availableQuantity: inventoryItem.availableQuantity - item.quantity,
            reservedQuantity: inventoryItem.reservedQuantity + item.quantity,
          },
        })

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: "RESERVATION",
            quantity: -item.quantity,
            previousQuantity: inventoryItem.quantity,
            newQuantity: inventoryItem.quantity - item.quantity,
            reason: `Booking #${existingBooking.id.slice(0, 8)} fulfilled`,
            performedById: session.user.id,
          },
        })
      }
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "booking",
        entityId: booking.id,
        userId: session.user.id,
        details: JSON.stringify({
          status: booking.status,
          previousStatus: existingBooking.status,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Booking update error:", error)
    return NextResponse.json(
      { message: "Failed to update booking" },
      { status: 500 }
    )
  }
}
