import { NextRequest, NextResponse } from "next/server";
import { crossBorderService } from "@/lib/services/returns/cross-border-service";

/**
 * POST /api/returns/cross-border/routing
 * Determine optimal routing for international return
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rmaId,
      customerCountry,
      originCountry,
      productValue,
      productWeight,
      urgency,
    } = body;

    if (!rmaId || !customerCountry || !originCountry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const routing = await crossBorderService.determineRouting({
      rmaId,
      customerCountry,
      originCountry,
      productValue: productValue || 100,
      productWeight: productWeight || 5,
      urgency: urgency || "STANDARD",
    });

    return NextResponse.json({
      success: true,
      routing,
    });
  } catch (error: any) {
    console.error("Cross-border routing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to determine routing" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/cross-border/country-profile?countryCode=xxx
 * Get country return profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode");

    if (!countryCode) {
      return NextResponse.json(
        { error: "Missing countryCode parameter" },
        { status: 400 },
      );
    }

    const profile = await crossBorderService.getCountryProfile(countryCode);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("Country profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get country profile" },
      { status: 500 },
    );
  }
}
