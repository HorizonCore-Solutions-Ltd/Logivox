/**
 * Real-Time CAPA Effectiveness Monitoring API
 * Monitors closed CAPAs to detect if issues recur (CAPA failure)
 *
 * Features:
 * - Post-closure monitoring
 * - Recurrence detection
 * - Effectiveness scoring
 * - Automatic re-CAPA triggering
 * - Performance metrics tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const verificationSchema = z.object({
  capaId: z.string(),
  verificationMethod: z.string().min(10, "Verification method required"),
  verificationPassed: z.boolean(),
  effectivenessScore: z.number().min(0).max(100),
  effectivenessNotes: z.string().optional(),
  evidenceCollected: z.array(z.string()).optional(),
});

interface EffectivenessMetrics {
  capaId: string;
  capaNumber: string;
  closedDate: string;
  monitoringDays: number;
  recurrenceDetected: boolean;
  effectivenessScore: number;
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  relatedIncidents: number;
  recommendation: string;
}

/**
 * GET - Monitor effectiveness of closed CAPAs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const daysBack = parseInt(searchParams.get("daysBack") || "90");

    // Get closed CAPAs within monitoring period
    const monitoringStartDate = new Date();
    monitoringStartDate.setDate(monitoringStartDate.getDate() - daysBack);

    const closedCAPAs = await prisma.correctivePreventiveAction.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: status === "all" ? undefined : "CLOSED",
        closedDate: {
          gte: monitoringStartDate,
        },
      },
      orderBy: { closedDate: "desc" },
      take: 50,
    });

    // Analyze effectiveness for each CAPA
    const effectivenessData: EffectivenessMetrics[] = [];

    for (const capa of closedCAPAs) {
      const metrics = await analyzeEffectiveness(
        session.user.organizationId,
        capa
      );
      effectivenessData.push(metrics);
    }

    // Calculate aggregate statistics
    const stats = calculateAggregateStats(effectivenessData);

    return NextResponse.json({
      success: true,
      effectivenessData,
      statistics: stats,
      monitoringPeriod: `Last ${daysBack} days`,
    });
  } catch (error) {
    console.error("Error monitoring CAPA effectiveness:", error);
    return NextResponse.json(
      { error: "Failed to monitor effectiveness" },
      { status: 500 }
    );
  }
}

/**
 * POST - Record effectiveness verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = verificationSchema.parse(body);

    // Update CAPA with verification results
    const capa = await prisma.correctivePreventiveAction.update({
      where: {
        id: validatedData.capaId,
        organizationId: session.user.organizationId,
      },
      data: {
        verificationMethod: validatedData.verificationMethod,
        verificationDate: new Date(),
        verificationPerformedBy: session.user.id,
        verificationPassed: validatedData.verificationPassed,
        effectivenessScore: validatedData.effectivenessScore,
        effectivenessNotes: validatedData.effectivenessNotes,
        effectivenessCheckDate: new Date(),
      },
    });

    // If verification failed, trigger re-CAPA
    if (!validatedData.verificationPassed || validatedData.effectivenessScore < 70) {
      await triggerReCAPA(
        session.user.organizationId,
        capa,
        session.user.id,
        validatedData.effectivenessNotes || "Original CAPA ineffective"
      );
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "EFFECTIVENESS_VERIFIED",
        entityType: "CAPA",
        entityId: capa.id,
        metadata: {
          capaNumber: capa.capaNumber,
          verificationPassed: validatedData.verificationPassed,
          effectivenessScore: validatedData.effectivenessScore,
        },
      },
    });

    return NextResponse.json({
      success: true,
      capa,
      message: validatedData.verificationPassed
        ? "CAPA effectiveness verified"
        : "CAPA ineffective - re-CAPA triggered",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error verifying effectiveness:", error);
    return NextResponse.json(
      { error: "Failed to record verification" },
      { status: 500 }
    );
  }
}

/**
 * Analyze effectiveness of a closed CAPA
 */
