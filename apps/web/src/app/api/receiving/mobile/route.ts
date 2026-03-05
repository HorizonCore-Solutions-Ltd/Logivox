import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Safety check for Organization ID
    let organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { organizationMemberships: true },
      });
      organizationId = user?.organizationMemberships[0]?.organizationId;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "my_tasks" || action === "tasks") {
      // Find POs ready for receiving (SENT, CONFIRMED, PARTIALLY_RECEIVED)
      // We explicitly select fields to avoid huge payload
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          organizationId,
          status: { in: ["SENT", "CONFIRMED", "PARTIALLY_RECEIVED"] },
        },
        include: {
          supplier: { select: { name: true } },
          items: {
            include: {
              inventoryItem: { select: { name: true, sku: true } },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const tasks = pos.map((po) => ({
        id: po.id, // Use PO ID as Task ID
        shipmentNumber: po.poNumber, // Display as Shipment/PO Number
        supplier: po.supplier.name,
        poNumber: po.poNumber,
        status: po.status,
        priority: 1,
        appointmentTime: po.expectedDeliveryDate || null,
        itemCount: po.items.length,
        dockNumber: null,
        // Include items strictly for frontend detail view
        items: po.items.map((item) => ({
          id: item.inventoryItemId,
          poItemId: item.id,
          name: item.inventoryItem?.name || item.description,
          sku: item.sku,
          orderedQty: item.quantityOrdered,
          receivedQty: item.quantityReceived || 0,
        })),
      }));

      return NextResponse.json({ tasks });
    }

    if (action === "quick_stats") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = await prisma.goodsReceiptNote.count({
        where: {
          organizationId,
          createdAt: { gte: today },
        },
      });

      const activePos = await prisma.purchaseOrder.count({
        where: {
          organizationId,
          status: { in: ["SENT", "CONFIRMED"] },
        },
      });

      return NextResponse.json({
        stats: {
          todayCompleted: completedToday,
          myActive: activePos,
          myTodayUnits: 0, // dynamic calc omitted for speed
          userName: session.user.name,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in mobile receiving API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Handler for quick actions from mobile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, barcode } = body;

    // Find Org ID again
    let organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { organizationMemberships: true },
      });
      organizationId = user?.organizationMemberships[0]?.organizationId;
    }

    if (action === "scan_barcode") {
      // Find PO by number
      const po = await prisma.purchaseOrder.findFirst({
        where: {
          organizationId,
          poNumber: { contains: barcode, mode: "insensitive" },
          status: { in: ["SENT", "CONFIRMED", "PARTIALLY_RECEIVED"] },
        },
      });

      if (po) {
        return NextResponse.json({
          success: true,
          result: {
            shipmentNumber: po.poNumber,
            id: po.id,
          },
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "No matching Shipment found",
        });
      }
    }

    // Note: Actual receiving is done via /api/grn

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
