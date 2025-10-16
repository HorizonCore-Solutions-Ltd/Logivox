import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * @route POST /api/shipments/:id/label
 * @desc Generate shipping label for a shipment
 * @access Private
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shipmentId = params.id;

    // Get organization ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          where: { isActive: true },
          include: { organization: true }
        }
      }
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 403 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Transaction to generate label
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get shipment
      const shipment = await tx.shipment.findFirst({
        where: {
          id: shipmentId,
          organizationId
        },
        include: {
          salesOrder: {
            include: {
              customer: true
            }
          }
        }
      });

      if (!shipment) {
        throw new Error("Shipment not found");
      }

      // Check if label already generated
      if (shipment.trackingNumber && shipment.labelUrl) {
        return {
          shipment,
          message: "Label already exists",
          newLabel: false
        };
      }

      // Mock label generation (in production, call carrier API)
      // Generate tracking number
      const trackingPrefix: Record<string, string> = {
        UPS: "1Z",
        FEDEX: "7",
        DHL: "00",
        USPS: "92"
      };

      const prefix = trackingPrefix[shipment.carrierCode || "UPS"] || "XX";
      const randomNum = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
      const trackingNumber = `${prefix}${randomNum}`;

      // Generate tracking URL
      const trackingUrls: Record<string, string> = {
        UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
        FEDEX: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
        DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
        USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
      };

      const trackingUrl = trackingUrls[shipment.carrierCode || "UPS"] || "#";

      // Mock label URL (in production, this would be the actual PDF/PNG from carrier)
      const labelUrl = `https://labels.example.com/${shipmentId}.pdf`;

      // Calculate estimated delivery
      const serviceDays: Record<string, number> = {
        GROUND: 5,
        "3DAY": 3,
        "2DAY": 2,
        NEXT_DAY: 1,
        EXPRESS: 2,
        PRIORITY: 3,
        FIRST_CLASS: 3
      };

      const serviceCode = shipment.carrierService?.split(' ').pop()?.toUpperCase() || "GROUND";
      const days = serviceDays[serviceCode] || 5;
      
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + days);

      // Mock shipping cost calculation
      const baseCosts: Record<string, number> = {
        GROUND: 15,
        "3DAY": 25,
        "2DAY": 35,
        NEXT_DAY: 50,
        EXPRESS: 30,
        PRIORITY: 12,
        FIRST_CLASS: 8
      };

      const baseCost = baseCosts[serviceCode] || 15;
      const weightCost = (shipment.weight?.toNumber() || 1) * 2;
      const shippingCost = baseCost + weightCost;

      // Update shipment with label info
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "PROCESSING",
          trackingNumber,
          trackingUrl,
          labelUrl,
          labelFormat: "PDF",
          estimatedDelivery,
          shippingCost,
          lastTrackingUpdate: new Date(),
          trackingEvents: [
            {
              status: "LABEL_CREATED",
              description: "Shipping label created",
              location: "Origin Facility",
              timestamp: new Date().toISOString()
            }
          ] as any
        }
      });

      // Update sales order tracking info
      await tx.salesOrder.update({
        where: { id: shipment.salesOrderId },
        data: {
          trackingNumber,
          carrierName: shipment.carrierName
        }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "SHIPPING_LABEL_GENERATED",
          entityType: "SHIPMENT",
          entityId: shipmentId,
          metadata: {
            shipmentNumber: shipment.shipmentNumber,
            trackingNumber,
            carrier: shipment.carrierCode,
            service: shipment.carrierService,
            estimatedDelivery: estimatedDelivery.toISOString()
          }
        }
      });

      return {
        shipment: updatedShipment,
        message: "Label generated successfully",
        newLabel: true
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error generating label:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate label" },
      { status: 500 }
    );
  }
}
