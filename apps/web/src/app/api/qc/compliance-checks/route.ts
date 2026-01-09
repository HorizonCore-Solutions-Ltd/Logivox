import { NextRequest, NextResponse } from "next/server";
import vendorComplianceService from "@/lib/services/qc/vendor-compliance-service";

/**
 * GET /api/qc/compliance-checks
 * List compliance checks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const vendorId = searchParams.get("vendorId");
    const checkType = searchParams.get("checkType");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    const result = await vendorComplianceService.listChecks({
      organizationId,
      vendorId: vendorId || undefined,
      checkType: checkType as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing compliance checks:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/qc/compliance-checks
 * Create compliance check
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const check = await vendorComplianceService.createCheck({
      organizationId: body.organizationId,
      vendorId: body.vendorId,
      checkType: body.checkType,
      checkDate: new Date(body.checkDate),
      inspectorId: body.inspectorId,
      checklistItems: body.checklistItems,
      createdBy: body.createdBy || "system",
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error: any) {
    console.error("Error creating compliance check:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
