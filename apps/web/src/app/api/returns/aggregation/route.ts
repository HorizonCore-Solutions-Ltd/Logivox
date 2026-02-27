import { NextRequest, NextResponse } from "next/server";
import { returnAggregationService } from "@/lib/services/returns/return-aggregation-service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * POST /api/returns/aggregation
 * Create aggregated return shipment from multiple RMAs
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const { customerId, organizationId, rmaIds } = body;

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, organizationId" },
        { status: 400 },
      );
    }

    // Find eligible returns
    const eligibleReturns =
      await returnAggregationService.findAggregatableReturns({
        customerId,
        organizationId,
        rmaIds,
      });

    if (eligibleReturns.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No eligible returns found for aggregation",
      });
    }

    // Create aggregated return
    const aggregation = await returnAggregationService.createAggregatedReturn({
      customerId,
      organizationId,
      rmaIds: eligibleReturns.map((r) => r.rmaId),
    });

    return NextResponse.json({
      success: true,
      aggregation,
    });
  } catch (error: any) {
    console.error("Aggregation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create aggregated return" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/returns/aggregation/eligible?customerId=xxx&organizationId=xxx
 * Find returns eligible for aggregation
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const eligible = await returnAggregationService.findAggregatableReturns({
      customerId,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      eligibleReturns: eligible,
    });
  } catch (error: any) {
    console.error("Find eligible error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to find eligible returns" },
      { status: 500 },
    );
  }
}
