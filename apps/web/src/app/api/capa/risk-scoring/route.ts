import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 13: CAPA RISK SCORING (RPN)
// ============================================
// Calculate Risk Priority Number (RPN) = Severity × Occurrence × Detection
// Auto-prioritize CAPAs based on risk score
// Optimize resource allocation to highest-risk items
// FMEA-based risk assessment methodology

// RPN Calculation Schema
const rpnCalculationSchema = z.object({
  capaId: z.string(),
  severity: z.number().min(1).max(10),
  occurrence: z.number().min(1).max(10),
  detection: z.number().min(1).max(10),
  notes: z.string().optional(),
});

// Risk Assessment Update Schema
const riskUpdateSchema = z.object({
  assessmentId: z.string(),
  postActionSeverity: z.number().min(1).max(10).optional(),
  postActionOccurrence: z.number().min(1).max(10).optional(),
  postActionDetection: z.number().min(1).max(10).optional(),
  effectivenessNotes: z.string().optional(),
});

// ============================================
// RPN Scoring Guide (FMEA Methodology)
// ============================================

const SEVERITY_GUIDE = {
  10: {
    level: "Catastrophic",
    description: "Death or serious injury, FDA recall, litigation",
  },
  9: {
    level: "Critical",
    description: "Serious injury, product recall, major regulatory action",
  },
  8: {
    level: "Very High",
    description: "Injury, customer complaint, regulatory warning",
  },
  7: {
    level: "High",
    description: "Major impact on product function, customer dissatisfaction",
  },
  6: {
    level: "Moderate-High",
    description: "Significant impact on product performance",
  },
  5: {
    level: "Moderate",
    description: "Noticeable impact on performance, minor customer complaint",
  },
  4: { level: "Low-Moderate", description: "Minor impact on performance" },
  3: {
    level: "Low",
    description: "Very minor impact, customer may not notice",
  },
  2: { level: "Very Low", description: "Negligible impact" },
  1: { level: "None", description: "No impact" },
};

const OCCURRENCE_GUIDE = {
  10: {
    level: "Very High",
    description: "Almost certain (≥1 in 2)",
    frequency: "≥50%",
  },
  9: { level: "High", description: "Very frequent (1 in 3)", frequency: "33%" },
  8: { level: "High", description: "Frequent (1 in 8)", frequency: "12.5%" },
  7: {
    level: "Moderate-High",
    description: "Moderately high (1 in 20)",
    frequency: "5%",
  },
  6: {
    level: "Moderate",
    description: "Moderate (1 in 80)",
    frequency: "1.25%",
  },
  5: {
    level: "Moderate",
    description: "Moderate (1 in 400)",
    frequency: "0.25%",
  },
  4: {
    level: "Low-Moderate",
    description: "Low (1 in 2,000)",
    frequency: "0.05%",
  },
  3: { level: "Low", description: "Low (1 in 15,000)", frequency: "0.007%" },
  2: {
    level: "Very Low",
    description: "Very rare (1 in 150,000)",
    frequency: "0.0007%",
  },
  1: {
    level: "Remote",
    description: "Nearly impossible (≤1 in 1,500,000)",
    frequency: "≤0.00007%",
  },
};

const DETECTION_GUIDE = {
  10: {
    level: "Absolute Uncertainty",
    description: "No detection method exists",
  },
  9: { level: "Very Remote", description: "Very remote chance of detection" },
  8: { level: "Remote", description: "Remote chance of detection" },
  7: { level: "Very Low", description: "Very low chance of detection" },
  6: { level: "Low", description: "Low chance of detection" },
  5: { level: "Moderate", description: "Moderate chance of detection" },
  4: {
    level: "Moderately High",
    description: "Moderately high chance of detection",
  },
  3: { level: "High", description: "High chance of detection" },
  2: { level: "Very High", description: "Very high chance of detection" },
  1: { level: "Almost Certain", description: "Detection is almost certain" },
};

