import { NextRequest, NextResponse } from "next/server";
import supplierPerformanceReviewService from "@/lib/services/qc/supplier-performance-review-service";

/**
 * GET /api/qc/performance-reviews
 * List performance reviews
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    const result = await supplierPerformanceReviewService.listReviews({
      organizationId,
      vendorId: vendorId || undefined,
      status: status || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing performance reviews:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/qc/performance-reviews
 * Create performance review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const review = await supplierPerformanceReviewService.createReview({
      organizationId: body.organizationId,
      vendorId: body.vendorId,
      reviewPeriod: body.reviewPeriod,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      reviewType: body.reviewType,
      createdBy: body.createdBy || "system",
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Error creating performance review:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
