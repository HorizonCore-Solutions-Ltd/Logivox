import { NextRequest, NextResponse } from "next/server";
import { CAPAService } from "@/lib/services/qc/capa-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

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
