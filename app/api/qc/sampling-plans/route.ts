import { NextRequest, NextResponse } from "next/server";
import { SamplingPlanService } from "@/lib/services/qc/sampling-plan-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const targetId = searchParams.get("targetId") || undefined;
    const inspectionType = searchParams.get("inspectionType") || undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const plans = await SamplingPlanService.listPlans(organizationId, {
      status,
      targetType,
      targetId,
      inspectionType,
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Error listing sampling plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list sampling plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const plan = await SamplingPlanService.createPlan(body);

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sampling plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sampling plan" },
      { status: 500 },
    );
  }
}
