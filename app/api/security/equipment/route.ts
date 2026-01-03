import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateEquipmentSchema = z.object({
  equipmentType: z.enum(['RADIO', 'TORCH', 'BATON', 'KEYS', 'ACCESS_CARD', 'VEHICLE', 'CAMERA', 'TABLET', 'FIRST_AID_KIT', 'FIRE_EXTINGUISHER', 'OTHER']),
  equipmentNumber: z.string(),
  name: z.string(),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']).optional(),
  location: z.string().optional(),
});

// POST /api/security/equipment - Create equipment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateEquipmentSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Check for duplicate equipment number
    const existing = await prisma.equipment.findFirst({
      where: {
        organizationId,
        equipmentNumber: body.equipmentNumber,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Equipment number already exists' }, { status: 400 });
    }

    const equipment = await prisma.equipment.create({
      data: {
        organizationId,
        equipmentType: body.equipmentType,
        equipmentNumber: body.equipmentNumber,
        name: body.name,
        description: body.description,
        serialNumber: body.serialNumber,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        condition: body.condition || 'GOOD',
        location: body.location,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/security/equipment - List equipment
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
    const type = searchParams.get('type');
    const guardId = searchParams.get('guardId');

    const equipment = await prisma.equipment.findMany({
      where: {
        organizationId,
        ...(status && { status: status as any }),
        ...(type && { equipmentType: type as any }),
        ...(guardId && { currentGuardId: guardId }),
      },
      include: {
        _count: {
          select: {
            checkouts: true,
            maintenanceLogs: true,
          },
        },
      },
      orderBy: { equipmentNumber: 'asc' },
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error('Error listing equipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
