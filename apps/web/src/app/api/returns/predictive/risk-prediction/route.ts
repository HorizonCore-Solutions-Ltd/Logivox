import { NextRequest, NextResponse } from "next/server";
import { enhancedPredictiveService } from "@/lib/services/returns/enhanced-predictive-service";

/**
 * POST /api/returns/predictive/risk-prediction
 * Predict return risk for an order BEFORE shipping
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 },
      );
    }

    const prediction =
      await enhancedPredictiveService.predictReturnRisk(orderId);

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error("Risk prediction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to predict return risk" },
      { status: 500 },
    );
  }
}
