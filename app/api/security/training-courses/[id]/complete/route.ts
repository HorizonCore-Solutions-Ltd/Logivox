import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CompleteTrainingSchema = z.object({
  guardId: z.string(),
  guardName: z.string(),
  score: z.number().int().min(0).max(100).optional(),
  certificateUrl: z.string().optional(),
  instructorId: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/security/training-courses/[id]/complete - Complete training
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = CompleteTrainingSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Get course
    const course = await prisma.trainingCourse.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Training course not found" },
        { status: 404 },
      );
    }

    // Check if passed
    const passed = course.passingScore
      ? (body.score || 0) >= course.passingScore
      : true;

    // Calculate expiry date
    let expiryDate = null;
    if (passed && course.validityPeriod) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + course.validityPeriod);
    }

    const completion = await prisma.trainingCompletion.create({
      data: {
        organizationId,
        courseId: params.id,
        guardId: body.guardId,
        guardName: body.guardName,
        score: body.score,
        passed,
        expiryDate,
        certificateUrl: body.certificateUrl,
        instructorId: body.instructorId,
        notes: body.notes,
      },
    });

    return NextResponse.json(completion);
  } catch (error: any) {
    console.error("Error completing training:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
