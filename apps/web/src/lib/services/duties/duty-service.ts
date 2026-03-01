/**
 * DutyService — Core WMS Duties Engine
 *
 * Features:
 *  - CRUD with idempotency key support
 *  - Skill/cert-aware auto-assignment (rule-based engine)
 *  - SLA breach scanning (intended for cron / edge runtime)
 *  - Voice script compilation
 *  - Fatigue / fairness constraints
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateDutyInput {
  organizationId: string;
  title: string;
  category?: string;
  priority?: string;
  dutyTypeId?: string;
  shiftId?: string;
  zoneId?: string;
  zoneName?: string;
  warehouseId?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  slaMinutes?: number;
  description?: string;
  checklistItems?: Array<{ step: string; required: boolean }>;
  capaId?: string;
  capaStage?: string;
  ncrId?: string;
  assignedBy?: string;
  // Optional: skip auto-assign and directly assign
  employeeId?: string;
  idempotencyKey?: string;
}

export interface AutoPlanInput {
  organizationId: string;
  shiftId: string;
  warehouseId?: string;
  duties: Array<{
    dutyTypeId: string;
    quantity: number;
    zoneId?: string;
    scheduledStart?: Date;
  }>;
  requestedBy: string;
}

export interface AssignmentResult {
  dutyId: string;
  employeeId: string | null;
  employeeName: string | null;
  rule: string;
  confidence: number; // 0–1
}

// ─── CAPA Stage → Duty category mapping ──────────────────────────────────────

const CAPA_STAGE_CATEGORY: Record<string, string> = {
  CONTAINMENT: "CAPA_CONTAINMENT",
  ROOT_CAUSE: "CAPA_INVESTIGATION",
  CORRECTIVE: "CAPA_CORRECTIVE",
  PREVENTIVE: "CAPA_PREVENTIVE",
  VERIFICATION: "CAPA_VERIFICATION",
};

const CAPA_STAGE_SLA: Record<string, number> = {
  CONTAINMENT: 60, // 1 h
  ROOT_CAUSE: 480, // 8 h
  CORRECTIVE: 1440, // 24 h
  PREVENTIVE: 2880, // 48 h
  VERIFICATION: 1440, // 24 h
};

// ─── Helper — parse Employee.skills/certifications JSON ──────────────────────

function getEmployeeSkills(emp: { skills?: Prisma.JsonValue }): string[] {
  if (!emp.skills) return [];
  if (Array.isArray(emp.skills)) return emp.skills as string[];
  if (typeof emp.skills === "object") return Object.keys(emp.skills as object);
  return [];
}

function getEmployeeCerts(emp: {
  certifications?: Prisma.JsonValue;
}): string[] {
  if (!emp.certifications) return [];
  if (Array.isArray(emp.certifications)) return emp.certifications as string[];
  if (typeof emp.certifications === "object")
    return Object.keys(emp.certifications as object);
  return [];
}

// ─── Core service ─────────────────────────────────────────────────────────────

export class DutyService {
  // ── Create ────────────────────────────────────────────────────────────────

  static async createDuty(input: CreateDutyInput) {
    const {
      organizationId,
      title,
      category = "OTHER",
      priority = "MEDIUM",
      dutyTypeId,
      shiftId,
      zoneId,
      zoneName,
      warehouseId,
      scheduledStart,
      scheduledEnd,
      slaMinutes,
      description,
      checklistItems,
      capaId,
      capaStage,
      ncrId,
      assignedBy,
      employeeId,
    } = input;

    // Idempotency guard
    if (input.idempotencyKey) {
      const existing = await prisma.duty.findFirst({
        where: {
          organizationId,
          metadata: {
            path: ["idempotencyKey"],
            equals: input.idempotencyKey,
          },
        },
      });
      if (existing) return existing;
    }

    // Resolve checklist from DutyType if not provided
    let resolvedChecklist: Prisma.JsonValue | undefined = checklistItems
      ? checklistItems.map((c) => ({
          ...c,
          done: false,
          doneAt: null,
          doneBy: null,
        }))
      : undefined;

    if (!resolvedChecklist && dutyTypeId) {
      const dt = await prisma.dutyType.findUnique({
        where: { id: dutyTypeId },
        select: { checklistItems: true },
      });
      if (dt?.checklistItems) resolvedChecklist = dt.checklistItems;
    }

    const duty = await prisma.duty.create({
      data: {
        organizationId,
        title,
        category: category as any,
        priority: priority as any,
        dutyTypeId,
        shiftId,
        zoneId,
        zoneName,
        warehouseId,
        scheduledStart,
        scheduledEnd,
        slaMinutes,
        description,
        checklistItems: resolvedChecklist,
        capaId,
        capaStage,
        ncrId,
        assignedBy,
        employeeId,
        autoAssigned: false,
        metadata: input.idempotencyKey
          ? { idempotencyKey: input.idempotencyKey }
          : undefined,
      },
      include: {
        evidence: true,
        dutyType: { select: { name: true, category: true } },
      },
    });

    return duty;
  }

  // ── Auto-assign a single duty ─────────────────────────────────────────────

  static async autoAssign(
    dutyId: string,
    organizationId: string,
  ): Promise<AssignmentResult> {
    const duty = await prisma.duty.findUnique({
      where: { id: dutyId },
      include: {
        dutyType: {
          select: { requiredSkills: true, requiredCerts: true },
        },
      },
    });

    if (!duty) throw new Error(`Duty ${dutyId} not found`);
    if (duty.employeeId) {
      return {
        dutyId,
        employeeId: duty.employeeId,
        employeeName: null,
        rule: "already-assigned",
        confidence: 1,
      };
    }

    const requiredSkills: string[] = duty.dutyType?.requiredSkills ?? [];
    const requiredCerts: string[] = duty.dutyType?.requiredCerts ?? [];

    // Pull active employees for this org (optionally filter by shift assignment)
    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true,
        status: "ACTIVE",
        ...(duty.shiftId
          ? {
              shiftAssignments: {
                some: {
                  shiftId: duty.shiftId,
                  status: { in: ["SCHEDULED", "CHECKED_IN"] as any },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        skills: true,
        certifications: true,
        defaultZoneId: true,
        shiftAssignments: {
          where: { status: { in: ["SCHEDULED", "CHECKED_IN"] as any } },
          orderBy: { assignedDate: "desc" },
          take: 1,
        },
      },
    });

    if (employees.length === 0) {
      return {
        dutyId,
        employeeId: null,
        employeeName: null,
        rule: "no-eligible-employees",
        confidence: 0,
      };
    }

    // Score each candidate
    type ScoredEmployee = {
      emp: (typeof employees)[0];
      score: number;
      rule: string;
    };
    const scored: ScoredEmployee[] = employees.map((emp) => {
      const empSkills = getEmployeeSkills(emp);
      const empCerts = getEmployeeCerts(emp);

      let score = 0;
      let rule = "round-robin";

      // Skill match
      const skillMatches = requiredSkills.filter((s) =>
        empSkills.some((es) => es.toLowerCase().includes(s.toLowerCase())),
      ).length;
      score += skillMatches * 10;
      if (requiredSkills.length > 0 && skillMatches > 0) rule = "skill-match";

      // Cert match
      const certMatches = requiredCerts.filter((c) =>
        empCerts.some((ec) => ec.toLowerCase().includes(c.toLowerCase())),
      ).length;
      score += certMatches * 15;
      if (requiredCerts.length > 0 && certMatches > 0) rule = "cert-match";

      // Zone preference
      if (duty.zoneId && emp.defaultZoneId === duty.zoneId) {
        score += 5;
        rule = "zone-preference";
      }

      return { emp, score, rule };
    });

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];
    const maxScore = Math.max(
      1,
      requiredSkills.length * 10 + requiredCerts.length * 15 + 5,
    );
    const confidence = Math.min(1, winner.score / maxScore);

    await prisma.duty.update({
      where: { id: dutyId },
      data: {
        employeeId: winner.emp.id,
        autoAssigned: true,
        assignmentRule: winner.rule,
      },
    });

    return {
      dutyId,
      employeeId: winner.emp.id,
      employeeName: `${winner.emp.firstName} ${winner.emp.lastName}`,
      rule: winner.rule,
      confidence,
    };
  }

  // ── Auto-plan a full shift ────────────────────────────────────────────────

  static async autoPlan(input: AutoPlanInput) {
    const results: AssignmentResult[] = [];

    for (const req of input.duties) {
      const dutyType = await prisma.dutyType.findUnique({
        where: { id: req.dutyTypeId },
        select: {
          name: true,
          category: true,
          defaultDuration: true,
          slaMinutes: undefined as any,
        },
      });
      if (!dutyType) continue;

      for (let i = 0; i < req.quantity; i++) {
        const scheduledStart = req.scheduledStart
          ? new Date(
              req.scheduledStart.getTime() +
                i * (dutyType.defaultDuration ?? 30) * 60_000,
            )
          : undefined;
        const scheduledEnd = scheduledStart
          ? new Date(
              scheduledStart.getTime() +
                (dutyType.defaultDuration ?? 30) * 60_000,
            )
          : undefined;

        const duty = await DutyService.createDuty({
          organizationId: input.organizationId,
          title: `${dutyType.name} #${i + 1}`,
          category: dutyType.category,
          dutyTypeId: req.dutyTypeId,
          shiftId: input.shiftId,
          warehouseId: input.warehouseId,
          zoneId: req.zoneId,
          scheduledStart,
          scheduledEnd,
          assignedBy: input.requestedBy,
        });

        const assignment = await DutyService.autoAssign(
          duty.id,
          input.organizationId,
        );
        results.push(assignment);
      }
    }

    return results;
  }

  // ── Emit duties from a CAPA stage ────────────────────────────────────────

  static async emitFromCAPAStage(params: {
    organizationId: string;
    capaId: string;
    capaTitle: string;
    stage: string; // e.g. "CONTAINMENT"
    responsiblePerson?: string; // userId
    ncrId?: string;
    priority?: string;
  }) {
    const { organizationId, capaId, capaTitle, stage, ncrId, priority } =
      params;
    const category = CAPA_STAGE_CATEGORY[stage] ?? "OTHER";
    const slaMinutes = CAPA_STAGE_SLA[stage] ?? 240;
    const stageName = stage.replace(/_/g, " ").toLowerCase();

    const duty = await DutyService.createDuty({
      organizationId,
      title: `[CAPA] ${capaTitle} — ${stageName}`,
      description: `Auto-generated duty for CAPA ${capaId} stage: ${stageName}. Complete and attach evidence before advancing stage.`,
      category,
      priority: priority ?? (stage === "CONTAINMENT" ? "CRITICAL" : "HIGH"),
      capaId,
      capaStage: stage,
      ncrId,
      slaMinutes,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + slaMinutes * 60_000),
      idempotencyKey: `capa:${capaId}:stage:${stage}`,
    });

    return duty;
  }

  // ── Update duty status ────────────────────────────────────────────────────

  static async updateStatus(
    id: string,
    organizationId: string,
    status: string,
    opts?: {
      completionNotes?: string;
      rejectionReason?: string;
      employeeId?: string;
    },
  ) {
    const now = new Date();
    const data: Prisma.DutyUpdateInput = { status: status as any };

    if (status === "ACTIVE") data.actualStart = now;
    if (status === "DONE" || status === "CANCELLED" || status === "SKIPPED")
      data.actualEnd = now;
    if (opts?.completionNotes) data.completionNotes = opts.completionNotes;
    if (opts?.rejectionReason) data.rejectionReason = opts.rejectionReason;

    // Compute duration
    const existing = await prisma.duty.findUnique({
      where: { id },
      select: { actualStart: true },
    });
    if (
      existing?.actualStart &&
      (status === "DONE" || status === "CANCELLED")
    ) {
      data.durationMinutes = Math.round(
        (now.getTime() - existing.actualStart.getTime()) / 60_000,
      );
    }

    return prisma.duty.update({ where: { id, organizationId }, data });
  }

  // ── Reassign ──────────────────────────────────────────────────────────────

  static async reassign(
    id: string,
    organizationId: string,
    newEmployeeId: string,
    reason: string,
  ) {
    const duty = await prisma.duty.findUnique({
      where: { id },
      select: { employeeId: true, reassignCount: true },
    });
    return prisma.duty.update({
      where: { id, organizationId },
      data: {
        employeeId: newEmployeeId,
        previousEmployeeId: duty?.employeeId,
        reassignReason: reason,
        reassignCount: { increment: 1 },
      },
    });
  }

  // ── Add evidence ──────────────────────────────────────────────────────────

  static async addEvidence(params: {
    dutyId: string;
    evidenceType: string;
    label?: string;
    value?: string;
    fileKey?: string;
    capturedBy?: string;
  }) {
    return prisma.dutyEvidence.create({
      data: {
        dutyId: params.dutyId,
        evidenceType: params.evidenceType as any,
        label: params.label,
        value: params.value,
        fileKey: params.fileKey,
        capturedBy: params.capturedBy,
      },
    });
  }

  // ── Compile voice script ──────────────────────────────────────────────────

  static async compileVoiceScript(dutyId: string): Promise<object> {
    const duty = await prisma.duty.findUnique({
      where: { id: dutyId },
      include: {
        dutyType: { select: { voiceTemplate: true, checklistItems: true } },
      },
    });
    if (!duty) throw new Error(`Duty ${dutyId} not found`);

    // Use DutyType template if present, else build a default one
    const template = duty.dutyType?.voiceTemplate as any;
    const checklist = (duty.checklistItems ??
      duty.dutyType?.checklistItems) as any[];

    const steps = checklist
      ? checklist.map((item: any, idx: number) => ({
          seq: idx + 1,
          prompt: item.step ?? item.label ?? `Step ${idx + 1}`,
          confirmationType: item.required ? "voice_confirm" : "acknowledge",
          checkDigit: randomBytes(2).toString("hex").toUpperCase(),
        }))
      : [
          {
            seq: 1,
            prompt: `Begin: ${duty.title}`,
            confirmationType: "acknowledge",
            checkDigit: null,
          },
          {
            seq: 2,
            prompt: "Confirm area is clear and safe.",
            confirmationType: "voice_confirm",
            checkDigit: randomBytes(2).toString("hex").toUpperCase(),
          },
          {
            seq: 3,
            prompt: "Task complete? Confirm.",
            confirmationType: "voice_confirm",
            checkDigit: randomBytes(2).toString("hex").toUpperCase(),
          },
        ];

    const script = {
      dutyId,
      title: duty.title,
      category: duty.category,
      priority: duty.priority,
      steps,
      offlineCapable: true,
      resumable: true,
      generatedAt: new Date().toISOString(),
      ...(template ?? {}),
    };

    // Persist reference
    const scriptRef = `voice:${dutyId}:${Date.now()}`;
    await prisma.duty.update({
      where: { id: dutyId },
      data: { voiceScriptRef: scriptRef },
    });

    return script;
  }

  // ── SLA breach scan (run from cron/edge) ──────────────────────────────────

  static async markSLABreaches(organizationId: string) {
    const now = new Date();
    const result = await prisma.duty.updateMany({
      where: {
        organizationId,
        slaBreached: false,
        status: { in: ["PLANNED", "ACTIVE"] as any },
        slaMinutes: { not: null },
        scheduledStart: { not: null },
        scheduledEnd: { lt: now },
      },
      data: { slaBreached: true },
    });
    return result.count;
  }

  // ── KPI metrics ───────────────────────────────────────────────────────────

  static async getKPIs(organizationId: string, since?: Date) {
    const from = since ?? new Date(Date.now() - 7 * 24 * 3600_000);

    const [total, done, breached, capaLinked, byStatus, byCategory] =
      await Promise.all([
        prisma.duty.count({
          where: { organizationId, createdAt: { gte: from } },
        }),
        prisma.duty.count({
          where: { organizationId, status: "DONE", createdAt: { gte: from } },
        }),
        prisma.duty.count({
          where: {
            organizationId,
            slaBreached: true,
            createdAt: { gte: from },
          },
        }),
        prisma.duty.count({
          where: {
            organizationId,
            capaId: { not: null },
            createdAt: { gte: from },
          },
        }),
        prisma.duty.groupBy({
          by: ["status"],
          where: { organizationId, createdAt: { gte: from } },
          _count: true,
        }),
        prisma.duty.groupBy({
          by: ["category"],
          where: { organizationId, createdAt: { gte: from } },
          _count: true,
        }),
      ]);

    // Average duration for DONE duties
    const doneWithDuration = await prisma.duty.findMany({
      where: {
        organizationId,
        status: "DONE",
        durationMinutes: { not: null },
        createdAt: { gte: from },
      },
      select: { durationMinutes: true },
    });
    const avgDurationMinutes =
      doneWithDuration.length > 0
        ? doneWithDuration.reduce((s, d) => s + (d.durationMinutes ?? 0), 0) /
          doneWithDuration.length
        : 0;

    return {
      total,
      done,
      slaHitRate:
        total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
      slaBreached: breached,
      capaLinked,
      avgDurationMinutes: Math.round(avgDurationMinutes),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      byCategory: Object.fromEntries(
        byCategory.map((r) => [r.category, r._count]),
      ),
    };
  }
}
