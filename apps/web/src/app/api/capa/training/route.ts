import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 10: TRAINING MANAGEMENT INTEGRATION
// ============================================
// Automatically trigger training workflows when CAPAs identify training needs.
// Employees cannot close CAPAs until required training is completed and verified.
// Tracks training effectiveness through ongoing monitoring.

// Training Requirement Schema
const trainingRequirementSchema = z.object({
  capaId: z.string(),
  trainingType: z.enum(["INITIAL", "REFRESHER", "REMEDIAL", "COMPETENCY"]),
  trainingTopic: z.string(),
  justification: z.string(),
  targetAudience: z.string(), // ROLE, DEPARTMENT, or INDIVIDUAL
  targetRoleId: z.string().optional(),
  targetDepartment: z.string().optional(),
  targetUserId: z.string().optional(),
  dueDate: z.string().datetime(),
  competencyRequired: z.boolean().default(true),
  minimumScore: z.number().min(0).max(100).default(80),
});

// Training Enrollment Schema
const enrollmentSchema = z.object({
  requirementId: z.string(),
  userId: z.string(),
  enrollmentDate: z.string().datetime().optional(),
  autoEnrolled: z.boolean().default(false),
});

// Training Completion Schema
const completionSchema = z.object({
  enrollmentId: z.string(),
  completionDate: z.string().datetime(),
  score: z.number().min(0).max(100).optional(),
  instructorId: z.string().optional(),
  passingStatus: z.enum(["PASSED", "FAILED", "PENDING"]),
  notes: z.string().optional(),
});

// Effectiveness Check Schema
const effectivenessSchema = z.object({
  enrollmentId: z.string(),
  checkDate: z.string().datetime(),
  checkedBy: z.string(),
  observationPeriod: z.number().min(1).default(30), // days
  performanceRating: z.enum([
    "EXCELLENT",
    "SATISFACTORY",
    "NEEDS_IMPROVEMENT",
    "UNSATISFACTORY",
  ]),
  observations: z.string(),
  actionRequired: z.boolean().default(false),
  actionItems: z.string().optional(),
});

