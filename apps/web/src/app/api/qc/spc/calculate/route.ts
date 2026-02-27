import { NextResponse } from "next/server";
import SPCService from "@/lib/services/spc.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/spc/calculate
 * Calculate SPC control limits and detect out-of-control conditions
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    const measurementType = searchParams.get("measurementType");
    const productId = searchParams.get("productId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    if (!measurementType) {
      return NextResponse.json(
        { error: "measurementType is required" },
        { status: 400 },
      );
    }

    // Get SPC calculations
    const spcData = await SPCService.getSPCData(
      measurementType,
      productId,
      startDate,
      endDate,
    );

    // Check if NCR should be created
    if (!spcData.inControl) {
      const ncrId = await SPCService.checkAndCreateNCR(
        spcData,
        measurementType,
      );
      if (ncrId) {
        (spcData as any).ncrCreated = ncrId;
      }
    }

    return NextResponse.json({
      success: true,
      data: spcData,
    });
  } catch (error: any) {
    console.error("SPC calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate SPC" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/qc/spc/calculate
 * Calculate SPC for custom dataset
 */
export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { values, lsl, usl } = body;

    if (!values || !Array.isArray(values) || values.length < 2) {
      return NextResponse.json(
        { error: "values array with at least 2 points required" },
        { status: 400 },
      );
    }

    // Calculate control limits
    const controlLimits = SPCService.calculateControlLimits(values);

    // Calculate CPK and PPK if spec limits provided
    let cpk = 0;
    let ppk = 0;
    if (lsl && usl) {
      cpk = SPCService.calculateCPK(values, lsl, usl);
      ppk = SPCService.calculatePPK(values, lsl, usl);
    }

    // Transform values to data points
    const dataPoints = values.map((value, idx) => ({
      id: `point-${idx}`,
      value,
      timestamp: new Date(),
      sampleNumber: idx + 1,
    }));

    // Apply Western Electric Rules
    const westernElectricViolations = SPCService.applyWesternElectricRules(
      dataPoints,
      controlLimits,
    );

    // Find out-of-control points
    const outOfControlPoints = dataPoints
      .filter((p) => p.value > controlLimits.ucl || p.value < controlLimits.lcl)
      .map((p) => p.id);

    const inControl =
      outOfControlPoints.length === 0 &&
      westernElectricViolations.filter((v) => v.severity === "CRITICAL")
        .length === 0;

    return NextResponse.json({
      success: true,
      data: {
        dataPoints,
        controlLimits,
        cpk,
        ppk,
        outOfControlPoints,
        westernElectricViolations,
        inControl,
      },
    });
  } catch (error: any) {
    console.error("SPC calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate SPC" },
      { status: 500 },
    );
  }
}
