import { NextRequest, NextResponse } from 'next/server';
import { ChangeControlService } from '@/lib/services/qc/change-control.service';
import { getServerSession } from 'next-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const approval = await ChangeControlService.recordApproval({
      approvalId: params.id,
      approvedBy: session.user.email || '',
      approved: body.approved,
      comments: body.comments,
      conditions: body.conditions,
    });

    return NextResponse.json(approval);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
