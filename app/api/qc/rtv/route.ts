import { NextResponse } from 'next/server';
import RTVService from '@/lib/services/qc/rtv-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const rtvs = await RTVService.listRTVs(organizationId, {
      supplierId: supplierId || undefined,
      status: status || undefined,
    });

    return NextResponse.json({ rtvs });
  } catch (error: any) {
    console.error('Error fetching RTVs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const rtv = await RTVService.createRTV({
      organizationId: body.organizationId,
      defectId: body.defectId,
      poId: body.poId,
      supplierId: body.supplierId,
      warehouseId: body.warehouseId,
      reason: body.reason,
      quantity: body.quantity,
      value: body.value,
      priority: body.priority,
      createdBy: body.userId,
    });

    return NextResponse.json({ rtv }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating RTV:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
