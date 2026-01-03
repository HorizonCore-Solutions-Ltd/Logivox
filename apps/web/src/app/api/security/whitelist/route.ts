import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createWhitelistSchema = z.object({
  type: z.enum(['CARRIER', 'VEHICLE', 'DRIVER']),
  identifier: z.string().min(1), // License plate, carrier name, or driver ID
  carrierName: z.string().optional(),
  autoApprove: z.boolean().default(true),
  skipWeighBridge: z.boolean().default(false),
  skipInspection: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  type: z.enum(['CARRIER', 'VEHICLE', 'DRIVER']).optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createWhitelistSchema.parse(body);

    // Check if entry already exists
    const existing = await prisma.vehicleWhitelist.findFirst({
      where: {
        organizationId: session.user.organizationId,
        type: data.type,
        identifier: data.identifier,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Entry already exists in whitelist' },
        { status: 400 }
      );
    }

    const whitelistEntry = await prisma.vehicleWhitelist.create({
      data: {
        organizationId: session.user.organizationId,
        type: data.type,
        identifier: data.identifier.toUpperCase(),
        carrierName: data.carrierName,
        autoApprove: data.autoApprove,
        skipWeighBridge: data.skipWeighBridge,
        skipInspection: data.skipInspection,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        approvedBy: session.user.id,
        notes: data.notes,
      },
    });

    return NextResponse.json(whitelistEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating whitelist entry:', error);
    return NextResponse.json(
      { error: 'Failed to create whitelist entry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = listSchema.parse({
      type: searchParams.get('type') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    });

    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true';
    }

    if (params.search) {
      where.OR = [
        { identifier: { contains: params.search, mode: 'insensitive' } },
        { carrierName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.vehicleWhitelist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicleWhitelist.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whitelist' },
      { status: 500 }
    );
  }
}
