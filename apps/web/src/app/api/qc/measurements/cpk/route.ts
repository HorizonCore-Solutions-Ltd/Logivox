import { NextRequest, NextResponse } from "next/server";
import { QualityMeasurementService } from "@/lib/services/qc/quality-measurement-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      referenceType,
      referenceId,
      measurementName,
      startDate,
      endDate,
    } = body;

    if (!organizationId || !referenceType || !referenceId || !measurementName) {
      return NextResponse.json(
        {
          error:
            "organizationId, referenceType, referenceId, and measurementName are required",
        },
        { status: 400 },
      );
    }

    const cpk = await QualityMeasurementService.calculateCPK({
      organizationId,
      referenceType,
      referenceId,
      measurementName,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    if (!cpk) {
      return NextResponse.json(
        { error: "Insufficient data to calculate CPK" },
        { status: 404 },
      );
    }

    return NextResponse.json(cpk);
  } catch (error: any) {
    console.error("Error calculating CPK:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate CPK" },
      { status: 500 },
    );
  }
}
