export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @route POST /api/shipments/:id/ship
 * @desc Mark shipment as shipped (picked up by carrier)
 * @access Private
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shipmentId = params.id;

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to mark as shipped
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get shipment
        const shipment = await tx.shipment.findFirst({
          where: {
            id: shipmentId,
            organizationId,
          },
          include: {
            salesOrder: true,
          },
        });

        if (!shipment) {
          throw new Error("Shipment not found");
        }

        // Must have tracking number to ship
        if (!shipment.trackingNumber) {
          throw new Error(
            "Cannot ship without tracking number. Generate label first.",
          );
        }

        // Check current status
        if (shipment.status === "SHIPPED" || shipment.status === "DELIVERED") {
          throw new Error(`Shipment already ${shipment.status.toLowerCase()}`);
        }

        // Update tracking events
        const existingEvents = (shipment.trackingEvents as any[]) || [];
        const newEvent = {
          status: "IN_TRANSIT",
          description: "Package picked up by carrier",
          location: "Origin Facility",
          timestamp: new Date().toISOString(),
        };

        // Update shipment status
        const updatedShipment = await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: "SHIPPED",
            shippedDate: new Date(),
            trackingEvents: [...existingEvents, newEvent] as any,
            lastTrackingUpdate: new Date(),
          },
        });

        // Update sales order status
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId },
          data: {
            status: "SHIPPED",
            shippedDate: new Date(),
          },
        });

        // Release reserved inventory (convert to shipped)
        const soItems = await tx.salesOrderItem.findMany({
          where: { salesOrderId: shipment.salesOrderId },
          include: { inventoryItem: true },
        });

        for (const item of soItems) {
          const qtyToShip = item.quantityPacked || item.quantityPicked || item.quantity;

          // Decrement reserved quantity and on-hand quantity (stock physically leaves)
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              reservedQty: { decrement: qtyToShip },
              quantity: { decrement: qtyToShip },
            },
          });

          // Create outbound inventory movement record
          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              type: "SALE",
              quantity: qtyToShip,
              reason: `Shipped via ${shipment.shipmentNumber}`,
              notes: `Sales Order ${shipment.salesOrder.soNumber} — dispatched by carrier ${shipment.carrierCode}`,
            },
          });

          // Update SO item shipped quantity
          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: { quantityShipped: qtyToShip },
          });
        }

        // Create activity log
        await tx.activityLog.create({
          data: {
            organizationId,
            userId: session.user.id,
            action: "SHIPMENT_SHIPPED",
            entityType: "SHIPMENT",
            entityId: shipmentId,
            metadata: {
              shipmentNumber: shipment.shipmentNumber,
              salesOrderNumber: shipment.salesOrder.soNumber,
              trackingNumber: shipment.trackingNumber,
              carrier: shipment.carrierCode,
              shippedDate: new Date().toISOString(),
            },
          },
        });

        return updatedShipment;
      },
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error shipping order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as shipped" },
      { status: 500 },
    );
  }
}
