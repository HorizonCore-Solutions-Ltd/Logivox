import { NextRequest, NextResponse } from "next/server";
import { qrReturnService } from "@/lib/services/returns/qr-return-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/returns/qr-code/drop-off-locations?zip=xxxxx&carrier=UPS&radius=25
 * Find nearby drop-off locations for QR returns
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip");
    const carrier = searchParams.get("carrier");
    const radius = parseInt(searchParams.get("radius") || "25");

    if (!zip) {
      return NextResponse.json(
        { error: "Missing required parameter: zip" },
        { status: 400 },
      );
    }

    const locations = await qrReturnService.findNearbyDropOffLocations({
      zip,
      carrier,
      radiusMiles: radius,
    });

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error: any) {
    console.error("Find locations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to find drop-off locations" },
      { status: 500 },
    );
  }
}
