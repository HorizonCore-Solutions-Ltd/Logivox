import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile API - Barcode Scanning
 * Handle barcode lookups for inventory, locations, and orders
 */

// POST /api/mobile/barcode/scan - Scan barcode and get info
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { barcode, scanType, context } = body;

    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_BARCODE",
            message: "Barcode is required",
          },
        },
        { status: 400 }
      );
    }

    let result = null;
    let entityType = null;

    // Try to find inventory item
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { barcode: barcode },
          { sku: barcode },
        ],
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        barcode: true,
        category: true,
        uom: true,
        stockOnHand: true,
        stockAvailable: true,
        reorderPoint: true,
        averageCost: true,
        retailPrice: true,
        imageUrl: true,
      },
    });

    if (item) {
      entityType = "INVENTORY_ITEM";
      result = item;
    } else {
      // Try to find location
      const location = await prisma.location.findFirst({
        where: {
          barcode: barcode,
          organizationId: session.user.organizationId,
        },
        select: {
          id: true,
          name: true,
          barcode: true,
          zone: true,
          aisle: true,
          rack: true,
          bin: true,
          locationType: true,
          capacity: true,
          currentQuantity: true,
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (location) {
        entityType = "LOCATION";
        result = location;
      } else {
        // Try to find sales order
        const order = await prisma.salesOrder.findFirst({
          where: {
            OR: [
              { soNumber: barcode },
              { externalOrderNumber: barcode },
            ],
            organizationId: session.user.organizationId,
          },
          select: {
            id: true,
            soNumber: true,
            status: true,
            priority: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            totalAmount: true,
            orderDate: true,
            _count: {
              select: {
                lines: true,
              },
            },
          },
        });

        if (order) {
          entityType = "SALES_ORDER";
          result = order;
        }
      }
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "No matching item, location, or order found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        barcode,
        entityType,
        entity: result,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Barcode scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SCAN_FAILED",
          message: "Failed to process barcode scan",
        },
      },
      { status: 500 }
    );
  }
}
