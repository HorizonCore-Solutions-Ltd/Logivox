import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as schedulingService from "@/lib/services/cross-dock/scheduling-service";

/**
 * GET /api/cross-dock/appointments/stats
 * Get appointment statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const filters = {
      organizationId: session.user.organizationId,
      warehouseId: searchParams.get("warehouseId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    };

    const stats = await schedulingService.getAppointmentStats(filters);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Failed to get stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get stats" },
      { status: 500 },
    );
  }
}
