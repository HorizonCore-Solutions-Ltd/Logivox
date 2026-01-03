import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkOutSchema = z.object({
  checkOutTime: z.string().datetime(),
  badgeReturned: z.boolean().default(false),
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

    const visitor = await prisma.visitor.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        securityPersonnel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
          },
        },
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Error fetching visitor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor' },
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
    const validatedData = checkOutSchema.parse(body);

    const visitor = await prisma.visitor.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        checkOutTime: new Date(validatedData.checkOutTime),
        badgeReturned: validatedData.badgeReturned,
        status: 'CHECKED_OUT',
        notes: validatedData.notes,
      },
      include: {
        securityPersonnel: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'VISITOR',
        entityId: visitor.id,
        description: `Checked out visitor ${visitor.firstName} ${visitor.lastName}`,
      },
    });

    return NextResponse.json(visitor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error checking out visitor:', error);
    return NextResponse.json(
      { error: 'Failed to check out visitor' },
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

    const visitor = await prisma.visitor.delete({
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
        entity: 'VISITOR',
        entityId: visitor.id,
        description: `Deleted visitor record for ${visitor.firstName} ${visitor.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete visitor' },
      { status: 500 }
    );
  }
}
