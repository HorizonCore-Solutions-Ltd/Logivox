import { NextResponse } from "next/server";
import SupplierScorecardService from "@/lib/services/supplier-scorecard.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/suppliers/rankings
 * Get supplier rankings
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days ago

    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date(); // Default: now

    const rankings = await SupplierScorecardService.getSupplierRankings(
      organizationId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: rankings,
      meta: {
        total: rankings.length,
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      },
    });
  } catch (error: any) {
    console.error("Supplier rankings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate rankings" },
      { status: 500 },
    );
  }
}
