import { NextRequest, NextResponse } from "next/server";
import { TrainingService } from "@/lib/services/qc/training.service";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const record = await TrainingService.recordCompletion({
      organizationId: body.organizationId,
      requirementId: body.requirementId,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      trainingDate: new Date(body.trainingDate),
      completionDate: new Date(body.completionDate),
      trainerId: body.trainerId,
      trainerName: body.trainerName,
      location: body.location,
      assessmentScore: body.assessmentScore,
      certificationNumber: body.certificationNumber,
      certificationExpiry: body.certificationExpiry
        ? new Date(body.certificationExpiry)
        : undefined,
      attendanceVerified: body.attendanceVerified,
      effectiveness: body.effectiveness,
      notes: body.notes,
      recordedBy: session.user.email || "",
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
