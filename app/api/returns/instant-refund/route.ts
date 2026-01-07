import { NextRequest, NextResponse } from "next/server";
import { instantRefundService } from "@/lib/services/returns/instant-refund-service";

/**
 * POST /api/returns/instant-refund
 * Evaluate eligibility and process instant refund
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rmaId, organizationId } = body;

    if (!rmaId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: rmaId, organizationId" },
        { status: 400 },
      );
    }

    // Evaluate eligibility
    const eligibility = await instantRefundService.evaluateEligibility({
      rmaId,
      organizationId,
    });

    if (!eligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        ...eligibility,
      });
    }

    // Process instant refund
    const instantRefund = await instantRefundService.processInstantRefund({
      rmaId,
      organizationId,
      refundMethod: body.refundMethod || "ORIGINAL_PAYMENT",
    });

    return NextResponse.json({
      success: true,
      instantRefund,
    });
  } catch (error: any) {
    console.error("Instant refund error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process instant refund" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/instant-refund?organizationId=xxx
 * Get all instant refunds for organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    // TODO: Implement database query
    // const instantRefunds = await prisma.instantRefund.findMany({
    //   where: {
    //     organizationId,
    //     ...(status && { verificationStatus: status }),
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    return NextResponse.json({
      instantRefunds: [],
      message: "Database integration pending",
    });
  } catch (error: any) {
    console.error("Get instant refunds error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get instant refunds" },
      { status: 500 },
    );
  }
}
