import { NextRequest, NextResponse } from "next/server";
import { QualityReportService } from "@/lib/services/qc/quality-report-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const report = await QualityReportService.getReportById(params.id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch report" },
      { status: 500 },
    );
  }
}
