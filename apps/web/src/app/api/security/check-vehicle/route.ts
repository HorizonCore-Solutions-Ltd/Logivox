import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const checkVehicleSchema = z.object({
  licensePlate: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { licensePlate } = checkVehicleSchema.parse(body);
    const plate = licensePlate.toUpperCase();

    // Check blacklist first
    const blacklisted = await prisma.vehicleBlacklist.findFirst({
      where: {
        organizationId: session.user.organizationId,
        licensePlate: plate,
        isActive: true,
        OR: [
          { bannedUntil: null }, // Indefinite ban
          { bannedUntil: { gte: new Date() } }, // Ban still in effect
        ],
      },
    });

    if (blacklisted) {
      return NextResponse.json({
        status: 'BLOCKED',
        reason: 'BLACKLISTED',
        severity: blacklisted.severity,
        message: blacklisted.reason,
        autoApprove: false,
        skipWeighBridge: false,
        skipInspection: false,
      });
    }

    // Check whitelist
    const whitelisted = await prisma.vehicleWhitelist.findFirst({
      where: {
        organizationId: session.user.organizationId,
        type: 'VEHICLE',
        identifier: plate,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null }, // No expiry
          { validUntil: { gte: new Date() } }, // Still valid
        ],
      },
    });

    if (whitelisted) {
      return NextResponse.json({
        status: 'APPROVED',
        reason: 'WHITELISTED',
        autoApprove: whitelisted.autoApprove,
        skipWeighBridge: whitelisted.skipWeighBridge,
        skipInspection: whitelisted.skipInspection,
        carrierName: whitelisted.carrierName,
      });
    }

    // Not in any list - requires manual approval
    return NextResponse.json({
      status: 'PENDING',
      reason: 'NOT_LISTED',
      autoApprove: false,
      skipWeighBridge: false,
      skipInspection: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error checking vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to check vehicle' },
      { status: 500 }
    );
  }
}
