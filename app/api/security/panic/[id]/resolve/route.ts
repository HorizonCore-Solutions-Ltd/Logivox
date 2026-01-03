import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ResolveSchema = z.object({
  resolvedBy: z.string(),
  resolution: z.string(),
  isFalseAlarm: z.boolean().optional(),
});

// PATCH /api/security/panic/[id]/resolve - Resolve panic alert
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = ResolveSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const alert = await prisma.panicAlert.updateMany({
      where: {
        id: params.id,
        organizationId,
      },
      data: {
        status: body.isFalseAlarm ? 'FALSE_ALARM' : 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: body.resolvedBy,
        resolution: body.resolution,
        isFalseAlarm: body.isFalseAlarm || false,
      },
    });

    if (alert.count === 0) {
      return NextResponse.json({ error: 'Panic alert not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resolving panic alert:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
