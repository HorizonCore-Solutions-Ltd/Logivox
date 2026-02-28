/**
 * AuditService
 *
 * Handles all audit-related database operations. Three routes import this
 * module directly:
 *   - /api/qc/audits/[id]/findings  → addFinding()
 *   - /api/qc/audits/schedule       → getAuditSchedule()
 *   - /api/qc/audits/metrics        → getAuditMetrics()
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddFindingInput {
  auditId: string;
  severity: "MAJOR" | "MINOR" | "OBSERVATION";
  clause?: string;
  category?: string;
  description: string;
  evidence?: object;
  requirement?: string;
  responsiblePerson?: string;
  dueDate?: Date;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const AuditService = {
  /**
   * Add a finding to an existing audit.
   * Auto-generates findingNumber based on existing finding count.
   */
  async addFinding(input: AddFindingInput) {
    const {
      auditId,
      severity,
      clause,
      category,
      description,
      evidence,
      requirement,
      responsiblePerson,
      dueDate,
    } = input;

    // Verify audit exists
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { _count: { select: { findings: true } } },
    });

    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    const findingNumber = `${audit.auditNumber}-F${String(audit._count.findings + 1).padStart(3, "0")}`;

    const finding = await prisma.auditFinding.create({
      data: {
        auditId,
        findingNumber,
        severity,
        clause: clause ?? null,
        category: category ?? null,
        description,
        evidence: evidence ?? undefined,
        requirement: requirement ?? null,
        status: "OPEN",
      },
    });

    // Automatically escalate audit status to IN_PROGRESS if PLANNED
    if (audit.status === "PLANNED") {
      await prisma.audit.update({
        where: { id: auditId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return finding;
  },

  /**
   * Return audits sorted by date — overdue (past auditDate + PLANNED/IN_PROGRESS)
   * grouped first, then upcoming.
   */
  async getAuditSchedule(organizationId: string) {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 3600_000);

    const [overdue, upcoming, recentlyClosed] = await Promise.all([
      // Overdue: planned or in-progress past their audit date
      prisma.audit.findMany({
        where: {
          organizationId,
          status: { in: ["PLANNED", "IN_PROGRESS"] },
          auditDate: { lt: now },
        },
        include: { findings: true },
        orderBy: { auditDate: "asc" },
      }),

      // Upcoming: scheduled in next 30 days
      prisma.audit.findMany({
        where: {
          organizationId,
          status: "PLANNED",
          auditDate: { gte: now, lte: thirtyDaysAhead },
        },
        include: { findings: true },
        orderBy: { auditDate: "asc" },
      }),

      // Recently closed last 30 days
      prisma.audit.findMany({
        where: {
          organizationId,
          status: { in: ["REPORT_ISSUED", "CLOSED"] },
          updatedAt: { gte: new Date(now.getTime() - 30 * 24 * 3600_000) },
        },
        include: { findings: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      overdue,
      upcoming,
      recentlyClosed,
      summary: {
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
        recentlyClosedCount: recentlyClosed.length,
      },
    };
  },

  /**
   * Compute audit KPI metrics for a given date range.
   */
  async getAuditMetrics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const start = startDate ?? new Date(Date.now() - 90 * 24 * 3600_000);
    const end = endDate ?? new Date();

    const [audits, findings] = await Promise.all([
      prisma.audit.findMany({
        where: {
          organizationId,
          auditDate: { gte: start, lte: end },
        },
        include: { findings: true },
      }),
      prisma.auditFinding.findMany({
        where: {
          audit: {
            organizationId,
            auditDate: { gte: start, lte: end },
          },
        },
      }),
    ]);

    const totalAudits = audits.length;
    const byStatus = {
      PLANNED: audits.filter((a) => a.status === "PLANNED").length,
      IN_PROGRESS: audits.filter((a) => a.status === "IN_PROGRESS").length,
      COMPLETED: audits.filter((a) => a.status === "COMPLETED").length,
      REPORT_ISSUED: audits.filter((a) => a.status === "REPORT_ISSUED").length,
      CLOSED: audits.filter((a) => a.status === "CLOSED").length,
    };
    const byType = {
      INTERNAL: audits.filter((a) => a.type === "INTERNAL").length,
      SUPPLIER: audits.filter((a) => a.type === "SUPPLIER").length,
      CUSTOMER: audits.filter((a) => a.type === "CUSTOMER").length,
      REGULATORY: audits.filter((a) => a.type === "REGULATORY").length,
      CERTIFICATION: audits.filter((a) => a.type === "CERTIFICATION").length,
    };

    const totalFindings = findings.length;
    const findingsBySeverity = {
      MAJOR: findings.filter((f) => f.severity === "MAJOR").length,
      MINOR: findings.filter((f) => f.severity === "MINOR").length,
      OBSERVATION: findings.filter((f) => f.severity === "OBSERVATION").length,
    };
    const findingsByStatus = {
      OPEN: findings.filter((f) => f.status === "OPEN").length,
      CAPA_ASSIGNED: findings.filter((f) => f.status === "CAPA_ASSIGNED")
        .length,
      PENDING_VERIFICATION: findings.filter(
        (f) => f.status === "PENDING_VERIFICATION",
      ).length,
      VERIFIED: findings.filter((f) => f.status === "VERIFIED").length,
      CLOSED: findings.filter((f) => f.status === "CLOSED").length,
    };

    const closureRate =
      totalFindings > 0
        ? Math.round(
            ((findingsByStatus.CLOSED + findingsByStatus.VERIFIED) /
              totalFindings) *
              100,
          )
        : 100;

    // Audit completion rate (closed + report_issued / total)
    const completionRate =
      totalAudits > 0
        ? Math.round(
            ((byStatus.CLOSED + byStatus.REPORT_ISSUED + byStatus.COMPLETED) /
              totalAudits) *
              100,
          )
        : 0;

    return {
      period: { start, end },
      totalAudits,
      byStatus,
      byType,
      completionRate,
      totalFindings,
      findingsBySeverity,
      findingsByStatus,
      closureRate,
      openMajorFindings:
        findingsBySeverity.MAJOR -
        findings.filter(
          (f) =>
            f.severity === "MAJOR" &&
            (f.status === "CLOSED" || f.status === "VERIFIED"),
        ).length,
    };
  },
};

export default AuditService;
