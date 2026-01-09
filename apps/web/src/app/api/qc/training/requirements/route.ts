import { NextRequest, NextResponse } from "next/server";
import { TrainingService } from "@/lib/services/qc/training.service";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const requirement = await TrainingService.createRequirement({
      organizationId: body.organizationId,
      trainingCode: body.trainingCode,
      trainingTitle: body.trainingTitle,
      trainingCategory: body.trainingCategory,
      description: body.description,
      requiredFor: body.requiredFor,
      frequency: body.frequency,
      duration: body.duration,
      validityPeriod: body.validityPeriod,
      certificationRequired: body.certificationRequired,
      providedBy: body.providedBy,
      mandatoryReason: body.mandatoryReason,
      prerequisiteTrainings: body.prerequisiteTrainings,
      assessmentRequired: body.assessmentRequired,
      passingScore: body.passingScore,
      createdBy: session.user.email || "",
    });

    return NextResponse.json(requirement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const category = searchParams.get("category");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 },
      );
    }

    // This would be implemented with a new method in TrainingService
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
