import { NextResponse } from "next/server";
import FMEAService from "@/lib/services/fmea.service";

/**
 * GET /api/qc/fmea/overdue
 * Get failure modes that are overdue for action
 */
export async function GET(request: Request) {
  try {
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
