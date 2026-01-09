import { NextRequest, NextResponse } from "next/server";
import { CalibrationService } from "@/lib/services/qc/calibration.service";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const record = await CalibrationService.recordCalibration({
      equipmentId: body.equipmentId,
      calibrationDate: new Date(body.calibrationDate),
      calibratedBy: session.user.email || "",
      calibrationLab: body.calibrationLab,
      certificateNumber: body.certificateNumber,
      standardsUsed: body.standardsUsed,
      measurementResults: body.measurementResults,
      asFoundCondition: body.asFoundCondition,
      asLeftCondition: body.asLeftCondition,
      uncertaintyValue: body.uncertaintyValue,
      uncertaintyUnit: body.uncertaintyUnit,
      environmentalConditions: body.environmentalConditions,
      calibrationCost: body.calibrationCost,
      nextCalibrationDate: new Date(body.nextCalibrationDate),
      notes: body.notes,
      attachments: body.attachments,
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
