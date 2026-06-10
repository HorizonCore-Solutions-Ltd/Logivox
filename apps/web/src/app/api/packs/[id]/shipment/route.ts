import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const packId = params.id;

    // Fetch Pack
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: {
        salesOrder: {
          include: { customer: true },
        },
      },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    if (pack.status === "SHIPPED") {
      return NextResponse.json(
        { error: "Pack already shipped" },
        { status: 400 },
      );
    }

    // Generate Shipment Number
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const count = await prisma.shipment.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    const shipmentNumber = `SH-${dateStr}-${String(count + 1).padStart(4, "0")}`;
    const trackingNumber = `TRK-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Create Shipment in Transaction
    const shipment = await prisma.$transaction(async (tx) => {
      // 1. Create Shipment Record
      const newShipment = await tx.shipment.create({
        data: {
          organizationId,
          shipmentNumber,
          salesOrderId: pack.salesOrderId,
          packId: pack.id,
          status: "PENDING", // Initial status
          carrierName: "Manual", // Default for now
          trackingNumber,
          createdById: session.user.id,
          shippedDate: new Date(),
          recipientName: pack.salesOrder.customer.name,
          // Default address from SO if available, but skipping for brevity
        },
      });

      // 2. Update Pack Status
      await tx.pack.update({
        where: { id: pack.id },
        data: { status: "SHIPPED" },
      });

      // 3. Update Sales Order Status
      await tx.salesOrder.update({
        where: { id: pack.salesOrderId },
        data: {
          status: "SHIPPED",
          shippedDate: new Date(),
          carrierName: "Manual",
          trackingNumber: newShipment.trackingNumber,
        },
      });

      return newShipment;
    });

    return NextResponse.json({ success: true, shipment });
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create shipment" },
      { status: 500 },
    );
  }
}
