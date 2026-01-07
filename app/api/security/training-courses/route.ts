import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateCourseSchema = z.object({
  courseName: z.string(),
  description: z.string().optional(),
  courseType: z.enum([
    "ONBOARDING",
    "COMPLIANCE",
    "SAFETY",
    "TECHNICAL",
    "SOFT_SKILLS",
    "REFRESHER",
  ]),
  duration: z.number().int().positive().optional(),
  validityPeriod: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
  contentUrl: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

// POST /api/security/training-courses - Create training course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateCourseSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const course = await prisma.trainingCourse.create({
      data: {
        organizationId,
        courseName: body.courseName,
        description: body.description,
        courseType: body.courseType,
        duration: body.duration,
        validityPeriod: body.validityPeriod,
        isRequired: body.isRequired || false,
        contentUrl: body.contentUrl,
        passingScore: body.passingScore,
      },
    });

    return NextResponse.json(course);
  } catch (error: any) {
    console.error("Error creating training course:", error);
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

// GET /api/security/training-courses - List courses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    const isRequired = searchParams.get("isRequired");

    const courses = await prisma.trainingCourse.findMany({
      where: {
        organizationId,
        ...(isActive !== null && { isActive: isActive === "true" }),
        ...(isRequired !== null && { isRequired: isRequired === "true" }),
      },
      include: {
        _count: {
          select: {
            completions: true,
          },
        },
      },
      orderBy: { courseName: "asc" },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("Error listing training courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
