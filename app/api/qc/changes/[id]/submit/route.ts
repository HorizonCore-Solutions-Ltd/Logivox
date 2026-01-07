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
    const change = await ChangeControlService.submitForApproval({
      changeId: params.id,
      impactAssessment: body.impactAssessment,
      proposedImplementationPlan: body.proposedImplementationPlan,
      requiredApprovers: body.requiredApprovers,
    });

    return NextResponse.json(change);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
