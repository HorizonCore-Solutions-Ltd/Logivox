import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/analytics/kpis - Get key performance indicators
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get("period") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - period);

    // Current period metrics
    const [
      currentNCRs,
      previousNCRs,
      openCAPAs,
      previousOpenCAPAs,
      criticalRisks,
      overdueAudits,
      allNCRs,
    ] = await Promise.all([
      // Current NCRs
      prisma.nonConformanceReport.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Previous period NCRs
      prisma.nonConformanceReport.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
      // Open CAPAs
      prisma.correctivePreventiveAction.count({
        where: { status: { in: ["DRAFT", "IN_PROGRESS", "VERIFICATION"] } },
      }),
      // Previous period open CAPAs (at that time)
      prisma.correctivePreventiveAction.count({
        where: {
          createdAt: { lt: startDate },
          status: { in: ["DRAFT", "IN_PROGRESS", "VERIFICATION"] },
        },
      }),
      // Critical risks (RPN >= 200)
      prisma.riskRegister.count({
        where: { rpn: { gte: 200 } },
      }),
      // Overdue audits
      prisma.audit.count({
        where: {
          auditDate: { lt: new Date() },
          status: { not: "COMPLETED" },
        },
      }),
      // All NCRs for claim calculation
      prisma.nonConformanceReport.findMany({
        where: { createdAt: { gte: startDate } },
        select: { claimAmount: true },
      }),
    ]);

    // Calculate trends
    const ncrTrend =
      previousNCRs > 0
        ? Math.round(((currentNCRs - previousNCRs) / previousNCRs) * 100)
        : 0;

    const capaTrend =
      previousOpenCAPAs > 0
        ? Math.round(
            ((openCAPAs - previousOpenCAPAs) / previousOpenCAPAs) * 100,
          )
        : 0;

    // Calculate total claims
    const totalClaims = allNCRs.reduce(
      (sum: number, ncr: any) => sum + (ncr.claimAmount || 0),
      0,
    );

    // Calculate quality score (simplified)
    const totalMetrics =
      currentNCRs + openCAPAs + criticalRisks + overdueAudits;
    const qualityScore = Math.max(0, Math.min(100, 100 - totalMetrics * 2));

    return NextResponse.json({
      success: true,
      data: {
        totalNCRs: currentNCRs,
        openCAPAs,
        criticalRisks,
        overdueAudits,
        totalClaims,
        qualityScore: Math.round(qualityScore),
        ncrTrend,
        capaTrend,
      },
    });
  } catch (error: any) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
