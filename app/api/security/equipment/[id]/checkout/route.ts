import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CheckoutSchema = z.object({
  guardId: z.string(),
  guardName: z.string(),
  expectedReturn: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/security/equipment/[id]/checkout - Checkout equipment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = CheckoutSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Get equipment
    const equipment = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    if (equipment.status !== 'AVAILABLE') {
      return NextResponse.json({ error: `Equipment is ${equipment.status}` }, { status: 400 });
    }

    // Create checkout record
    const checkout = await prisma.equipmentCheckout.create({
      data: {
        organizationId,
        equipmentId: params.id,
        guardId: body.guardId,
        guardName: body.guardName,
        expectedReturn: body.expectedReturn ? new Date(body.expectedReturn) : null,
        notes: body.notes,
      },
    });

    // Update equipment status
    await prisma.equipment.update({
      where: { id: params.id },
      data: {
        status: 'IN_USE',
        currentGuardId: body.guardId,
      },
    });

    return NextResponse.json(checkout);
  } catch (error: any) {
    console.error('Error checking out equipment:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
