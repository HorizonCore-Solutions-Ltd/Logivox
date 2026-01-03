import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SubmitDARSchema = z.object({
  guardSignature: z.string(),
});

// POST /api/security/daily-reports/[id]/submit - Submit report
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
    const body = SubmitDARSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const report = await prisma.dailyActivityReport.updateMany({
      where: {
        id: params.id,
        organizationId,
        status: 'DRAFT',
      },
      data: {
        status: 'SUBMITTED',
        guardSignature: body.guardSignature,
        guardSignedAt: new Date(),
        submittedAt: new Date(),
      },
    });

    if (report.count === 0) {
      return NextResponse.json({ error: 'Report not found or already submitted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting daily report:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
