import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCarrierSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['PARCEL', 'LTL', 'FTL', 'COURIER', 'POSTAL', 'OTHER']).optional(),
  apiProvider: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL', 'CUSTOM', 'NONE']).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accountNumber: z.string().optional(),
  meterNumber: z.string().optional(),
  serviceLevel: z.string().optional(),
  transitDays: z.number().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  supportedServices: z.array(z.string()).optional(),
  weightLimit: z.number().optional(),
  costPerKg: z.number().optional(),
  costPerMile: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/carriers/[id]
 * Get carrier by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const carrier = await prisma.carrier.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        shipments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            shipments: true,
          },
        },
      },
    });

    if (!carrier) {
      return NextResponse.json(
        { error: 'Carrier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(carrier);
  } catch (error: any) {
    console.error('Error fetching carrier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carrier' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/carriers/[id]
 * Update carrier
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateCarrierSchema.parse(body);

    // Check if carrier exists and belongs to user's organization
    const existingCarrier = await prisma.carrier.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingCarrier) {
      return NextResponse.json(
        { error: 'Carrier not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.carrier.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      });
    }

    // Update carrier
    const carrier = await prisma.carrier.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CARRIER_UPDATED',
        entityType: 'Carrier',
        entityId: carrier.id,
        details: {
          carrierName: carrier.name,
          changes: validatedData,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(carrier);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating carrier:', error);
    return NextResponse.json(
      { error: 'Failed to update carrier' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/carriers/[id]
 * Delete carrier (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if carrier exists and belongs to user's organization
    const carrier = await prisma.carrier.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: {
            shipments: true,
          },
        },
      },
    });

    if (!carrier) {
      return NextResponse.json(
        { error: 'Carrier not found' },
        { status: 404 }
      );
    }

    // Check if carrier has shipments
    if (carrier._count.shipments > 0) {
      // Soft delete only
      await prisma.carrier.update({
        where: { id: params.id },
        data: {
          isActive: false,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
    } else {
      // Hard delete if no shipments
      await prisma.carrier.delete({
        where: { id: params.id },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CARRIER_DELETED',
        entityType: 'Carrier',
        entityId: carrier.id,
        details: {
          carrierName: carrier.name,
          carrierCode: carrier.code,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting carrier:', error);
    return NextResponse.json(
      { error: 'Failed to delete carrier' },
      { status: 500 }
    );
  }
}
