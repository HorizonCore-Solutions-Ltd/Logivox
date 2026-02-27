import { NextRequest, NextResponse } from "next/server";
import { NCRService } from "@/lib/services/qc/ncr-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const stats = await NCRService.getNCRStats(organizationId, {
      startDate,
      endDate,
    });

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching NCR stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch NCR stats" },
      { status: 500 },
    );
  }
}
