import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CompletePatrolSchema = z.object({
  notes: z.string().optional(),
});

// POST /api/security/patrols/[id]/complete - Complete patrol
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const body = CompletePatrolSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Get patrol execution
    const execution = await prisma.patrolExecution.findFirst({
      where: {
        id: params.id,
        organizationId,
        status: 'IN_PROGRESS',
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Patrol execution not found or not active' }, { status: 404 });
    }

    // Calculate final stats
    const scannedCount = await prisma.checkpointScan.count({
      where: { executionId: params.id },
    });

    const completionRate = (scannedCount / execution.totalCheckpoints) * 100;
    const missedCount = execution.totalCheckpoints - scannedCount;

    // Determine status
    let status: 'COMPLETED' | 'MISSED' = 'COMPLETED';
    if (scannedCount === 0) {
      status = 'MISSED';
    }

    // Update execution
    const updatedExecution = await prisma.patrolExecution.update({
      where: { id: params.id },
      data: {
        endTime: new Date(),
        status,
        scannedCheckpoints: scannedCount,
        missedCheckpoints: missedCount,
        completionRate,
        notes: body.notes,
      },
      include: {
        route: true,
        scans: {
          include: {
            checkpoint: true,
          },
          orderBy: { scanTime: 'asc' },
        },
      },
    });

    // Calculate duration
    const duration = updatedExecution.endTime && updatedExecution.startTime
      ? Math.round((updatedExecution.endTime.getTime() - updatedExecution.startTime.getTime()) / 60000)
      : null;

    return NextResponse.json({
      ...updatedExecution,
      duration, // minutes
    });
  } catch (error: any) {
    console.error('Error completing patrol:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
