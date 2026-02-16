import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 16: AUTOMATED CLOSURE VERIFICATION
// ============================================
// AI-powered verification that CAPAs meet closure criteria
// Prevents premature closure, ensures completeness
// Automated checklist validation

// Verify Closure Schema
const verifyClosureSchema = z.object({
  capaId: z.string(),
  requestedBy: z.string().optional(),
});

// Override Check Schema
const overrideCheckSchema = z.object({
  verificationId: z.string(),
  checkId: z.string(),
  overrideReason: z.string(),
});

// ============================================
// CLOSURE CRITERIA CHECKLIST
// ============================================

interface ClosureCheck {
  id: string;
  category: string;
  requirement: string;
  critical: boolean; // If true, MUST pass to close
  description: string;
}

const CLOSURE_CRITERIA: ClosureCheck[] = [
  // Investigation Checks
  {
    id: "ROOT_CAUSE_IDENTIFIED",
    category: "Investigation",
    requirement: "Root cause identified",
    critical: true,
    description:
      "Root cause analysis must be completed using 5-Whys, Fishbone, or similar method",
  },
  {
    id: "ROOT_CAUSE_VERIFIED",
    category: "Investigation",
    requirement: "Root cause verified",
    critical: true,
    description: "Root cause must be verified by quality manager or supervisor",
  },

  // Actions Checks
  {
    id: "CORRECTIVE_ACTIONS_DEFINED",
    category: "Actions",
    requirement: "Corrective actions defined",
    critical: true,
    description: "At least one corrective action must be documented",
  },
  {
    id: "ACTIONS_IMPLEMENTED",
    category: "Actions",
    requirement: "All actions implemented",
    critical: true,
    description:
      "All corrective and preventive actions must be marked as implemented",
  },
  {
    id: "IMPLEMENTATION_EVIDENCE",
    category: "Actions",
    requirement: "Implementation evidence attached",
    critical: false,
    description:
      "Photos, documents, or records proving actions were implemented",
  },

  // Effectiveness Checks
  {
    id: "EFFECTIVENESS_VERIFIED",
    category: "Effectiveness",
    requirement: "Effectiveness verified",
    critical: true,
    description:
      "Effectiveness check must be completed and show positive results",
  },
  {
    id: "SUFFICIENT_OBSERVATION_PERIOD",
    category: "Effectiveness",
    requirement: "Sufficient observation period",
    critical: true,
    description:
      "At least 30 days since action implementation (or justified shorter period)",
  },
  {
    id: "NO_RECURRENCE",
    category: "Effectiveness",
    requirement: "No recurrence detected",
    critical: true,
    description: "No new NCRs of the same type during observation period",
  },

  // Training Checks
  {
    id: "TRAINING_COMPLETED",
    category: "Training",
    requirement: "Required training completed",
    critical: true,
    description:
      "All users enrolled in CAPA training must have completed and passed",
  },
  {
    id: "TRAINING_EFFECTIVENESS",
    category: "Training",
    requirement: "Training effectiveness verified",
    critical: false,
    description: "30-day effectiveness check shows employees applying training",
  },

  // Documentation Checks
  {
    id: "DOCUMENTS_ATTACHED",
    category: "Documentation",
    requirement: "Supporting documents attached",
    critical: false,
    description: "At least 3 documents attached (reports, photos, forms, etc.)",
  },
  {
    id: "PROCEDURES_UPDATED",
    category: "Documentation",
    requirement: "Procedures updated",
    critical: false,
    description: "If process changes were made, SOPs/WIs must be updated",
  },

  // Approval Checks
  {
    id: "MANAGEMENT_APPROVAL",
    category: "Approval",
    requirement: "Management approval obtained",
    critical: true,
    description: "Quality manager or higher must approve closure",
  },

  // Customer Impact Checks
  {
    id: "CUSTOMER_IMPACT_RESOLVED",
    category: "Customer Impact",
    requirement: "Customer impacts resolved",
    critical: true,
    description:
      "If customers were affected, all notifications sent and responses received",
  },
];

