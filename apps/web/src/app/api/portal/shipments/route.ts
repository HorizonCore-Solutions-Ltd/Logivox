import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow CUSTOMER role access to portal
    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden - Customer access only" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { customer: true },
    });

    if (!user?.customerId) {
      return NextResponse.json(
        { error: "Customer not linked" },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      order: {
        customerId: user.customerId,
        organizationId: session.user.organizationId,
      },
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { shipmentNumber: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Fetch shipments with related data
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
          carrier: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    return NextResponse.json({
      shipments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
      );
  }
}
