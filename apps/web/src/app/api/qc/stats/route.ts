import { NextResponse } from "next/server";
import QCInspectionService from "@/lib/services/qc/inspection-service";
import RTVService from "@/lib/services/qc/rtv-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const days = parseInt(searchParams.get("days") || "30");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    if (type === "inspections") {
      const stats = await QCInspectionService.getInspectionStats(
        organizationId,
        days,
      );
      return NextResponse.json({ stats });
    }

    if (type === "rtv") {
      const stats = await RTVService.getRTVStats(organizationId, days);
      return NextResponse.json({ stats });
    }

    // Return combined stats
    const inspectionStats = await QCInspectionService.getInspectionStats(
      organizationId,
      days,
    );
    const rtvStats = await RTVService.getRTVStats(organizationId, days);

    return NextResponse.json({
      inspections: inspectionStats,
      rtv: rtvStats,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
