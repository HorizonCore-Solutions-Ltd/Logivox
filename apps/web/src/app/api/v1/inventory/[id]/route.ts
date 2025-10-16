import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate with API key
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) {
    return auth.error
  }

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: params.id,
        organizationId: auth.organizationId,
      },
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
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            quantity: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { message: "Inventory item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    console.error("API inventory item fetch error:", error)
    return NextResponse.json(
      { message: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}
