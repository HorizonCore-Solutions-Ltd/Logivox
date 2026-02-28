/**
 * CAPADutyBridge
 *
 * Wires the CAPA lifecycle to the Duties engine.
 * Called whenever a CAPA stage advances or a new CAPA is created.
 *
 * Each CAPA stage emits ONE duty (idempotent — duplicate calls are safe).
 * The duty carries evidence requirements and is voice-ready.
 */

import { DutyService } from "@/lib/services/duties/duty-service";

// CAPA stages in execution order
const CAPA_STAGES = [
  "CONTAINMENT",
  "ROOT_CAUSE",
  "CORRECTIVE",
  "PREVENTIVE",
  "VERIFICATION",
] as const;

type CAPAStage = (typeof CAPA_STAGES)[number];

// Map CAPA capaType / priority fields → Duty priority
function mapCapaPriority(capaPriority?: string): string {
  if (capaPriority === "CRITICAL") return "CRITICAL";
  if (capaPriority === "HIGH") return "HIGH";
  if (capaPriority === "MEDIUM") return "MEDIUM";
  return "MEDIUM";
}

export class CAPADutyBridge {
  /**
   * Called when CAPA is first created — emits the Containment duty immediately.
   */
  static async onCAPACreated(params: {
    organizationId: string;
    capaId: string;
    capaTitle: string;
    priority?: string;
    ncrId?: string;
    responsiblePerson?: string;
  }) {
    try {
      return await DutyService.emitFromCAPAStage({
        ...params,
        stage: "CONTAINMENT",
        priority: params.priority ?? "HIGH",
      });
    } catch (err) {
      console.error("[CAPADutyBridge] onCAPACreated failed:", err);
      return null;
    }
  }

  /**
   * Called when a CAPA stage is advanced (e.g., Containment → Root Cause).
   * Emits the next stage's duty; idempotent if called twice for the same stage.
   */
  static async onStageAdvanced(params: {
    organizationId: string;
    capaId: string;
    capaTitle: string;
    newStage: string;
    priority?: string;
    ncrId?: string;
  }) {
    const stage = params.newStage.toUpperCase();
    if (!CAPA_STAGES.includes(stage as CAPAStage)) return null;

    try {
      return await DutyService.emitFromCAPAStage({
        organizationId: params.organizationId,
        capaId: params.capaId,
        capaTitle: params.capaTitle,
        stage,
        priority: mapCapaPriority(params.priority),
        ncrId: params.ncrId,
      });
    } catch (err) {
      console.error("[CAPADutyBridge] onStageAdvanced failed:", err);
      return null;
    }
  }

  /**
   * Called when a CAPA is closed — emits the Verification duty (final check).
   */
  static async onCAPAClosed(params: {
    organizationId: string;
    capaId: string;
    capaTitle: string;
    ncrId?: string;
  }) {
    try {
      return await DutyService.emitFromCAPAStage({
        ...params,
        stage: "VERIFICATION",
        priority: "HIGH",
      });
    } catch (err) {
      console.error("[CAPADutyBridge] onCAPAClosed failed:", err);
      return null;
    }
  }

  /**
   * Returns all duties linked to a CAPA, grouped by stage.
   */
  static async getDutiesForCAPA(capaId: string, organizationId: string) {
    const { prisma } = await import("@/lib/prisma");
    const duties = await prisma.duty.findMany({
      where: { capaId, organizationId },
      orderBy: { createdAt: "asc" },
      include: { evidence: true },
    });

    const grouped: Record<string, typeof duties> = {};
    for (const d of duties) {
      const key = d.capaStage ?? "OTHER";
      grouped[key] = grouped[key] ?? [];
      grouped[key].push(d);
    }
    return grouped;
  }
}
