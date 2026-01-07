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
    const complaint = await CustomerComplaintService.provideResolution({
      complaintId: params.id,
      resolutionDescription: body.resolutionDescription,
      resolutionType: body.resolutionType,
      compensationAmount: body.compensationAmount,
      resolutionDate: new Date(body.resolutionDate),
      resolvedBy: session.user.email || '',
      customerNotified: body.customerNotified,
      preventiveActions: body.preventiveActions,
    });

    return NextResponse.json(complaint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
