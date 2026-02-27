import { NextResponse } from "next/server";
import FMEAService from "@/lib/services/fmea.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/fmea/high-risk
 * Get high-risk failure modes across all FMEAs
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    const highRiskModes =
      await FMEAService.getHighRiskFailureModes(organizationId);

    return NextResponse.json({
      success: true,
      data: highRiskModes,
      meta: {
        total: highRiskModes.length,
      },
    });
  } catch (error: any) {
    console.error("High-risk failure modes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch high-risk failure modes" },
      { status: 500 },
    );
  }
}
