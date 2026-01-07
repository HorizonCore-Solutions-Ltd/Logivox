import { NextRequest, NextResponse } from 'next/server';
import { CalibrationService } from '@/lib/services/qc/calibration.service';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const equipment = await CalibrationService.registerEquipment({
      organizationId: body.organizationId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      equipmentType: body.equipmentType,
      manufacturer: body.manufacturer,
      model: body.model,
      serialNumber: body.serialNumber,
      calibrationFrequency: body.calibrationFrequency,
      calibrationMethod: body.calibrationMethod,
      acceptanceCriteria: body.acceptanceCriteria,
      criticalEquipment: body.criticalEquipment,
      location: body.location,
      responsiblePerson: body.responsiblePerson,
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
