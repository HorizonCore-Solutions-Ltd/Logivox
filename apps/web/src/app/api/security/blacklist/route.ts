import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createBlacklistSchema = z.object({
  licensePlate: z.string().min(1),
  reason: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'PERMANENT']),
  bannedUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  isActive: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'PERMANENT']).optional(),
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
    const data = createBlacklistSchema.parse(body);

    // Check if vehicle is already blacklisted
    const existing = await prisma.vehicleBlacklist.findFirst({
      where: {
        organizationId: session.user.organizationId,
        licensePlate: data.licensePlate,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Vehicle is already blacklisted' },
        { status: 400 }
      );
    }

    const blacklistEntry = await prisma.vehicleBlacklist.create({
      data: {
        organizationId: session.user.organizationId,
        licensePlate: data.licensePlate.toUpperCase(),
        reason: data.reason,
        severity: data.severity,
        bannedUntil: data.bannedUntil ? new Date(data.bannedUntil) : null,
        bannedBy: session.user.id,
        notes: data.notes,
      },
    });

    return NextResponse.json(blacklistEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating blacklist entry:', error);
    return NextResponse.json(
      { error: 'Failed to create blacklist entry' },
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
      isActive: searchParams.get('isActive') || undefined,
      severity: searchParams.get('severity') || undefined,
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

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true';
    }

    if (params.severity) {
      where.severity = params.severity;
    }

    if (params.search) {
      where.OR = [
        { licensePlate: { contains: params.search, mode: 'insensitive' } },
        { reason: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.vehicleBlacklist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { bannedDate: 'desc' },
      }),
      prisma.vehicleBlacklist.count({ where }),
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
    console.error('Error fetching blacklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklist' },
      { status: 500 }
    );
  }
}
