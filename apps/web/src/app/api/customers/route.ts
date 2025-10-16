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
    const type = searchParams.get("type")

    // Build filter
    const where: any = { organizationId }
    if (type) {
      where.type = type
    }

    // Fetch customers/suppliers
    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Customers fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch customers" },
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
    const validatedData = customerSchema.parse(body)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        organizationId,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
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

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      )
    }

    console.error("Customer creation error:", error)
    return NextResponse.json(
      { message: "Failed to create customer" },
      { status: 500 }
    )
  }
}
