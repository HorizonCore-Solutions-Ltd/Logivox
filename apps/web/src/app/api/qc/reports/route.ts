import { NextRequest, NextResponse } from "next/server";
import { QualityReportService } from "@/lib/services/qc/quality-report-service";
import { requireApiAuth } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType") as any;
    const reportCategory = searchParams.get("reportCategory") as any;
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

    const reports = await QualityReportService.listReports(organizationId, {
      reportType,
      reportCategory,
      startDate,
      endDate,
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error listing reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const body = await request.json();

    const report = await QualityReportService.createReport(body);

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create report" },
      { status: 500 },
    );
  }
}
