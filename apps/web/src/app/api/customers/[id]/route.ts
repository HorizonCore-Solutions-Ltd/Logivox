export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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

    // Fetch customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        bookings: {
          include: {
            items: {
              include: {
                inventoryItem: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Customer fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch customer" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Verify customer exists and belongs to organization
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = customerSchema.parse(body)

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "customer",
        entityId: customer.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: customer.name,
          type: customer.type,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Customer update error:", error)
    return NextResponse.json(
      { message: "Failed to update customer" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify customer exists and belongs to organization
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      )
    }

    // Check if customer has bookings
    if (existingCustomer._count.bookings > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete customer with ${existingCustomer._count.bookings} booking(s)`,
        },
        { status: 400 }
      )
    }

    // Create activity log before deletion
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "customer",
        entityId: params.id,
        userId: session.user.id,
        details: JSON.stringify({
          name: existingCustomer.name,
          type: existingCustomer.type,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    // Delete customer
    await prisma.customer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Customer deletion error:", error)
    return NextResponse.json(
      { message: "Failed to delete customer" },
      { status: 500 }
    )
  }
}