// ============================================
// GET: Retrieve verification status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const capaId = searchParams.get("capaId");
    const verificationId = searchParams.get("verificationId");
    const status = searchParams.get("status");

    // Get specific verification
    if (verificationId) {
      const verification = await prisma.closureVerification.findUnique({
        where: { id: verificationId },
        include: {
          capa: {
            select: {
              capaNumber: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return NextResponse.json({ verification });
    }

    // Get CAPA's latest verification
    if (capaId) {
      const verification = await prisma.closureVerification.findFirst({
        where: { capaId },
        orderBy: { verifiedAt: "desc" },
      });

      return NextResponse.json({ verification });
    }

    // Get all verifications
    const where: any = {
      capa: {
        organizationId: session.user.organizationId,
      },
    };

    if (status) {
      where.overallStatus = status;
    }

    const verifications = await prisma.closureVerification.findMany({
      where,
      include: {
        capa: {
          select: {
            capaNumber: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { verifiedAt: "desc" },
      take: 100,
    });

    // Statistics
    const stats = {
      totalVerifications: verifications.length,
      approved: verifications.filter((v) => v.overallStatus === "APPROVED")
        .length,
      rejected: verifications.filter((v) => v.overallStatus === "REJECTED")
        .length,
      needsReview: verifications.filter(
        (v) => v.overallStatus === "NEEDS_REVIEW",
      ).length,
      averageScore:
        verifications.length > 0
          ? Math.round(
              verifications.reduce(
                (sum, v) => sum + (v.completionScore || 0),
                0,
              ) / verifications.length,
            )
          : 0,
    };

    return NextResponse.json({ verifications, stats });
  } catch (error) {
    console.error("Closure verification GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verification data" },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Verify CAPA closure readiness
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ==========================================
    // ACTION: VERIFY_CLOSURE_READINESS
    // ==========================================
    if (action === "VERIFY_CLOSURE_READINESS") {
      const data = verifyClosureSchema.parse(body);

      // Get CAPA with all related data
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: data.capaId,
          organizationId: session.user.organizationId,
        },
        include: {
          ncr: true,
          capaTrainingRequirements: {
            include: {
              enrollments: {
                include: {
                  completion: true,
                  effectivenessCheck: true,
                },
              },
            },
          },
          customerImpacts: {
            include: {
              notifications: true,
            },
          },
          riskAssessment: true,
        },
      });

      if (!capa) {
        return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
      }

      // Run all checks
      const checkResults: any[] = [];
      let criticalFailures = 0;
      let totalPassed = 0;
      let totalFailed = 0;

      for (const criterion of CLOSURE_CRITERIA) {
        const result = await performClosureCheck(capa, criterion);
        checkResults.push(result);

        if (result.passed) {
          totalPassed++;
        } else {
          totalFailed++;
          if (criterion.critical) {
            criticalFailures++;
          }
        }
      }

      // Calculate completion score
      const completionScore = Math.round(
        (totalPassed / CLOSURE_CRITERIA.length) * 100,
      );

      // Determine overall status
      let overallStatus = "APPROVED";
      let statusReason = "All critical closure criteria met";

      if (criticalFailures > 0) {
        overallStatus = "REJECTED";
        statusReason = `${criticalFailures} critical criteria failed. CAPA cannot be closed.`;
      } else if (completionScore < 70) {
        overallStatus = "NEEDS_REVIEW";
        statusReason =
          "Some optional criteria not met. Manager review recommended.";
      }

      // Create verification record
      const verification = await prisma.closureVerification.create({
        data: {
          capaId: data.capaId,
          checkResults: checkResults,
          totalChecks: CLOSURE_CRITERIA.length,
          checksPassedCount: totalPassed,
          checksFailedCount: totalFailed,
          criticalFailuresCount: criticalFailures,
          completionScore,
          overallStatus,
          statusReason,
          verifiedBy: data.requestedBy || session.user.id,
          verifiedAt: new Date(),
        },
      });

      // If approved, update CAPA status to ready for closure
      if (overallStatus === "APPROVED") {
        await prisma.correctivePreventiveAction.update({
          where: { id: data.capaId },
          data: {
            closureApproved: true,
            closureApprovedBy: session.user.id,
            closureApprovedDate: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        verification,
        overallStatus,
        completionScore,
        criticalFailures,
        checkResults: checkResults.filter((r) => !r.passed), // Return only failures
        canClose: overallStatus === "APPROVED",
        message: statusReason,
      });
    }

    // ==========================================
    // ACTION: OVERRIDE_CHECK
    // ==========================================
    if (action === "OVERRIDE_CHECK") {
      const data = overrideCheckSchema.parse(body);

      // Get verification
      const verification = await prisma.closureVerification.findUnique({
        where: { id: data.verificationId },
      });

      if (!verification) {
        return NextResponse.json(
          { error: "Verification not found" },
          { status: 404 },
        );
      }

      // Update check result with override
      const checkResults = verification.checkResults as any[];
      const checkIndex = checkResults.findIndex((c) => c.id === data.checkId);

      if (checkIndex === -1) {
        return NextResponse.json({ error: "Check not found" }, { status: 404 });
      }

      checkResults[checkIndex].overridden = true;
      checkResults[checkIndex].overrideReason = data.overrideReason;
      checkResults[checkIndex].overriddenBy = session.user.id;
      checkResults[checkIndex].overriddenAt = new Date().toISOString();

      // Recalculate scores
      const totalPassed = checkResults.filter(
        (c) => c.passed || c.overridden,
      ).length;
      const completionScore = Math.round(
        (totalPassed / checkResults.length) * 100,
      );
      const criticalFailures = checkResults.filter(
        (c) => c.critical && !c.passed && !c.overridden,
      ).length;

      let overallStatus = verification.overallStatus;
      if (criticalFailures === 0 && completionScore >= 70) {
        overallStatus = "APPROVED";
      }

      // Update verification
      const updated = await prisma.closureVerification.update({
        where: { id: data.verificationId },
        data: {
          checkResults,
          checksPassedCount: totalPassed,
          completionScore,
          criticalFailuresCount: criticalFailures,
          overallStatus,
        },
      });

      return NextResponse.json({
        success: true,
        verification: updated,
        message: "Check overridden. Verification updated.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Closure verification POST error:", error);
    return NextResponse.json(
      { error: "Failed to process closure verification" },
      { status: 500 },
    );
  }
}

// ============================================
// Helper: Perform individual closure check
// ============================================

async function performClosureCheck(capa: any, criterion: ClosureCheck) {
  let passed = false;
  let evidence = "";
  let recommendation = "";

  switch (criterion.id) {
    case "ROOT_CAUSE_IDENTIFIED":
      passed = !!(
        capa.rootCauseAnalysis && capa.rootCauseAnalysis.trim().length > 50
      );
      evidence = passed
        ? "Root cause analysis documented"
        : "No root cause analysis found";
      recommendation = !passed
        ? "Complete root cause analysis using 5-Whys, Fishbone, or similar method"
        : "";
      break;

    case "ROOT_CAUSE_VERIFIED":
      passed = !!capa.rootCauseVerified;
      evidence = passed
        ? "Root cause verified by supervisor"
        : "Root cause not verified";
      recommendation = !passed
        ? "Have quality manager verify root cause analysis"
        : "";
      break;

    case "CORRECTIVE_ACTIONS_DEFINED":
      const hasCorrectiveActions =
        capa.correctiveActions &&
        Array.isArray(JSON.parse(capa.correctiveActions)) &&
        JSON.parse(capa.correctiveActions).length > 0;
      passed = hasCorrectiveActions;
      evidence = passed
        ? `${JSON.parse(capa.correctiveActions || "[]").length} corrective actions defined`
        : "No corrective actions defined";
      recommendation = !passed
        ? "Define at least one corrective action to address root cause"
        : "";
      break;

    case "ACTIONS_IMPLEMENTED":
      const actions = JSON.parse(capa.correctiveActions || "[]");
      const allImplemented =
        actions.length > 0 &&
        actions.every((a: any) => a.status === "COMPLETED");
      passed = allImplemented;
      evidence = passed
        ? "All actions marked as implemented"
        : `${actions.filter((a: any) => a.status !== "COMPLETED").length} actions pending`;
      recommendation = !passed
        ? "Complete implementation of all corrective and preventive actions"
        : "";
      break;

    case "IMPLEMENTATION_EVIDENCE":
      passed = !!(
        capa.documents &&
        Array.isArray(JSON.parse(capa.documents)) &&
        JSON.parse(capa.documents).length >= 2
      );
      evidence = passed
        ? `${JSON.parse(capa.documents || "[]").length} documents attached`
        : "Insufficient documentation";
      recommendation = !passed
        ? "Attach photos, reports, or forms showing action implementation"
        : "";
      break;

    case "EFFECTIVENESS_VERIFIED":
      passed = !!(
        capa.effectivenessVerified &&
        capa.effectivenessScore &&
        capa.effectivenessScore >= 80
      );
      evidence = passed
        ? `Effectiveness verified at ${capa.effectivenessScore}%`
        : "Effectiveness not verified";
      recommendation = !passed
        ? "Complete effectiveness check after sufficient observation period"
        : "";
      break;

    case "SUFFICIENT_OBSERVATION_PERIOD":
      if (capa.effectivenessCheckDate) {
        const daysSinceImplementation = Math.floor(
          (new Date(capa.effectivenessCheckDate).getTime() -
            new Date(capa.targetCompletionDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        passed = daysSinceImplementation >= 30;
        evidence = `${daysSinceImplementation} days observation period`;
        recommendation = !passed
          ? "Wait for 30-day observation period before closing"
          : "";
      } else {
        passed = false;
        evidence = "No effectiveness check date recorded";
        recommendation = "Complete effectiveness check with observation period";
      }
      break;

    case "NO_RECURRENCE":
      // Check for new NCRs of same defect type in last 30 days
      if (capa.ncr) {
        const recentNCRs = await prisma.nonConformanceReport.count({
          where: {
            organizationId: capa.organizationId,
            defectType: capa.ncr.defectType,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            id: { not: capa.ncrId },
          },
        });
        passed = recentNCRs === 0;
        evidence = passed
          ? "No recurrence detected"
          : `${recentNCRs} similar NCRs in last 30 days`;
        recommendation = !passed
          ? "Investigate why defect is recurring. Root cause may be incorrect."
          : "";
      } else {
        passed = true;
        evidence = "No linked NCR to check recurrence";
      }
      break;

    case "TRAINING_COMPLETED":
      const trainingReqs = capa.capaTrainingRequirements || [];
      if (trainingReqs.length === 0) {
        passed = true;
        evidence = "No training requirements";
      } else {
        const allCompleted = trainingReqs.every((req: any) =>
          req.enrollments.every((enr: any) => enr.status === "VERIFIED"),
        );
        passed = allCompleted;
        const totalEnrollments = trainingReqs.reduce(
          (sum: number, req: any) => sum + req.enrollments.length,
          0,
        );
        const completedEnrollments = trainingReqs.reduce(
          (sum: number, req: any) =>
            sum +
            req.enrollments.filter((e: any) => e.status === "VERIFIED").length,
          0,
        );
        evidence = `${completedEnrollments}/${totalEnrollments} training enrollments verified`;
        recommendation = !passed
          ? "Ensure all required training is completed and effectiveness verified"
          : "";
      }
      break;

    case "TRAINING_EFFECTIVENESS":
      const hasEffectiveness = capa.capaTrainingRequirements?.some((req: any) =>
        req.enrollments.some(
          (enr: any) =>
            enr.effectivenessCheck?.performanceRating === "EXCELLENT",
        ),
      );
      passed = hasEffectiveness || capa.capaTrainingRequirements?.length === 0;
      evidence = passed
        ? "Training effectiveness verified"
        : "No effectiveness checks completed";
      recommendation = !passed
        ? "Verify training effectiveness through on-job observation"
        : "";
      break;

    case "DOCUMENTS_ATTACHED":
      const docCount = JSON.parse(capa.documents || "[]").length;
      passed = docCount >= 3;
      evidence = `${docCount} documents attached`;
      recommendation = !passed
        ? "Attach reports, photos, updated procedures, or test results"
        : "";
      break;

    case "PROCEDURES_UPDATED":
      passed = !!(
        capa.updatedProcedures && JSON.parse(capa.updatedProcedures).length > 0
      );
      evidence = passed
        ? "Procedures updated and documented"
        : "No procedure updates documented";
      recommendation = !passed
        ? "Update SOPs/WIs if process changes were made"
        : "";
      break;

    case "MANAGEMENT_APPROVAL":
      passed = !!capa.closureApprovedBy;
      evidence = passed
        ? "Closure approved by management"
        : "No management approval";
      recommendation = !passed
        ? "Request closure approval from quality manager"
        : "";
      break;

    case "CUSTOMER_IMPACT_RESOLVED":
      const impacts = capa.customerImpacts || [];
      if (impacts.length === 0) {
        passed = true;
        evidence = "No customer impacts";
      } else {
        const allNotified = impacts.every(
          (imp: any) => imp.notificationStatus === "SENT",
        );
        passed = allNotified;
        evidence = passed
          ? `All ${impacts.length} customers notified`
          : "Customer notifications pending";
        recommendation = !passed
          ? "Send notifications to all affected customers"
          : "";
      }
      break;

    default:
      passed = false;
      evidence = "Check not implemented";
  }

  return {
    id: criterion.id,
    category: criterion.category,
    requirement: criterion.requirement,
    critical: criterion.critical,
    passed,
    evidence,
    recommendation,
    description: criterion.description,
  };
}