// ============================================
// GET: Retrieve risk scores and prioritization
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const capaId = searchParams.get("capaId");
    const riskLevel = searchParams.get("riskLevel"); // CRITICAL, HIGH, MEDIUM, LOW
    const sortBy = searchParams.get("sortBy") || "rpn"; // rpn, severity, capaNumber
    const assessmentId = searchParams.get("assessmentId");

    // Get specific assessment
    if (assessmentId) {
      const assessment = await prisma.riskPriorityAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          capa: {
            select: {
              capaNumber: true,
              title: true,
              description: true,
              status: true,
            },
          },
        },
      });

      return NextResponse.json({ assessment });
    }

    // Build query
    const where: any = {
      capa: {
        organizationId: session.user.organizationId,
      },
    };

    if (capaId) {
      where.capaId = capaId;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    // Get all assessments
    const assessments = await prisma.riskPriorityAssessment.findMany({
      where,
      include: {
        capa: {
          select: {
            capaNumber: true,
            title: true,
            description: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy:
        sortBy === "rpn"
          ? { initialRPN: "desc" }
          : sortBy === "severity"
            ? { severity: "desc" }
            : { createdAt: "desc" },
    });

    // Calculate statistics
    const stats = {
      totalAssessments: assessments.length,
      criticalRisk: assessments.filter((a) => a.riskLevel === "CRITICAL")
        .length,
      highRisk: assessments.filter((a) => a.riskLevel === "HIGH").length,
      mediumRisk: assessments.filter((a) => a.riskLevel === "MEDIUM").length,
      lowRisk: assessments.filter((a) => a.riskLevel === "LOW").length,
      averageRPN:
        assessments.length > 0
          ? Math.round(
              assessments.reduce((sum, a) => sum + a.initialRPN, 0) /
                assessments.length,
            )
          : 0,
      riskReduced: assessments.filter(
        (a) => a.postActionRPN && a.postActionRPN < a.initialRPN,
      ).length,
      averageReduction: calculateAverageReduction(assessments),
    };

    return NextResponse.json({ assessments, stats });
  } catch (error) {
    console.error("RPN GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve risk scores" },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Calculate RPN, update scores
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
    // ACTION: CALCULATE_RPN
    // ==========================================
    if (action === "CALCULATE_RPN") {
      const data = rpnCalculationSchema.parse(body);

      // Validate CAPA exists
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: data.capaId,
          organizationId: session.user.organizationId,
        },
      });

      if (!capa) {
        return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
      }

      // Calculate RPN
      const rpn = data.severity * data.occurrence * data.detection;

      // Determine risk level
      let riskLevel = "LOW";
      if (rpn >= 200) {
        riskLevel = "CRITICAL";
      } else if (rpn >= 100) {
        riskLevel = "HIGH";
      } else if (rpn >= 50) {
        riskLevel = "MEDIUM";
      }

      // Auto-adjust CAPA priority based on risk level
      let suggestedPriority = capa.priority;
      if (riskLevel === "CRITICAL" && capa.priority !== "CRITICAL") {
        suggestedPriority = "CRITICAL";
      } else if (
        riskLevel === "HIGH" &&
        (capa.priority === "MEDIUM" || capa.priority === "LOW")
      ) {
        suggestedPriority = "HIGH";
      }

      // Create or update risk assessment
      const existingAssessment = await prisma.riskPriorityAssessment.findFirst({
        where: { capaId: data.capaId },
      });

      let assessment;
      if (existingAssessment) {
        assessment = await prisma.riskPriorityAssessment.update({
          where: { id: existingAssessment.id },
          data: {
            severity: data.severity,
            occurrence: data.occurrence,
            detection: data.detection,
            initialRPN: rpn,
            riskLevel,
            notes: data.notes,
            assessedBy: session.user.id,
            assessedAt: new Date(),
          },
        });
      } else {
        assessment = await prisma.riskPriorityAssessment.create({
          data: {
            capaId: data.capaId,
            severity: data.severity,
            occurrence: data.occurrence,
            detection: data.detection,
            initialRPN: rpn,
            riskLevel,
            notes: data.notes,
            assessedBy: session.user.id,
            assessedAt: new Date(),
          },
        });
      }

      // Update CAPA priority if needed
      if (suggestedPriority !== capa.priority) {
        await prisma.correctivePreventiveAction.update({
          where: { id: data.capaId },
          data: { priority: suggestedPriority as any },
        });
      }

      return NextResponse.json({
        success: true,
        assessment,
        rpn,
        riskLevel,
        priorityChanged: suggestedPriority !== capa.priority,
        oldPriority: capa.priority,
        newPriority: suggestedPriority,
        recommendations: generateRPNRecommendations(
          data.severity,
          data.occurrence,
          data.detection,
          rpn,
        ),
      });
    }

    // ==========================================
    // ACTION: UPDATE_POST_ACTION_RPN
    // ==========================================
    if (action === "UPDATE_POST_ACTION_RPN") {
      const data = riskUpdateSchema.parse(body);

      const assessment = await prisma.riskPriorityAssessment.findUnique({
        where: { id: data.assessmentId },
      });

      if (!assessment) {
        return NextResponse.json(
          { error: "Risk assessment not found" },
          { status: 404 },
        );
      }

      // Calculate new RPN
      const postSeverity = data.postActionSeverity ?? assessment.severity;
      const postOccurrence = data.postActionOccurrence ?? assessment.occurrence;
      const postDetection = data.postActionDetection ?? assessment.detection;
      const postRPN = postSeverity * postOccurrence * postDetection;

      // Calculate reduction
      const riskReduction = assessment.initialRPN - postRPN;
      const reductionPercent = Math.round(
        (riskReduction / assessment.initialRPN) * 100,
      );

      // Update assessment
      const updated = await prisma.riskPriorityAssessment.update({
        where: { id: data.assessmentId },
        data: {
          postActionSeverity: postSeverity,
          postActionOccurrence: postOccurrence,
          postActionDetection: postDetection,
          postActionRPN: postRPN,
          riskReduction,
          reductionPercent,
          effectivenessNotes: data.effectivenessNotes,
          reassessedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        assessment: updated,
        postRPN,
        riskReduction,
        reductionPercent,
        effectiveness:
          reductionPercent >= 50
            ? "HIGHLY_EFFECTIVE"
            : reductionPercent >= 25
              ? "EFFECTIVE"
              : reductionPercent > 0
                ? "SOMEWHAT_EFFECTIVE"
                : "NOT_EFFECTIVE",
        message: `Risk reduced by ${reductionPercent}% (${assessment.initialRPN} → ${postRPN})`,
      });
    }

    // ==========================================
    // ACTION: AUTO_PRIORITIZE_CAPAS
    // ==========================================
    if (action === "AUTO_PRIORITIZE_CAPAS") {
      // Get all CAPAs without risk assessments
      const capasWithoutRPN = await prisma.correctivePreventiveAction.findMany({
        where: {
          organizationId: session.user.organizationId,
          status: { in: ["OPEN", "IN_PROGRESS", "UNDER_REVIEW"] },
          riskAssessment: null,
        },
        include: {
          ncr: true,
        },
      });

      // Auto-calculate RPN based on CAPA severity and NCR data
      const assessments = await Promise.all(
        capasWithoutRPN.map(async (capa) => {
          // Default scoring based on existing priority
          let severity = 5;
          if (capa.severity === "CRITICAL") severity = 10;
          else if (capa.severity === "HIGH") severity = 7;
          else if (capa.severity === "MEDIUM") severity = 5;
          else severity = 3;

          // Estimate occurrence based on historical data (simplified)
          const occurrence = 5; // Default moderate

          // Estimate detection based on when defect was found
          let detection = 5;
          if (capa.ncr?.detectionStage === "RECEIVING")
            detection = 3; // Caught early
          else if (capa.ncr?.detectionStage === "IN_PROCESS") detection = 5;
          else if (capa.ncr?.detectionStage === "FINAL_INSPECTION")
            detection = 7;
          else if (capa.ncr?.detectionStage === "CUSTOMER") detection = 9; // Caught late

          const rpn = severity * occurrence * detection;
          let riskLevel = "LOW";
          if (rpn >= 200) riskLevel = "CRITICAL";
          else if (rpn >= 100) riskLevel = "HIGH";
          else if (rpn >= 50) riskLevel = "MEDIUM";

          return prisma.riskPriorityAssessment.create({
            data: {
              capaId: capa.id,
              severity,
              occurrence,
              detection,
              initialRPN: rpn,
              riskLevel,
              notes:
                "Auto-calculated based on CAPA severity and detection stage",
              assessedBy: session.user.id,
              assessedAt: new Date(),
            },
          });
        }),
      );

      return NextResponse.json({
        success: true,
        message: `Auto-prioritized ${assessments.length} CAPAs`,
        assessmentsCreated: assessments.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("RPN POST error:", error);
    return NextResponse.json(
      { error: "Failed to process risk scoring action" },
      { status: 500 },
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateAverageReduction(assessments: any[]) {
  const withReduction = assessments.filter((a) => a.reductionPercent !== null);
  if (withReduction.length === 0) return 0;

  const total = withReduction.reduce(
    (sum, a) => sum + (a.reductionPercent || 0),
    0,
  );
  return Math.round(total / withReduction.length);
}

function generateRPNRecommendations(
  severity: number,
  occurrence: number,
  detection: number,
  rpn: number,
) {
  const recommendations = [];

  // Severity recommendations
  if (severity >= 8) {
    recommendations.push({
      factor: "SEVERITY",
      priority: "CRITICAL",
      action: "Implement design changes to reduce failure impact",
      note: "High severity requires immediate attention - cannot be easily reduced through process changes alone",
    });
  }

  // Occurrence recommendations
  if (occurrence >= 7) {
    recommendations.push({
      factor: "OCCURRENCE",
      priority: "HIGH",
      action:
        "Implement preventive controls, improve process capability, add error-proofing (poka-yoke)",
      note: "High occurrence indicates systemic issue - focus on prevention",
    });
  }

  // Detection recommendations
  if (detection >= 7) {
    recommendations.push({
      factor: "DETECTION",
      priority: "HIGH",
      action:
        "Improve inspection methods, add automated checks, implement 100% inspection if needed",
      note: "Poor detection - defects reaching customers. Enhance quality checks immediately.",
    });
  }

  // Overall RPN recommendations
  if (rpn >= 200) {
    recommendations.push({
      factor: "RPN",
      priority: "CRITICAL",
      action:
        "STOP production if possible. Implement immediate containment. Assign dedicated team to resolve.",
      note: "Critical risk level - requires immediate executive attention",
    });
  } else if (rpn >= 100) {
    recommendations.push({
      factor: "RPN",
      priority: "HIGH",
      action:
        "Prioritize resources, set aggressive timeline, daily status reviews",
      note: "High risk - management oversight required",
    });
  }

  return recommendations;
}
