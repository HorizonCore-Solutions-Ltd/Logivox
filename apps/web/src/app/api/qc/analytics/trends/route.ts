import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireApiAuth } from "@/lib/api-guard";

const prisma = new PrismaClient();

// GET /api/qc/analytics/trends - Get trend data for charts
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth();
    if ("error" in auth) return auth.error;
    const { organizationId } = auth;

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get("period") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Generate date ranges based on period
    const intervals =
      period <= 7 ? period : period <= 30 ? 7 : period <= 90 ? 10 : 12;
    const intervalDays = Math.floor(period / intervals);

    const trends = [];
    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(startDate);
      intervalStart.setDate(intervalStart.getDate() + i * intervalDays);

      const intervalEnd = new Date(intervalStart);
      intervalEnd.setDate(intervalEnd.getDate() + intervalDays);

      const [ncrs, capas, risks] = await Promise.all([
        prisma.nonConformanceReport.count({
          where: {
            createdAt: {
              gte: intervalStart,
              lt: intervalEnd,
            },
          },
        }),
        prisma.correctivePreventiveAction.count({
          where: {
            createdAt: {
              gte: intervalStart,
              lt: intervalEnd,
            },
          },
        }),
        prisma.riskRegister.count({
          where: {
            createdAt: {
              gte: intervalStart,
              lt: intervalEnd,
            },
          },
        }),
      ]);

      trends.push({
        period: intervalStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ncrs,
        capas,
        risks,
      });
    }

    // Top 5 suppliers by quality score
    const suppliers = await prisma.supplier.findMany({
      take: 5,
      orderBy: { name: "asc" },
      include: {
        // nonConformanceReports removed - not a direct relation
      },
    });

    // Get NCRs separately for each supplier
    const supplierNCRs = await Promise.all(
      suppliers.map(async (supplier) => {
        const ncrs = await prisma.nonConformanceReport.findMany({
          where: {
            supplierId: supplier.id,
          },
        });
        return { supplierId: supplier.id, ncrs };
      }),
    );

    const ncrMap = new Map(supplierNCRs.map((s) => [s.supplierId, s.ncrs]));

    const topSuppliers = suppliers
      .map((supplier: any) => {
        const supplierNcrs = ncrMap.get(supplier.id) || [];
        const ncrs = supplierNcrs.length;
        const criticalNCRs = supplierNcrs.filter(
          (n: any) => n.severity === "CRITICAL",
        ).length;
        const majorNCRs = supplierNcrs.filter(
          (n: any) => n.severity === "MAJOR",
        ).length;

        // Simple quality score calculation
        let score = 100;
        score -= criticalNCRs * 15;
        score -= majorNCRs * 10;
        score -= (ncrs - criticalNCRs - majorNCRs) * 5;

        return {
          name: supplier.name,
          score: Math.max(0, score),
          ncrs,
        };
      })
      .sort((a, b) => b.score - a.score);

    // SPC Alerts — fetch real out-of-spec and out-of-control measurements
    const spcViolations = await prisma.qualityMeasurement.findMany({
      where: {
        organizationId,
        OR: [{ withinSpec: false }, { withinControl: false }],
        measurementDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        parameterName: true,
        productSku: true,
        measuredValue: true,
        lowerSpecLimit: true,
        upperSpecLimit: true,
        withinSpec: true,
        withinControl: true,
        measurementDate: true,
      },
      orderBy: { measurementDate: "desc" },
      take: 20,
    });

    const spcAlerts = spcViolations.map((v) => ({
      id: v.id,
      parameter: v.parameterName,
      sku: v.productSku,
      value: Number(v.measuredValue),
      lsl: v.lowerSpecLimit ? Number(v.lowerSpecLimit) : null,
      usl: v.upperSpecLimit ? Number(v.upperSpecLimit) : null,
      alertType: !v.withinSpec ? "OUT_OF_SPEC" : "OUT_OF_CONTROL",
      detectedAt: v.measurementDate,
    }));

    // Compliance metrics (ISO 9001:2015)
    const [
      totalNCRs,
      ncrWithCAPA,
      totalAudits,
      completedAudits,
      totalDocs,
      approvedDocs,
      totalRisks,
      mitigatedRisks,
    ] = await Promise.all([
      prisma.nonConformanceReport.count(),
      prisma.nonConformanceReport.count({
        where: { capas: { some: {} } },
      }),
      prisma.audit.count(),
      prisma.audit.count({ where: { status: "COMPLETED" } }),
      prisma.document.count(),
      prisma.document.count({ where: { status: "APPROVED" } }),
      prisma.riskRegister.count(),
      prisma.riskRegister.count({ where: { status: "MITIGATED" } }),
    ]);

    const compliance = [
      {
        name: "NCR CAPA Linkage",
        value: ncrWithCAPA,
        total: totalNCRs > 0 ? totalNCRs : 1,
        percentage:
          totalNCRs > 0 ? Math.round((ncrWithCAPA / totalNCRs) * 100) : 100,
      },
      {
        name: "Audit Completion",
        value: completedAudits,
        total: totalAudits > 0 ? totalAudits : 1,
        percentage:
          totalAudits > 0
            ? Math.round((completedAudits / totalAudits) * 100)
            : 100,
      },
      {
        name: "Document Control",
        value: approvedDocs,
        total: totalDocs > 0 ? totalDocs : 1,
        percentage:
          totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 100,
      },
      {
        name: "Risk Management",
        value: mitigatedRisks,
        total: totalRisks > 0 ? totalRisks : 1,
        percentage:
          totalRisks > 0
            ? Math.round((mitigatedRisks / totalRisks) * 100)
            : 100,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        trends,
        suppliers: topSuppliers,
        spcAlerts,
        compliance,
      },
    });
  } catch (error: any) {
    console.error("Error fetching trends:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
