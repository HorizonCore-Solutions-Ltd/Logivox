import { NextRequest, NextResponse } from 'next/server';
import { QualityHoldService } from '@/lib/services/qc/quality-hold-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') || undefined;
    const holdType = searchParams.get('holdType') || undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const holds = await QualityHoldService.listHolds(organizationId, {
      status,
      holdType,
    });

    return NextResponse.json(holds);
  } catch (error: any) {
    console.error('Error listing quality holds:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list quality holds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const hold = await QualityHoldService.createHold(body);
    
    return NextResponse.json(hold, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quality hold:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quality hold' },
      { status: 500 }
    );
  }
}
