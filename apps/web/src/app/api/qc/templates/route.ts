import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { InspectionCategory, SamplingType } from "@prisma/client";
import { z } from "zod";

const checkpointSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1, "Checkpoint label is required"),
    type: z.enum(["BOOLEAN", "NUMERIC", "TEXT", "OPTION", "PHOTO"]),
    required: z.boolean(),
    options: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.type === "OPTION" &&
      (!value.options || value.options.length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPTION checkpoints require at least 2 options",
        path: ["options"],
      });
    }
  });

const createTemplateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(InspectionCategory).optional(),
  checkpoints: z.array(checkpointSchema).min(1),
  samplingType: z.nativeEnum(SamplingType).optional(),
  requiresApproval: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const templates = await prisma.inspectionTemplate.findMany({
      where: {
        organizationId,
        isActive: true, // Only show active templates by default? Or maybe all?
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/qc/templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      code,
      description,
      category,
      checkpoints,
      samplingType,
      requiresApproval,
    } = parsed.data;

    const template = await prisma.inspectionTemplate.create({
      data: {
        organizationId,
        name,
        code,
        description,
        category:
          (category as InspectionCategory) || InspectionCategory.INCOMING,
        samplingType: (samplingType as SamplingType) || SamplingType.FULL,
        requiresApproval: requiresApproval ?? true,
        checkpoints,
        isActive: true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/qc/templates error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 },
    );
  }
}
