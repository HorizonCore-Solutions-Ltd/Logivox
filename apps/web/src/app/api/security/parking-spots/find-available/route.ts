import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const findAvailableSchema = z.object({
  warehouseId: z.string(),
  type: z.enum(['STANDARD', 'OVERSIZED', 'REFRIGERATED', 'HAZMAT']).optional(),
  requiresElectricity: z.string().optional(),
  requiresRefrigeration: z.string().optional(),
  requiresHazmat: z.string().optional(),
  vehicleLength: z.string().optional(),
  vehicleWidth: z.string().optional(),
  vehicleHeight: z.string().optional(),
  vehicleWeight: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    const params = findAvailableSchema.parse({
      warehouseId: searchParams.get('warehouseId') || '',
      type: searchParams.get('type') || undefined,
      requiresElectricity: searchParams.get('requiresElectricity') || undefined,
      requiresRefrigeration: searchParams.get('requiresRefrigeration') || undefined,
      requiresHazmat: searchParams.get('requiresHazmat') || undefined,
      vehicleLength: searchParams.get('vehicleLength') || undefined,
      vehicleWidth: searchParams.get('vehicleWidth') || undefined,
      vehicleHeight: searchParams.get('vehicleHeight') || undefined,
      vehicleWeight: searchParams.get('vehicleWeight') || undefined,
    });

    const where: any = {
      organizationId: session.user.organizationId,
      warehouseId: params.warehouseId,
      status: 'AVAILABLE',
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.requiresElectricity === 'true') {
      where.hasElectricity = true;
    }

    if (params.requiresRefrigeration === 'true') {
      where.refrigeratedApproved = true;
    }

    if (params.requiresHazmat === 'true') {
      where.hazmatApproved = true;
    }

    // Add size constraints
    if (params.vehicleLength) {
      where.maxVehicleLength = { gte: parseFloat(params.vehicleLength) };
    }

    if (params.vehicleWidth) {
      where.maxVehicleWidth = { gte: parseFloat(params.vehicleWidth) };
    }

    if (params.vehicleHeight) {
      where.maxVehicleHeight = { gte: parseFloat(params.vehicleHeight) };
    }

    if (params.vehicleWeight) {
      where.maxWeight = { gte: parseFloat(params.vehicleWeight) };
    }

    const availableSpots = await prisma.parkingSpot.findMany({
      where,
      orderBy: [
        { zone: 'asc' },
        { spotNumber: 'asc' },
      ],
    });

    if (availableSpots.length === 0) {
      return NextResponse.json(
        { error: 'No available parking spots match the requirements' },
        { status: 404 }
      );
    }

    // Return the closest/best match (first in sorted list)
    const recommendedSpot = availableSpots[0];

    return NextResponse.json({
      recommendedSpot,
      alternativeSpots: availableSpots.slice(1, 5), // Up to 4 alternatives
      totalAvailable: availableSpots.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error finding available spots:', error);
    return NextResponse.json(
      { error: 'Failed to find available spots' },
      { status: 500 }
    );
  }
}
