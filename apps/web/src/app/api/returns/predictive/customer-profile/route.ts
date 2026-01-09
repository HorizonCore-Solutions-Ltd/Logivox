import { NextRequest, NextResponse } from "next/server";
import { enhancedPredictiveService } from "@/lib/services/returns/enhanced-predictive-service";

/**
 * GET /api/returns/predictive/customer-profile?customerId=xxx&organizationId=xxx
 * Profile customer return behavior
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const organizationId = searchParams.get("organizationId");

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const profile = await enhancedPredictiveService.profileCustomer(
      customerId,
      organizationId,
    );

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("Customer profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to profile customer" },
      { status: 500 },
    );
  }
}
