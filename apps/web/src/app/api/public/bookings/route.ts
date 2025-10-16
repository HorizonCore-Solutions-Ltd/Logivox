import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  // Authenticate API key
  const auth = await authenticateApiKey(request)
  if (!auth.authenticated) return auth.error!

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  // Build where clause
  const where: any = { organizationId: auth.organizationId }
  if (status) {
    where.status = status
  }

  // Fetch bookings for the organization
  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      bookingDate: true,
      deliveryDate: true,
      status: true,
      totalAmount: true,
      notes: true,
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
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
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
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(bookings)
}
