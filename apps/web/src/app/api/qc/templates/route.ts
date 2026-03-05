import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { InspectionCategory, SamplingType } from "@prisma/client";

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
    const {
      name,
      code,
      description,
      category,
      checkpoints,
      samplingType,
      requiresApproval,
    } = body;

    if (!name || !code || !checkpoints) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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
        checkpoints: checkpoints, // JSON
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
