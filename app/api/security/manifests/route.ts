import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateManifestSchema = z.object({
  gateEntryId: z.string(),
  manifestNumber: z.string().optional(),
  manifestPhoto: z.string().optional(),
  ocrText: z.string().optional(),
  supplier: z.string().optional(),
  poNumbers: z.array(z.string()).optional(),
  expectedUnits: z.number().int().optional(),
  actualUnits: z.number().int().optional(),
});

// POST /api/security/manifests - Create manifest
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateManifestSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Check if gate entry exists
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: body.gateEntryId,
        organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    // Check for discrepancy
    const hasDiscrepancy = body.expectedUnits && body.actualUnits
      ? body.expectedUnits !== body.actualUnits
      : false;

    const manifest = await prisma.truckManifest.create({
      data: {
        organizationId,
        gateEntryId: body.gateEntryId,
        manifestNumber: body.manifestNumber,
        manifestPhoto: body.manifestPhoto,
        ocrText: body.ocrText,
        supplier: body.supplier,
        poNumbers: body.poNumbers || [],
        expectedUnits: body.expectedUnits,
        actualUnits: body.actualUnits,
        hasDiscrepancy,
        verificationStatus: 'PENDING',
      },
    });

    return NextResponse.json(manifest);
  } catch (error: any) {
    console.error('Error creating manifest:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/security/manifests - List manifests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const hasDiscrepancy = searchParams.get('hasDiscrepancy');

    const manifests = await prisma.truckManifest.findMany({
      where: {
        organizationId,
        ...(status && { verificationStatus: status as any }),
        ...(hasDiscrepancy !== null && { hasDiscrepancy: hasDiscrepancy === 'true' }),
      },
      include: {
        gateEntry: {
          select: {
            entryNumber: true,
            vehicleNumber: true,
            licensePlate: true,
            carrierName: true,
            entryTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(manifests);
  } catch (error: any) {
    console.error('Error listing manifests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
