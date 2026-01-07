import { NextRequest, NextResponse } from 'next/server';
import { CustomerComplaintService } from '@/lib/services/qc/customer-complaint.service';
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
    const complaint = await CustomerComplaintService.conductInvestigation({
      complaintId: params.id,
      investigatorId: session.user.email || '',
      investigationFindings: body.investigationFindings,
      rootCause: body.rootCause,
      contributingFactors: body.contributingFactors,
      evidenceCollected: body.evidenceCollected,
      immediateActions: body.immediateActions,
      requiresCAPA: body.requiresCAPA,
      capaId: body.capaId,
      productReturnRequired: body.productReturnRequired,
      isValidComplaint: body.isValidComplaint,
    });

    return NextResponse.json(complaint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
