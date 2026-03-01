import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateReportSchema = z.object({
  reportType: z.enum([
    "DAILY_SUMMARY",
    "WEEKLY_SUMMARY",
    "MONTHLY_SUMMARY",
    "VENDOR_COMPLIANCE",
    "SECURITY_AUDIT",
    "CUSTOM",
  ]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  title: z.string().min(1).optional(),
  recipientEmails: z.array(z.string().email()).optional(),
});

// ── GET /api/compliance/reports ───────────────────────────────────────────────
// List previously generated reports with filter support.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };
    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    const [total, reports] = await Promise.all([
      prisma.securityComplianceReport.count({ where }),
      prisma.securityComplianceReport.findMany({
        where,
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reportNumber: true,
          reportType: true,
          title: true,
          periodStart: true,
          periodEnd: true,
          generatedAt: true,
          status: true,
          publishedAt: true,
          summary: true,
        },
      }),
    ]);

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ComplianceReports GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

// ── POST /api/compliance/reports ─────────────────────────────────────────────
// Auto-generate a compliance report from live data.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = [
      "admin",
      "compliance_officer",
      "ADMIN",
      "COMPLIANCE_OFFICER",
      "ops_manager",
    ];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = generateReportSchema.parse(body);
    const orgId = session.user.organizationId;
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const dateFilter = { gte: periodStart, lte: periodEnd };

    // ── Gather compliance data from multiple sources in parallel ────────────
    const [
      vendorChecks,
      ncrs,
      incidentCount,
      rmaCount,
      openCAPAs,
      gateEntries,
    ] = await Promise.all([
      prisma.vendorComplianceCheck.findMany({
        where: { organizationId: orgId, checkDate: dateFilter },
        select: {
          id: true,
          overallResult: true,
          violationCount: true,
          criticalViolations: true,
          complianceRate: true,
          vendor: { select: { name: true, code: true } },
        },
      }),
      prisma.nonConformanceReport
        .count({
          where: { organizationId: orgId, createdAt: dateFilter },
        })
        .catch(() => 0),
      prisma.activityLog
        .count({
          where: {
            organizationId: orgId,
            createdAt: dateFilter,
            action: { contains: "INCIDENT" },
          },
        })
        .catch(() => 0),
      prisma.rMA
        .count({
          where: { organizationId: orgId, createdAt: dateFilter },
        })
        .catch(() => 0),
      prisma.cAPAAction
        .count({
          where: {
            organizationId: orgId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
        })
        .catch(() => 0),
      prisma.gateEntry
        .count({
          where: { organizationId: orgId, entryTime: dateFilter },
        })
        .catch(() => 0),
    ]);

    // ── Compute statistics ──────────────────────────────────────────────────
    const totalChecks = vendorChecks.length;
    const passedChecks = vendorChecks.filter(
      (c) =>
        c.overallResult === "PASS" ||
        c.overallResult === "PASSED" ||
        c.overallResult === "COMPLIANT",
    ).length;
    const failedChecks = totalChecks - passedChecks;
    const totalViolations = vendorChecks.reduce(
      (s, c) => s + (c.violationCount ?? 0),
      0,
    );
    const criticalViolations = vendorChecks.reduce(
      (s, c) => s + (c.criticalViolations ?? 0),
      0,
    );
    const avgComplianceRate =
      totalChecks > 0
        ? Math.round(
            vendorChecks.reduce((s, c) => s + Number(c.complianceRate), 0) /
              totalChecks,
          )
        : 0;

    // ── Build findings array ────────────────────────────────────────────────
    const findings: Record<string, unknown>[] = [];

    if (criticalViolations > 0) {
      findings.push({
        severity: "CRITICAL",
        category: "Vendor Compliance",
        description: `${criticalViolations} critical violation(s) found across vendor compliance checks.`,
        count: criticalViolations,
      });
    }
    if (failedChecks > 0) {
      findings.push({
        severity: "HIGH",
        category: "Vendor Compliance",
        description: `${failedChecks} of ${totalChecks} vendor compliance checks failed.`,
        count: failedChecks,
      });
    }
    if (openCAPAs > 0) {
      findings.push({
        severity: "MEDIUM",
        category: "CAPA",
        description: `${openCAPAs} CAPA action(s) remain open or in progress.`,
        count: openCAPAs,
      });
    }
    if (ncrs > 0) {
      findings.push({
        severity: "MEDIUM",
        category: "Quality",
        description: `${ncrs} non-conformance report(s) raised in period.`,
        count: ncrs,
      });
    }

    // ── Recommendations ─────────────────────────────────────────────────────
    const recs: string[] = [];
    if (criticalViolations > 0)
      recs.push(
        "Immediate audit required for suppliers with critical violations.",
      );
    if (avgComplianceRate < 80)
      recs.push(
        "Supplier compliance rate below 80% — initiate vendor improvement programme.",
      );
    if (openCAPAs > 5)
      recs.push("High number of open CAPAs — review resource allocation.");
    if (ncrs > 10)
      recs.push(
        "Elevated NCR count — investigate root causes and update control procedures.",
      );
    if (recs.length === 0)
      recs.push(
        "No significant compliance gaps identified. Maintain current controls.",
      );

    // ── Auto-generate report number ─────────────────────────────────────────
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const existingCount = await prisma.securityComplianceReport.count({
      where: { organizationId: orgId },
    });
    const reportNumber = `CR-${dateStr}-${String(existingCount + 1).padStart(4, "0")}`;

    const title =
      data.title ??
      `${data.reportType.replace(/_/g, " ")} — ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}`;

    const summary = [
      `Period: ${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}.`,
      `${totalChecks} vendor compliance checks performed (${passedChecks} passed, ${failedChecks} failed).`,
      `Average compliance rate: ${avgComplianceRate}%.`,
      `${totalViolations} total violations (${criticalViolations} critical).`,
      `${ncrs} NCRs, ${openCAPAs} open CAPAs, ${incidentCount} incidents, ${rmaCount} returns in period.`,
    ].join(" ");

    const report = await prisma.securityComplianceReport.create({
      data: {
        organizationId: orgId,
        reportNumber,
        reportType: data.reportType as Parameters<
          typeof prisma.securityComplianceReport.create
        >[0]["data"]["reportType"],
        title,
        periodStart,
        periodEnd,
        summary,
        findings,
        statistics: {
          vendorChecks: {
            total: totalChecks,
            passed: passedChecks,
            failed: failedChecks,
          },
          violations: { total: totalViolations, critical: criticalViolations },
          avgComplianceRate,
          ncrs,
          openCAPAs,
          incidents: incidentCount,
          rmas: rmaCount,
          gateEntries,
        },
        recommendations: recs.join("\n"),
        recipientEmails: data.recipientEmails ?? null,
        status: "DRAFT",
        publishedBy: null,
        publishedAt: null,
        pdfUrl: null,
        csvUrl: null,
        sentAt: null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[ComplianceReports POST]", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
