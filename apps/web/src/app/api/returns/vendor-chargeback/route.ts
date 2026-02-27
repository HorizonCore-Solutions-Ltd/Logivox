import { NextRequest, NextResponse } from "next/server";
import { vendorChargebackService } from "@/lib/services/returns/vendor-chargeback-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/returns/vendor-chargeback
 * Create vendor chargeback for defective products
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { organizationId, supplierId, sku, periodStart, periodEnd } = body;

    if (!organizationId || !supplierId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Auto-calculate chargeback
    const chargeback = await vendorChargebackService.autoCalculateChargeback({
      organizationId,
      supplierId,
      sku,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      defectRateThreshold: body.defectRateThreshold || 5,
    });

    if (!chargeback) {
      return NextResponse.json({
        success: false,
        message: "Defect rate below threshold - no chargeback required",
      });
    }

    return NextResponse.json({
      success: true,
      chargeback,
    });
  } catch (error: any) {
    console.error("Chargeback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create chargeback" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/vendor-chargeback?organizationId=xxx
 * Get all chargebacks for organization
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const chargebacks = await vendorChargebackService.list(
      organizationId,
      status ?? undefined,
    );

    return NextResponse.json({ chargebacks });
  } catch (error: any) {
    console.error("Get chargebacks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get chargebacks" },
      { status: 500 },
    );
  }
}
