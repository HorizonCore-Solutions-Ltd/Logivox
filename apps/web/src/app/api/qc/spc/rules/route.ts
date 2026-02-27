import { NextResponse } from "next/server";
import SPCService from "@/lib/services/spc.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/qc/spc/rules
 * Apply Western Electric Rules to detect process anomalies
 */
export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { dataPoints, controlLimits } = body;

    if (!dataPoints || !Array.isArray(dataPoints)) {
      return NextResponse.json(
        { error: "dataPoints array is required" },
        { status: 400 },
      );
    }

    if (!controlLimits) {
      return NextResponse.json(
        { error: "controlLimits object is required" },
        { status: 400 },
      );
    }

    // Apply Western Electric Rules
    const violations = SPCService.applyWesternElectricRules(
      dataPoints,
      controlLimits,
    );

    // Group violations by severity
    const critical = violations.filter((v) => v.severity === "CRITICAL");
    const warnings = violations.filter((v) => v.severity === "WARNING");

    return NextResponse.json({
      success: true,
      data: {
        violations,
        summary: {
          total: violations.length,
          critical: critical.length,
          warnings: warnings.length,
        },
        inControl: critical.length === 0,
      },
    });
  } catch (error: any) {
    console.error("Western Electric Rules error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply Western Electric Rules" },
      { status: 500 },
    );
  }
}
