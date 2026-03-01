import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import SupplierScorecardService from "@/lib/services/supplier-scorecard.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/suppliers/scorecards
 * Returns ranked scorecards for all active suppliers in the organization.
 *
 * Query params:
 *   - startDate  ISO string (default: 90 days ago)
 *   - endDate    ISO string (default: now)
 *   - supplierId single supplier scorecard + trend
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    if (supplierId) {
      // Single supplier: full scorecard + 6-month trend
      const [scorecard, trend] = await Promise.all([
        SupplierScorecardService.calculateScorecard(
          supplierId,
          startDate,
          endDate,
        ),
        SupplierScorecardService.getScorecardTrend(supplierId, 6),
      ]);
      return NextResponse.json({ success: true, data: { scorecard, trend } });
    }

    // All suppliers: ranked list
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
        period: `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`,
      },
    });
  } catch (error: unknown) {
    console.error("[SupplierScorecards GET]", error);
    const msg =
      error instanceof Error ? error.message : "Failed to fetch scorecards";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
