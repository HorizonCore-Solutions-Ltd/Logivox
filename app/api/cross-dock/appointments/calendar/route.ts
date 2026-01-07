import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as schedulingService from "@/lib/services/cross-dock/scheduling-service";

/**
 * GET /api/cross-dock/appointments/calendar
 * Get calendar view data
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
        : new Date(),
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const calendar = await schedulingService.getAppointmentCalendar(filters);

    return NextResponse.json(calendar);
  } catch (error: any) {
    console.error("Failed to get calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get calendar" },
      { status: 500 },
    );
  }
}
