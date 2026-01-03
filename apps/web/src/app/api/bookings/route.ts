export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bookingItemSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
})

const bookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  bookingDate: z.string(),
  deliveryDate: z.string().optional().nullable(),
  status: z.enum(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]).default("PENDING"),
  notes: z.string().optional().nullable(),
  items: z.array(bookingItemSchema).min(1, "At least one item is required"),
})

export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Build filter
    const where: any = { organizationId }
    if (status) {
      where.status = status
    }

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            type: true,
          },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Bookings fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    // Create booking with items
    const booking = await prisma.booking.create({
      data: {
        customerId: validatedData.customerId,
        organizationId,
        bookingDate: new Date(validatedData.bookingDate),
        deliveryDate: validatedData.deliveryDate
          ? new Date(validatedData.deliveryDate)
          : null,
        status: validatedData.status,
        totalAmount,
        notes: validatedData.notes,
        items: {
          create: validatedData.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
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
        action: "CREATE",
        entityType: "booking",
        entityId: booking.id,
        userId: session.user.id,
        details: JSON.stringify({
          customerId: booking.customerId,
          status: booking.status,
          totalAmount: booking.totalAmount.toString(),
          itemsCount: booking.items.length,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Booking creation error:", error)
    return NextResponse.json(
      { message: "Failed to create booking" },
      { status: 500 }
    )
  }
}
