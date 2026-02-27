import { NextResponse } from "next/server";
import SupplierScorecardService from "@/lib/services/supplier-scorecard.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/suppliers/scorecard
 * Get supplier scorecard
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
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days ago

    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date(); // Default: now

    if (!supplierId) {
      return NextResponse.json(
        { error: "supplierId is required" },
        { status: 400 },
      );
    }

    const scorecard = await SupplierScorecardService.calculateScorecard(
      supplierId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: scorecard,
    });
  } catch (error: any) {
    console.error("Scorecard calculation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate scorecard" },
      { status: 500 },
    );
  }
}
