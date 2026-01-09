import { NextRequest, NextResponse } from "next/server";
import { TrainingService } from "@/lib/services/qc/training.service";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const employeeId = searchParams.get("employeeId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    const matrix = await TrainingService.getEmployeeMatrix({
      organizationId,
      employeeId: employeeId || undefined,
    });

    return NextResponse.json(matrix);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
