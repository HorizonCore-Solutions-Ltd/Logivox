import { NextResponse } from 'next/server';
import QCInspectionService from '@/lib/services/qc/inspection-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const warehouseId = searchParams.get('warehouseId');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const result = searchParams.get('result');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const inspections = await QCInspectionService.listInspections(organizationId, {
      warehouseId: warehouseId || undefined,
      supplierId: supplierId || undefined,
      status: status || undefined,
      result: result || undefined,
    });

    return NextResponse.json({ inspections });
  } catch (error: any) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const inspection = await QCInspectionService.createInspection({
      organizationId: body.organizationId,
      warehouseId: body.warehouseId,
      poId: body.poId,
      supplierId: body.supplierId,
      inspectorId: body.inspectorId,
      grnId: body.grnId,
      inspectionType: body.inspectionType,
      totalUnits: body.totalUnits,
      priority: body.priority,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inspection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
