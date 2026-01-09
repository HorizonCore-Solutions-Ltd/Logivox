import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile API - Inventory Lookup
 * Quick inventory lookup for mobile devices
 */

// GET /api/mobile/inventory/{id} - Get inventory item details
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            leadTime: true,
          },
        },
        stockLevels: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        locations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                barcode: true,
                zone: true,
                aisle: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Item not found" },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch inventory item",
        },
      },
      { status: 500 },
    );
  }
}
