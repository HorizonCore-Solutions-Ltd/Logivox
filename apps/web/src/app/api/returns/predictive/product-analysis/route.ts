import { NextRequest, NextResponse } from "next/server";
import { enhancedPredictiveService } from "@/lib/services/returns/enhanced-predictive-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/returns/predictive/product-analysis?sku=xxx&organizationId=xxx
 * Deep dive analysis of product return patterns
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");

    if (!sku || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const analysis = await enhancedPredictiveService.analyzeProduct(
      sku,
      organizationId,
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Product analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze product" },
      { status: 500 },
    );
  }
}
