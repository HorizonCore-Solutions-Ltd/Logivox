import { NextRequest, NextResponse } from "next/server";
import { QualityMeasurementService } from "@/lib/services/qc/quality-measurement-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const referenceType = searchParams.get("referenceType") || undefined;
    const referenceId = searchParams.get("referenceId") || undefined;
    const measurementType = searchParams.get("measurementType") as any;
    const measurementName = searchParams.get("measurementName") || undefined;
    const isConforming = searchParams.get("isConforming")
      ? searchParams.get("isConforming") === "true"
      : undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const measurements = await QualityMeasurementService.listMeasurements(
      organizationId,
      {
        referenceType,
        referenceId,
        measurementType,
        measurementName,
        isConforming,
        startDate,
        endDate,
        limit,
      },
    );

    return NextResponse.json(measurements);
  } catch (error: any) {
    console.error("Error listing measurements:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list measurements" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();

    const measurement = await QualityMeasurementService.recordMeasurement(body);

    return NextResponse.json(measurement, { status: 201 });
  } catch (error: any) {
    console.error("Error recording measurement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record measurement" },
      { status: 500 },
    );
  }
}