// ============================================
// GET: Retrieve training requirements and status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const capaId = searchParams.get("capaId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // PENDING, ENROLLED, COMPLETED, VERIFIED, OVERDUE
    const requiresVerification = searchParams.get("requiresVerification");
    const enrollmentId = searchParams.get("enrollmentId");

    // Get specific enrollment with full details
    if (enrollmentId) {
      const enrollment = await prisma.capaTrainingEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          requirement: {
            include: {
              capa: {
                select: {
                  capaNumber: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
          completion: true,
          effectivenessCheck: true,
        },
      });

      return NextResponse.json({ enrollment });
    }

    // Build query conditions
    const where: any = {
      requirement: {
        capa: {
          organizationId: session.user.organizationId,
        },
      },
    };

    if (capaId) {
      where.requirement.capaId = capaId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    // Get all enrollments
    const enrollments = await prisma.capaTrainingEnrollment.findMany({
      where,
      include: {
        requirement: {
          include: {
            capa: {
              select: {
                capaNumber: true,
                title: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        completion: true,
        effectivenessCheck: true,
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Filter for verification needed
    let filteredEnrollments = enrollments;
    if (requiresVerification === "true") {
      filteredEnrollments = enrollments.filter(
        (e) => e.status === "COMPLETED" && !e.effectivenessCheck,
      );
    }

    // Calculate statistics
    const stats = {
      total: filteredEnrollments.length,
      pending: filteredEnrollments.filter((e) => e.status === "PENDING").length,
      enrolled: filteredEnrollments.filter((e) => e.status === "ENROLLED")
        .length,
      completed: filteredEnrollments.filter((e) => e.status === "COMPLETED")
        .length,
      verified: filteredEnrollments.filter((e) => e.status === "VERIFIED")
        .length,
      overdue: filteredEnrollments.filter((e) => {
        if (e.status === "VERIFIED") return false;
        const dueDate = new Date(e.requirement.dueDate);
        return dueDate < new Date();
      }).length,
      requiresVerification: filteredEnrollments.filter(
        (e) => e.status === "COMPLETED" && !e.effectivenessCheck,
      ).length,
    };

    // Get training requirements if looking at CAPA level
    if (capaId) {
      const requirements = await prisma.capaTrainingRequirement.findMany({
        where: {
          capaId,
          capa: {
            organizationId: session.user.organizationId,
          },
        },
        include: {
          enrollments: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              completion: true,
              effectivenessCheck: true,
            },
          },
        },
      });

      return NextResponse.json({
        requirements,
        enrollments: filteredEnrollments,
        stats,
      });
    }

    return NextResponse.json({
      enrollments: filteredEnrollments,
      stats,
    });
  } catch (error) {
    console.error("Training GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve training data" },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Create requirements, enroll, complete, verify
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
    // ACTION: CREATE_REQUIREMENT
    // ==========================================
    if (action === "CREATE_REQUIREMENT") {
      const data = trainingRequirementSchema.parse(body);

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

      // Create training requirement
      const requirement = await prisma.capaTrainingRequirement.create({
        data: {
          capaId: data.capaId,
          trainingType: data.trainingType,
          trainingTopic: data.trainingTopic,
          justification: data.justification,
          targetAudience: data.targetAudience,
          targetRoleId: data.targetRoleId,
          targetDepartment: data.targetDepartment,
          targetUserId: data.targetUserId,
          dueDate: new Date(data.dueDate),
          competencyRequired: data.competencyRequired,
          minimumScore: data.minimumScore,
          status: "ACTIVE",
          createdBy: session.user.id,
        },
      });

      // Auto-enroll users based on target audience
      const usersToEnroll: string[] = [];

      if (data.targetAudience === "INDIVIDUAL" && data.targetUserId) {
        usersToEnroll.push(data.targetUserId);
      } else if (data.targetAudience === "ROLE" && data.targetRoleId) {
        const users = await prisma.user.findMany({
          where: {
            organizationId: session.user.organizationId,
            role: data.targetRoleId as any,
          },
          select: { id: true },
        });
        usersToEnroll.push(...users.map((u) => u.id));
      } else if (
        data.targetAudience === "DEPARTMENT" &&
        data.targetDepartment
      ) {
        // Assume users have a department field (would need schema update)
        // For now, enroll all users in organization as placeholder
        const users = await prisma.user.findMany({
          where: { organizationId: session.user.organizationId },
          select: { id: true },
          take: 50, // Safety limit
        });
        usersToEnroll.push(...users.map((u) => u.id));
      }

      // Create enrollments
      const enrollments = await Promise.all(
        usersToEnroll.map((userId) =>
          prisma.capaTrainingEnrollment.create({
            data: {
              requirementId: requirement.id,
              userId,
              status: "ENROLLED",
              enrolledAt: new Date(),
              autoEnrolled: true,
            },
          }),
        ),
      );

      return NextResponse.json({
        success: true,
        requirement,
        enrollments,
        message: `Training requirement created. ${enrollments.length} users auto-enrolled.`,
      });
    }

    // ==========================================
    // ACTION: ENROLL_USER
    // ==========================================
    if (action === "ENROLL_USER") {
      const data = enrollmentSchema.parse(body);

      // Validate requirement exists
      const requirement = await prisma.capaTrainingRequirement.findFirst({
        where: {
          id: data.requirementId,
          capa: {
            organizationId: session.user.organizationId,
          },
        },
      });

      if (!requirement) {
        return NextResponse.json(
          { error: "Training requirement not found" },
          { status: 404 },
        );
      }

      // Check if already enrolled
      const existing = await prisma.capaTrainingEnrollment.findFirst({
        where: {
          requirementId: data.requirementId,
          userId: data.userId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "User already enrolled in this training" },
          { status: 400 },
        );
      }

      // Create enrollment
      const enrollment = await prisma.capaTrainingEnrollment.create({
        data: {
          requirementId: data.requirementId,
          userId: data.userId,
          status: "ENROLLED",
          enrolledAt: data.enrollmentDate
            ? new Date(data.enrollmentDate)
            : new Date(),
          autoEnrolled: data.autoEnrolled,
        },
        include: {
          requirement: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, enrollment });
    }

    // ==========================================
    // ACTION: RECORD_COMPLETION
    // ==========================================
    if (action === "RECORD_COMPLETION") {
      const data = completionSchema.parse(body);

      // Get enrollment
      const enrollment = await prisma.capaTrainingEnrollment.findUnique({
        where: { id: data.enrollmentId },
        include: { requirement: true },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Enrollment not found" },
          { status: 404 },
        );
      }

      // Determine passing status if score provided
      let passingStatus = data.passingStatus;
      if (
        data.score !== undefined &&
        enrollment.requirement.competencyRequired
      ) {
        passingStatus =
          data.score >= enrollment.requirement.minimumScore
            ? "PASSED"
            : "FAILED";
      }

      // Create completion record
      const completion = await prisma.capaTrainingCompletion.create({
        data: {
          enrollmentId: data.enrollmentId,
          completionDate: new Date(data.completionDate),
          score: data.score,
          instructorId: data.instructorId,
          passingStatus,
          notes: data.notes,
        },
      });

      // Update enrollment status
      const newStatus =
        passingStatus === "PASSED"
          ? "COMPLETED"
          : passingStatus === "FAILED"
            ? "ENROLLED"
            : "ENROLLED";

      await prisma.capaTrainingEnrollment.update({
        where: { id: data.enrollmentId },
        data: {
          status: newStatus,
          completedAt:
            passingStatus === "PASSED" ? new Date(data.completionDate) : null,
        },
      });

      return NextResponse.json({
        success: true,
        completion,
        status: newStatus,
        message:
          passingStatus === "PASSED"
            ? "Training completed successfully. Effectiveness verification required."
            : passingStatus === "FAILED"
              ? "Training failed. User must retake training."
              : "Training completion recorded.",
      });
    }

    // ==========================================
    // ACTION: VERIFY_EFFECTIVENESS
    // ==========================================
    if (action === "VERIFY_EFFECTIVENESS") {
      const data = effectivenessSchema.parse(body);

      // Get enrollment and completion
      const enrollment = await prisma.capaTrainingEnrollment.findUnique({
        where: { id: data.enrollmentId },
        include: {
          completion: true,
          requirement: true,
        },
      });

      if (!enrollment || !enrollment.completion) {
        return NextResponse.json(
          { error: "Enrollment or completion not found" },
          { status: 404 },
        );
      }

      if (enrollment.completion.passingStatus !== "PASSED") {
        return NextResponse.json(
          { error: "Cannot verify effectiveness - training not passed" },
          { status: 400 },
        );
      }

      // Create effectiveness check
      const effectivenessCheck =
        await prisma.capaTrainingEffectivenessCheck.create({
          data: {
            enrollmentId: data.enrollmentId,
            checkDate: new Date(data.checkDate),
            checkedBy: data.checkedBy,
            observationPeriod: data.observationPeriod,
            performanceRating: data.performanceRating,
            observations: data.observations,
            actionRequired: data.actionRequired,
            actionItems: data.actionItems,
          },
        });

      // Update enrollment status to VERIFIED
      await prisma.capaTrainingEnrollment.update({
        where: { id: data.enrollmentId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(data.checkDate),
        },
      });

      // Check if all required training for CAPA is verified
      const allEnrollments = await prisma.capaTrainingEnrollment.findMany({
        where: {
          requirementId: enrollment.requirementId,
        },
      });

      const allVerified = allEnrollments.every((e) => e.status === "VERIFIED");

      // If all verified, mark requirement as complete
      if (allVerified) {
        await prisma.capaTrainingRequirement.update({
          where: { id: enrollment.requirementId },
          data: { status: "COMPLETED" },
        });

        // Check if we can now allow CAPA closure
        const allRequirements = await prisma.capaTrainingRequirement.findMany({
          where: {
            capaId: enrollment.requirement.capaId,
          },
        });

        const allRequirementsComplete = allRequirements.every(
          (r) => r.status === "COMPLETED",
        );

        return NextResponse.json({
          success: true,
          effectivenessCheck,
          message: allRequirementsComplete
            ? "All training requirements met. CAPA can now be closed."
            : "Effectiveness verified. Other training requirements still pending.",
        });
      }

      return NextResponse.json({
        success: true,
        effectivenessCheck,
        message:
          "Effectiveness verified. Waiting for other enrollees to complete.",
      });
    }

    // ==========================================
    // ACTION: CHECK_CAPA_CLOSURE_ELIGIBILITY
    // ==========================================
    if (action === "CHECK_CAPA_CLOSURE_ELIGIBILITY") {
      const { capaId } = body;

      if (!capaId) {
        return NextResponse.json({ error: "capaId required" }, { status: 400 });
      }

      // Get all training requirements for CAPA
      const requirements = await prisma.capaTrainingRequirement.findMany({
        where: {
          capaId,
          capa: {
            organizationId: session.user.organizationId,
          },
        },
        include: {
          enrollments: {
            include: {
              completion: true,
              effectivenessCheck: true,
            },
          },
        },
      });

      if (requirements.length === 0) {
        return NextResponse.json({
          eligible: true,
          message: "No training requirements for this CAPA.",
        });
      }

      // Check each requirement
      const requirementStatus = requirements.map((req) => {
        const allEnrollmentsVerified = req.enrollments.every(
          (e) => e.status === "VERIFIED",
        );
        return {
          requirementId: req.id,
          topic: req.trainingTopic,
          status: req.status,
          totalEnrollments: req.enrollments.length,
          verified: req.enrollments.filter((e) => e.status === "VERIFIED")
            .length,
          complete: allEnrollmentsVerified,
        };
      });

      const allComplete = requirementStatus.every((r) => r.complete);

      return NextResponse.json({
        eligible: allComplete,
        requirements: requirementStatus,
        message: allComplete
          ? "All training requirements verified. CAPA eligible for closure."
          : "Training requirements pending. Cannot close CAPA yet.",
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

    console.error("Training POST error:", error);
    return NextResponse.json(
      { error: "Failed to process training action" },
      { status: 500 },
    );
  }
}
