import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  gateId: z.string().optional(),
  gateEntryId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueEntry = await prisma.gateQueue.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!queueEntry) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: any = {
      status: data.status,
    };

    if (data.gateId) {
      updateData.gateId = data.gateId;
    }

    if (data.gateEntryId) {
      updateData.gateEntryId = data.gateEntryId;
    }

    if (data.status === 'CALLED') {
      updateData.calledAt = new Date();
    }

    if (data.status === 'IN_PROGRESS') {
      updateData.serviceStartedAt = new Date();
    }

    if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
      updateData.completedAt = new Date();
      
      // Calculate actual wait time
      const waitMinutes = Math.floor(
        (new Date().getTime() - queueEntry.arrivalTime.getTime()) / 60000
      );
      updateData.actualWaitMinutes = waitMinutes;
    }

    const updated = await prisma.gateQueue.update({
      where: { id: params.id },
      data: updateData,
    });

    // If gate is assigned, update gate's current queue count
    if (data.gateId) {
      const activeQueueCount = await prisma.gateQueue.count({
        where: {
          gateId: data.gateId,
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
        },
      });

      await prisma.gate.update({
        where: { id: data.gateId },
        data: { currentQueueCount: activeQueueCount },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating queue entry:', error);
    return NextResponse.json(
      { error: 'Failed to update queue entry' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueEntry = await prisma.gateQueue.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        gateEntry: true,
        gate: true,
      },
    });

    if (!queueEntry) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    return NextResponse.json(queueEntry);
  } catch (error) {
    console.error('Error fetching queue entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue entry' },
      { status: 500 }
    );
  }
}
