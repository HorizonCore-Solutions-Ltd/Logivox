import { NextRequest, NextResponse } from 'next/server';
import { NCRService } from '@/lib/services/qc/ncr-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const ncrs = await NCRService.listNCRs(organizationId, {
      status,
      supplierId,
      startDate,
      endDate,
    });

    return NextResponse.json(ncrs);
  } catch (error: any) {
    console.error('Error listing NCRs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list NCRs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const ncr = await NCRService.createNCR(body);
    
    return NextResponse.json(ncr, { status: 201 });
  } catch (error: any) {
    console.error('Error creating NCR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create NCR' },
      { status: 500 }
    );
  }
}
