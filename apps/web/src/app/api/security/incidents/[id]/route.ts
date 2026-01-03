import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateIncidentSchema = z.object({
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  investigatorId: z.string().optional(),
  investigationNotes: z.string().optional(),
  resolutionDetails: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  actionsTaken: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incident = await prisma.securityIncident.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
            clearanceLevel: true,
          },
        },
        investigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
            clearanceLevel: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Security incident not found' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching security incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security incident' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateIncidentSchema.parse(body);

    const incident = await prisma.securityIncident.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        ...validatedData,
        resolvedAt: validatedData.resolvedAt ? new Date(validatedData.resolvedAt) : undefined,
      },
      include: {
        reportedBy: true,
        investigator: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'SECURITY_INCIDENT',
        entityId: incident.id,
        description: `Updated incident ${incident.incidentNumber}`,
        metadata: {
          status: validatedData.status,
        },
      },
    });

    return NextResponse.json(incident);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating security incident:', error);
    return NextResponse.json(
      { error: 'Failed to update security incident' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const incident = await prisma.securityIncident.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'DELETE',
        entity: 'SECURITY_INCIDENT',
        entityId: incident.id,
        description: `Deleted incident ${incident.incidentNumber}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting security incident:', error);
    return NextResponse.json(
      { error: 'Failed to delete security incident' },
      { status: 500 }
    );
  }
}
