import { NextRequest, NextResponse } from "next/server";
import { CalibrationService } from "@/lib/services/qc/calibration.service";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const daysAhead = searchParams.get("daysAhead");
    const criticalOnly = searchParams.get("criticalOnly");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    const due = await CalibrationService.getDueCalibrations({
      organizationId,
      daysAhead: daysAhead ? parseInt(daysAhead) : undefined,
      criticalOnly: criticalOnly === "true",
    });

    return NextResponse.json(due);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