async function analyzeEffectiveness(
  organizationId: string,
  capa: any
): Promise<EffectivenessMetrics> {
  const now = new Date();
  const closedDate = new Date(capa.closedDate || capa.createdAt);
  const monitoringDays = Math.floor(
    (now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check for recurrence: Look for similar NCRs after CAPA closure
  const relatedNCRs = await prisma.nonConformanceReport.count({
    where: {
      organizationId,
      reportDate: {
        gte: closedDate,
      },
      // Check for similar problem descriptions
      OR: [
        {
          title: {
            contains: extractKeywords(capa.problemStatement)[0],
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: extractKeywords(capa.problemStatement)[0],
            mode: "insensitive",
          },
        },
      ],
    },
  });

  const recurrenceDetected = relatedNCRs > 0;

  // Determine verification status
  let verificationStatus: "PENDING" | "PASSED" | "FAILED" = "PENDING";
  if (capa.verificationPassed === true) {
    verificationStatus = "PASSED";
  } else if (capa.verificationPassed === false) {
    verificationStatus = "FAILED";
  }

  // Calculate effectiveness score if not already set
  let effectivenessScore = capa.effectivenessScore || 0;
  if (!effectivenessScore && verificationStatus === "PENDING") {
    effectivenessScore = calculateEffectivenessScore(
      recurrenceDetected,
      relatedNCRs,
      monitoringDays
    );
  }

  // Generate recommendation
  const recommendation = generateRecommendation(
    recurrenceDetected,
    effectivenessScore,
    verificationStatus,
    monitoringDays
  );

  return {
    capaId: capa.id,
    capaNumber: capa.capaNumber,
    closedDate: capa.closedDate?.toISOString() || capa.createdAt.toISOString(),
    monitoringDays,
    recurrenceDetected,
    effectivenessScore,
    verificationStatus,
    relatedIncidents: relatedNCRs,
    recommendation,
  };
}

/**
 * Calculate effectiveness score based on monitoring data
 */
function calculateEffectivenessScore(
  recurrenceDetected: boolean,
  relatedIncidents: number,
  monitoringDays: number
): number {
  let score = 100;

  // Deduct points for recurrence
  if (recurrenceDetected) {
    score -= 30; // Base penalty for any recurrence
    score -= Math.min(relatedIncidents * 10, 40); // Additional penalty per incident
  }

  // Bonus for longer monitoring period without issues
  if (!recurrenceDetected && monitoringDays > 30) {
    score = Math.min(score + 10, 100);
  }

  return Math.max(score, 0);
}

/**
 * Generate recommendation based on analysis
 */
function generateRecommendation(
  recurrenceDetected: boolean,
  effectivenessScore: number,
  verificationStatus: string,
  monitoringDays: number
): string {
  if (recurrenceDetected) {
    return "⚠️ Issue recurrence detected - Re-CAPA required";
  }

  if (effectivenessScore < 70) {
    return "⚠️ Low effectiveness score - Conduct verification review";
  }

  if (verificationStatus === "PENDING" && monitoringDays > 30) {
    return "📋 Ready for effectiveness verification";
  }

  if (verificationStatus === "PASSED") {
    return "✅ CAPA verified effective - Continue monitoring";
  }

  if (verificationStatus === "FAILED") {
    return "❌ CAPA failed verification - Re-CAPA triggered";
  }

  return "📊 Continue monitoring for effectiveness";
}

/**
 * Trigger a re-CAPA when original CAPA fails
 */
async function triggerReCAPA(
  organizationId: string,
  originalCAPA: any,
  userId: string,
  reason: string
) {
  // Generate new CAPA number
  const lastCAPA = await prisma.correctivePreventiveAction.findFirst({
    where: { organizationId },
    orderBy: { capaNumber: "desc" },
    select: { capaNumber: true },
  });

  const lastNumber = lastCAPA?.capaNumber
    ? parseInt(lastCAPA.capaNumber.replace(/\D/g, ""))
    : 0;
  const capaNumber = `CAPA-RE${String(lastNumber + 1).padStart(6, "0")}`;

  // Create re-CAPA
  await prisma.correctivePreventiveAction.create({
    data: {
      capaNumber,
      organizationId,
      capaType: "CORRECTIVE",
      actionCategory: originalCAPA.actionCategory,
      sourceType: "RE_CAPA",
      sourceId: originalCAPA.id,
      ncrId: originalCAPA.ncrId,
      problemStatement: `Re-CAPA: Original CAPA ${originalCAPA.capaNumber} was ineffective. ${reason}`,
      problemSeverity: "HIGH",
      rootCauseMethod: "5_WHYS",
      rootCauseAnalysis: {
        originalCAPA: originalCAPA.capaNumber,
        reason,
        previousRootCause: originalCAPA.rootCause,
      } as any,
      rootCause: `Original CAPA failed - deeper root cause analysis required`,
      immediateActions: [],
      correctiveActions: [],
      preventiveActions: [],
      responsiblePerson: originalCAPA.responsiblePerson,
      targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      priority: "HIGH",
      status: "OPEN",
      createdBy: userId,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      organizationId,
      userId,
      action: "RE_CAPA_TRIGGERED",
      entityType: "CAPA",
      entityId: originalCAPA.id,
      metadata: {
        originalCAPA: originalCAPA.capaNumber,
        newCAPA: capaNumber,
        reason,
      },
    },
  });
}

/**
 * Calculate aggregate statistics
 */
function calculateAggregateStats(data: EffectivenessMetrics[]) {
  const total = data.length;
  const verified = data.filter((d) => d.verificationStatus === "PASSED").length;
  const failed = data.filter((d) => d.verificationStatus === "FAILED").length;
  const pending = data.filter((d) => d.verificationStatus === "PENDING").length;
  const recurrences = data.filter((d) => d.recurrenceDetected).length;

  const avgEffectiveness =
    total > 0
      ? data.reduce((sum, d) => sum + d.effectivenessScore, 0) / total
      : 0;

  return {
    totalCAPAs: total,
    verifiedEffective: verified,
    verifiedIneffective: failed,
    pendingVerification: pending,
    recurrencesDetected: recurrences,
    avgEffectivenessScore: Math.round(avgEffectiveness),
    effectivenessRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    recurrenceRate: total > 0 ? Math.round((recurrences / total) * 100) : 0,
  };
}

/**
 * Extract keywords from problem statement
 */
function extractKeywords(statement: string): string[] {
  return statement
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 3);
}
