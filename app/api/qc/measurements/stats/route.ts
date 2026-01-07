import { NextRequest, NextResponse } from "next/server";
import { QualityMeasurementService } from "@/lib/services/qc/quality-measurement-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const referenceType = searchParams.get("referenceType") || undefined;
    const referenceId = searchParams.get("referenceId") || undefined;
    const measurementType = searchParams.get("measurementType") as any;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const stats = await QualityMeasurementService.getMeasurementStats(
      organizationId,
      {
        referenceType,
        referenceId,
        measurementType,
        startDate,
        endDate,
      },
    );

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching measurement stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch measurement stats" },
      { status: 500 },
    );
  }
}
