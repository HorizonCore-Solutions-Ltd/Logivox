import { NextRequest, NextResponse } from "next/server";
import { SamplingPlanService } from "@/lib/services/qc/sampling-plan-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();
    const {
      lotSize,
      inspectionLevel,
      usePercentage,
      samplePercentage,
      minimumSampleSize,
      maximumSampleSize,
    } = body;

    if (!lotSize || !inspectionLevel) {
      return NextResponse.json(
        { error: "lotSize and inspectionLevel are required" },
        { status: 400 },
      );
    }

    const sampleSize = SamplingPlanService.calculateSampleSizeForLot({
      lotSize,
      inspectionLevel,
      usePercentage,
      samplePercentage,
      minimumSampleSize,
      maximumSampleSize,
    });

    const sampleSizeCode = SamplingPlanService.determineSampleSizeCode(
      lotSize,
      inspectionLevel,
    );

    return NextResponse.json({
      sampleSize,
      sampleSizeCode,
      lotSize,
      inspectionLevel,
    });
  } catch (error: any) {
    console.error("Error calculating sample size:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate sample size" },
      { status: 500 },
    );
  }
}
