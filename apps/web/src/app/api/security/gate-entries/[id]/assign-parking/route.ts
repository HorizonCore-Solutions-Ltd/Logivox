import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const assignParkingSchema = z.object({
  parkingSpotId: z.string().optional(), // If not provided, auto-assign
  autoAssign: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Get gate entry
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = assignParkingSchema.parse(body);

    let parkingSpotId = data.parkingSpotId;

    // Auto-assign logic
    if (data.autoAssign && !parkingSpotId) {
      const where: any = {
        organizationId: session.user.organizationId,
        warehouseId: gateEntry.warehouseId,
        status: 'AVAILABLE',
      };

      // Match parking type to vehicle/cargo requirements
      if (gateEntry.hasDangerousGoods) {
        where.hazmatApproved = true;
      }

      // Find best available spot
      const availableSpot = await prisma.parkingSpot.findFirst({
        where,
        orderBy: [
          { zone: 'asc' },
          { spotNumber: 'asc' },
        ],
      });

      if (!availableSpot) {
        return NextResponse.json(
          { error: 'No available parking spots' },
          { status: 404 }
        );
      }

      parkingSpotId = availableSpot.id;
    }

    if (!parkingSpotId) {
      return NextResponse.json(
        { error: 'Parking spot ID is required' },
        { status: 400 }
      );
    }

    // Verify parking spot is available
    const parkingSpot = await prisma.parkingSpot.findFirst({
      where: {
        id: parkingSpotId,
        organizationId: session.user.organizationId,
        status: 'AVAILABLE',
      },
    });

    if (!parkingSpot) {
      return NextResponse.json(
        { error: 'Parking spot not available' },
        { status: 400 }
      );
    }

    // Update gate entry with parking assignment
    const updatedEntry = await prisma.gateEntry.update({
      where: { id: gateEntryId },
      data: {
        parkingSpotId,
      },
    });

    // Update parking spot status
    await prisma.parkingSpot.update({
      where: { id: parkingSpotId },
      data: {
        status: 'OCCUPIED',
        occupiedAt: new Date(),
        currentVehicleId: gateEntryId,
      },
    });

    return NextResponse.json({
      gateEntry: updatedEntry,
      parkingSpot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning parking:', error);
    return NextResponse.json(
      { error: 'Failed to assign parking' },
      { status: 500 }
    );
  }
}
