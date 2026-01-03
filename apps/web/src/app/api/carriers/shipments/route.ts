import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { carrierService, Address, Package } from '@/lib/services/carrier-integrations';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/carriers/shipments
 * 
 * Create a shipment with a carrier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      carrier, 
      service, 
      origin, 
      destination, 
      packages,
      shipmentId // Optional - to link with existing shipment
    } = body;

    // Validate required fields
    if (!carrier || !service || !origin || !destination || !packages || packages.length === 0) {
      return NextResponse.json(
        { error: 'Carrier, service, origin, destination, and packages are required' },
        { status: 400 }
      );
    }

    // Create shipment with carrier
    const label = await carrierService.createShipment(
      carrier,
      origin as Address,
      destination as Address,
      packages as Package[],
      service
    );

    // If shipmentId provided, update the shipment record
    if (shipmentId) {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          trackingNumber: label.trackingNumber,
          carrier: label.carrier,
          service: label.service,
          shippingCost: label.cost,
          labelUrl: label.labelUrl,
          status: 'SHIPPED',
          shippedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'SHIPMENT_CREATED',
          entityType: 'Shipment',
          entityId: shipmentId,
          userId: session.user.id,
          organizationId: session.user.organizationId,
          metadata: {
            trackingNumber: label.trackingNumber,
            carrier: label.carrier,
            service: label.service,
            cost: label.cost,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      label,
      shipmentId,
    });

  } catch (error: any) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create shipment',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
