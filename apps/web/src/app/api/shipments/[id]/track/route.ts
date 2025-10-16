import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const trackingEventSchema = z.object({
  status: z.string(),
  description: z.string(),
  location: z.string().optional(),
  timestamp: z.string().optional()
});

/**
 * @route POST /api/shipments/:id/track
 * @desc Update tracking information (webhook or manual update)
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
    const body = await req.json();
    const validatedEvent = trackingEventSchema.parse(body);

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

    // Get shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId
      },
      include: {
        salesOrder: true
      }
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Get existing tracking events
    const existingEvents = (shipment.trackingEvents as any[]) || [];
    
    // Add new event
    const newEvent = {
      status: validatedEvent.status,
      description: validatedEvent.description,
      location: validatedEvent.location,
      timestamp: validatedEvent.timestamp || new Date().toISOString()
    };

    // Determine shipment status from event
    let newStatus = shipment.status;
    if (validatedEvent.status.includes("DELIVERED")) {
      newStatus = "DELIVERED";
    } else if (validatedEvent.status.includes("OUT_FOR_DELIVERY")) {
      newStatus = "OUT_FOR_DELIVERY";
    } else if (validatedEvent.status.includes("IN_TRANSIT")) {
      newStatus = "IN_TRANSIT";
    } else if (validatedEvent.status.includes("EXCEPTION")) {
      newStatus = "EXCEPTION";
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: newStatus as any,
        trackingEvents: [...existingEvents, newEvent] as any,
        lastTrackingUpdate: new Date(),
        ...(newStatus === "DELIVERED" && {
          actualDelivery: new Date()
        }),
        ...(newStatus === "EXCEPTION" && {
          exceptionReason: validatedEvent.description,
          exceptionDate: new Date()
        })
      }
    });

    // Update sales order if delivered
    if (newStatus === "DELIVERED") {
      await prisma.salesOrder.update({
        where: { id: shipment.salesOrderId },
        data: {
          status: "DELIVERED",
          deliveredDate: new Date()
        }
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: "SHIPMENT_DELIVERED",
          entityType: "SHIPMENT",
          entityId: shipmentId,
          metadata: {
            shipmentNumber: shipment.shipmentNumber,
            salesOrderNumber: shipment.salesOrder.soNumber,
            trackingNumber: shipment.trackingNumber,
            deliveredDate: new Date().toISOString(),
            location: validatedEvent.location
          }
        }
      });
    }

    return NextResponse.json({
      shipment: updatedShipment,
      event: newEvent
    });

  } catch (error: any) {
    console.error("Error updating tracking:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update tracking" },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/shipments/:id/track
 * @desc Get tracking history for a shipment
 * @access Private
 */
export async function GET(
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

    // Get shipment with tracking info
    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        organizationId
      },
      select: {
        id: true,
        shipmentNumber: true,
        trackingNumber: true,
        trackingUrl: true,
        status: true,
        carrierCode: true,
        carrierName: true,
        carrierService: true,
        shippedDate: true,
        estimatedDelivery: true,
        actualDelivery: true,
        trackingEvents: true,
        lastTrackingUpdate: true
      }
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...shipment,
      events: shipment.trackingEvents || []
    });

  } catch (error: any) {
    console.error("Error fetching tracking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tracking" },
      { status: 500 }
    );
  }
}
