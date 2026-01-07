import { NextRequest, NextResponse } from 'next/server';
import { MRBService } from '@/lib/services/qc/mrb.service';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const mrb = await MRBService.submitForReview({
      organizationId: body.organizationId,
      ncrId: body.ncrId,
      productId: body.productId,
      productName: body.productName,
      lotNumber: body.lotNumber,
      quantity: body.quantity,
      unitOfMeasure: body.unitOfMeasure,
      location: body.location,
      nonconformanceDescription: body.nonconformanceDescription,
      severity: body.severity,
      affectedCharacteristics: body.affectedCharacteristics,
      measurementData: body.measurementData,
      photos: body.photos,
      submittedBy: session.user.email || '',
      urgency: body.urgency,
      customerImpact: body.customerImpact,
      estimatedValue: body.estimatedValue,
    });

    return NextResponse.json(mrb);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const stats = await MRBService.getStatistics({
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
