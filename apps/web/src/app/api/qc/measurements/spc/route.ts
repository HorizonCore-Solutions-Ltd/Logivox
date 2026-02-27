import { NextRequest, NextResponse } from "next/server";
import { QualityMeasurementService } from "@/lib/services/qc/quality-measurement-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const referenceType = searchParams.get("referenceType");
    const referenceId = searchParams.get("referenceId");
    const measurementName = searchParams.get("measurementName");
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!organizationId || !referenceType || !referenceId || !measurementName) {
      return NextResponse.json(
        {
          error:
            "organizationId, referenceType, referenceId, and measurementName are required",
        },
        { status: 400 },
      );
    }

    const spcData = await QualityMeasurementService.getSPCData({
      organizationId,
      referenceType,
      referenceId,
      measurementName,
      startDate,
      endDate,
      limit,
    });

    if (!spcData) {
      return NextResponse.json(
        { error: "No measurement data available" },
        { status: 404 },
      );
    }

    return NextResponse.json(spcData);
  } catch (error: any) {
    console.error("Error fetching SPC data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch SPC data" },
      { status: 500 },
    );
  }
}
