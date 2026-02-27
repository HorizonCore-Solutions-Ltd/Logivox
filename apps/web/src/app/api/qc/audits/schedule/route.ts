import { NextResponse } from "next/server";
import AuditService from "@/lib/services/audit.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/audits/schedule
 * Get audit schedule and overdue audits
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);

    const schedule = await AuditService.getAuditSchedule(organizationId);

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error("Get audit schedule error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get schedule" },
      { status: 500 },
    );
  }
}
