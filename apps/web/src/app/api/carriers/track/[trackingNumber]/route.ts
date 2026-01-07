import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { carrierService } from "@/lib/services/carrier-integrations";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/carriers/track/:trackingNumber
 *
 * Track a shipment by tracking number
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackingNumber } = params;
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get("carrier");

    if (!carrier) {
      return NextResponse.json(
        { error: "Carrier parameter is required" },
        { status: 400 },
      );
    }

    // Get tracking info from carrier
    const trackingInfo = await carrierService.trackShipment(
      carrier,
      trackingNumber,
    );

    // Update shipment record if exists
    const shipment = await prisma.shipment.findFirst({
      where: {
        trackingNumber,
        organizationId: session.user.organizationId,
      },
    });

    if (shipment) {
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: trackingInfo.status.toUpperCase(),
          estimatedDelivery: trackingInfo.estimatedDelivery,
          deliveredAt: trackingInfo.actualDelivery,
          updatedAt: new Date(),
        },
      });

      // Create tracking events
      for (const event of trackingInfo.events) {
        await prisma.trackingEvent.upsert({
          where: {
            shipmentId_timestamp: {
              shipmentId: shipment.id,
              timestamp: event.timestamp,
            },
          },
          update: {
            status: event.status,
            location: event.location,
            description: event.description,
          },
          create: {
            shipmentId: shipment.id,
            timestamp: event.timestamp,
            status: event.status,
            location: event.location,
            description: event.description,
          },
        });
      }
    }

    return NextResponse.json({
      trackingNumber,
      carrier,
      trackingInfo,
      shipmentId: shipment?.id,
    });
  } catch (error: any) {
    console.error("Error tracking shipment:", error);
    return NextResponse.json(
      {
        error: "Failed to track shipment",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
