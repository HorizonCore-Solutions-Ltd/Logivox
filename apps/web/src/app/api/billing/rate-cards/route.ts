export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rateCardSchema = z.object({
  name: z.string().min(1, 'Rate card name is required'),
  customerId: z.string().optional(),
  effectiveFrom: z.string().transform(str => new Date(str)),
  effectiveTo: z.string().transform(str => new Date(str)).optional(),
  storageRate: z.number().positive().optional(),
  receivingRate: z.number().positive().optional(),
  pickingRate: z.number().positive().optional(),
  packingRate: z.number().positive().optional(),
  shippingRate: z.number().positive().optional(),
  handlingRate: z.number().positive().optional(),
  customRates: z.record(z.number()).optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/billing/rate-cards
 * List all rate cards
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const isActive = searchParams.get('isActive');

    const rateCards = await prisma.rateCard.findMany({
      where: {
        organizationId,
        ...(customerId && { customerId }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rateCards);
  } catch (error: any) {
    console.error('Error fetching rate cards:', error);
    return NextResponse.json({ error: 'Failed to fetch rate cards' }, { status: 500 });
  }
}

/**
 * POST /api/billing/rate-cards
 * Create a new rate card
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = rateCardSchema.parse(body);

    const rateCard = await prisma.rateCard.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'RATE_CARD_CREATED',
        entityType: 'RateCard',
        entityId: rateCard.id,
        metadata: {
          name: rateCard.name,
          customerId: rateCard.customerId,
        },
      },
    });

    return NextResponse.json(rateCard, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating rate card:', error);
    return NextResponse.json({ error: 'Failed to create rate card' }, { status: 500 });
  }
}
