import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateHandoverSchema = z.object({
  warehouseId: z.string().optional(),
  outgoingGuardId: z.string(),
  outgoingGuardName: z.string(),
  outgoingShift: z.string(),
  incomingGuardId: z.string(),
  incomingGuardName: z.string(),
  incomingShift: z.string(),
  keyEvents: z.any().optional(),
  ongoingIssues: z.string().optional(),
  equipmentStatus: z.any().optional(),
  notesForNextShift: z.string().optional(),
});

// POST /api/security/handover - Create shift handover
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateHandoverSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Generate handover number
    const now = new Date();
    const year = now.getFullYear();
    const count = await prisma.shiftHandover.count({
      where: {
        organizationId,
        handoverDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const handoverNumber = `HO-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate activity counts (last 8 hours as typical shift)
    const shiftStart = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const shiftEnd = now;

    const [gateEntriesCount, gateExitsCount, visitorsCount, incidentsCount, patrolsCount] = await Promise.all([
      prisma.gateEntry.count({
        where: {
          organizationId,
          direction: 'INBOUND',
          entryTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.gateEntry.count({
        where: {
          organizationId,
          direction: 'OUTBOUND',
          exitTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.visitor.count({
        where: {
          organizationId,
          checkInTime: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.securityIncident.count({
        where: {
          organizationId,
          reportedAt: { gte: shiftStart, lte: shiftEnd },
        },
      }),
      prisma.patrolExecution.count({
        where: {
          organizationId,
          guardId: body.outgoingGuardId,
          startTime: { gte: shiftStart, lte: shiftEnd },
          status: 'COMPLETED',
        },
      }),
    ]);

    // Current vehicles on site
    const currentVehiclesOnSite = await prisma.gateEntry.count({
      where: {
        organizationId,
        status: { in: ['CHECKED_IN', 'PROCESSING', 'APPROVED'] },
        exitTime: null,
      },
    });

    const handover = await prisma.shiftHandover.create({
      data: {
        organizationId,
        handoverNumber,
        warehouseId: body.warehouseId,
        outgoingGuardId: body.outgoingGuardId,
        outgoingGuardName: body.outgoingGuardName,
        outgoingShift: body.outgoingShift,
        incomingGuardId: body.incomingGuardId,
        incomingGuardName: body.incomingGuardName,
        incomingShift: body.incomingShift,
        gateEntriesCount,
        gateExitsCount,
        currentVehiclesOnSite,
        visitorsCount,
        incidentsCount,
        patrolsCompleted: patrolsCount,
        keyEvents: body.keyEvents,
        ongoingIssues: body.ongoingIssues,
        equipmentStatus: body.equipmentStatus,
        notesForNextShift: body.notesForNextShift,
        status: 'PENDING',
      },
    });

    return NextResponse.json(handover);
  } catch (error: any) {
    console.error('Error creating handover:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/security/handover - List handovers
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
    const guardId = searchParams.get('guardId');

    const handovers = await prisma.shiftHandover.findMany({
      where: {
        organizationId,
        ...(status && { status: status as any }),
        ...(guardId && {
          OR: [
            { outgoingGuardId: guardId },
            { incomingGuardId: guardId },
          ],
        }),
      },
      orderBy: { handoverDate: 'desc' },
      take: 50,
    });

    return NextResponse.json(handovers);
  } catch (error: any) {
    console.error('Error listing handovers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
