import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Authenticate with API key
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return auth.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const warehouse = searchParams.get("warehouse")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (warehouse) {
      where.warehouseId = warehouse
    }

    // Get inventory items
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("API inventory fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch inventory items" },
      { status: 500 }
    )
  }
}
