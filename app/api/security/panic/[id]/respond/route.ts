import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const RespondSchema = z.object({
  responderId: z.string(),
  responderName: z.string(),
  responseType: z.enum(['ACKNOWLEDGED', 'EN_ROUTE', 'ARRIVED', 'RESOLVED']),
  notes: z.string().optional(),
});

// POST /api/security/panic/[id]/respond - Respond to panic alert
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
    const body = RespondSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Get panic alert
    const alert = await prisma.panicAlert.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Panic alert not found' }, { status: 404 });
    }

    // Create response
    const response = await prisma.panicResponse.create({
      data: {
        panicAlertId: params.id,
        responderId: body.responderId,
        responderName: body.responderName,
        responseType: body.responseType,
        responseTime: new Date(),
        notes: body.notes,
      },
    });

    // Update alert status based on response type
    let newStatus = alert.status;
    if (body.responseType === 'ACKNOWLEDGED' && alert.status === 'ACTIVE') {
      newStatus = 'RESPONDING';
    } else if (body.responseType === 'RESOLVED') {
      newStatus = 'RESOLVED';
    }

    // Calculate response time for first responder
    const firstResponse = await prisma.panicResponse.findFirst({
      where: {
        panicAlertId: params.id,
        responseType: 'ARRIVED',
      },
      orderBy: { responseTime: 'asc' },
    });

    const responseTimeSeconds = firstResponse
      ? Math.round((firstResponse.responseTime.getTime() - alert.triggeredAt.getTime()) / 1000)
      : null;

    await prisma.panicAlert.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(responseTimeSeconds && { responseTime: responseTimeSeconds }),
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error responding to panic alert:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
