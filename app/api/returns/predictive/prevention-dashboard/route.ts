import { NextRequest, NextResponse } from "next/server";
import { enhancedPredictiveService } from "@/lib/services/returns/enhanced-predictive-service";

/**
 * POST /api/returns/predictive/prevention-dashboard
 * Generate return prevention dashboard with actionable insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, periodStart, periodEnd } = body;

    if (!organizationId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const dashboard =
      await enhancedPredictiveService.generatePreventionDashboard({
        organizationId,
        period: {
          start: new Date(periodStart),
          end: new Date(periodEnd),
        },
      });

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    console.error("Prevention dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate dashboard" },
      { status: 500 },
    );
  }
}
