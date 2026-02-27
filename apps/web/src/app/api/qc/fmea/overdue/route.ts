import { NextResponse } from "next/server";
import FMEAService from "@/lib/services/fmea.service";
import { requireApiAuth } from "@/lib/api-guard";

/**
 * GET /api/qc/fmea/overdue
 * Get failure modes that are overdue for action
 */
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const overdueActions = await FMEAService.getFailureModesDueForAction();

    return NextResponse.json({
      success: true,
      data: overdueActions,
      meta: {
        total: overdueActions.length,
      },
    });
  } catch (error: any) {
    console.error("Overdue actions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch overdue actions" },
      { status: 500 },
    );
  }
}
