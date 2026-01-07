/**
 * Quality Trend Analysis API
 * GET /api/qc/metrics/trends
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QualityMetricsService } from "@/lib/services/qc/quality-metrics.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const periodDays = searchParams.get("periodDays");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const trends = await QualityMetricsService.getTrendAnalysis({
      organizationId,
      metric: "NCR",
      periods: periodDays ? parseInt(periodDays) / 30 : 3,
      periodType: "MONTH",
    });

    return NextResponse.json(trends, { status: 200 });
  } catch (error: any) {
    console.error("Trend analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
