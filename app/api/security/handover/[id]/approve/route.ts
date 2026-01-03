import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ApproveHandoverSchema = z.object({
  incomingSignature: z.string(),
});

// POST /api/security/handover/[id]/approve - Approve handover
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
    const body = ApproveHandoverSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const handover = await prisma.shiftHandover.updateMany({
      where: {
        id: params.id,
        organizationId,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
        incomingSignature: body.incomingSignature,
        incomingSignedAt: new Date(),
        completedAt: new Date(),
      },
    });

    if (handover.count === 0) {
      return NextResponse.json({ error: 'Handover not found or already completed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error approving handover:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
