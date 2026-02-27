import { NextRequest, NextResponse } from "next/server";
import { CAPAService } from "@/lib/services/qc/capa-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const overdueCAPAs = await CAPAService.getOverdueCAPAs(organizationId);

    return NextResponse.json(overdueCAPAs);
  } catch (error: any) {
    console.error("Error fetching overdue CAPAs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch overdue CAPAs" },
      { status: 500 },
    );
  }
}
