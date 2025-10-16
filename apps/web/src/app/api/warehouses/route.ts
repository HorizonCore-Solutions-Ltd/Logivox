import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organizationId") || user.organizations[0]?.id

    const warehouses = await prisma.warehouse.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, description } = body

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        description,
        organizationId: user.organizations[0]?.id,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "warehouse",
        entityId: warehouse.id,
        userId: user.id,
        details: JSON.stringify({ name }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error("Error creating warehouse:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
