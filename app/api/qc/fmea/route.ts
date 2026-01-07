import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/fmea - List all FMEAs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const fmeas = await prisma.fMEA.findMany({
      where,
      include: {
        failureModes: {
          select: {
            id: true,
            rpn: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: fmeas });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/qc/fmea - Create new FMEA
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      type,
      scope,
      teamLead,
      teamMembers,
      failureModes,
      organizationId,
      createdBy,
    } = body;

    // Generate FMEA number
    const fmeaNumber = `FMEA-${Date.now()}`;

    // Create FMEA with failure modes
    const fmea = await prisma.fMEA.create({
      data: {
        fmeaNumber,
        title,
        type,
        scope,
        teamLead,
        teamMembers: JSON.stringify(teamMembers || []),
        status: "IN_PROGRESS",
        startDate: new Date(),
        organizationId,
        createdBy,
        failureModes: {
          create: failureModes.map((fm: any) => ({
            processStep: fm.processStep,
            processFunction: "",
            failureMode: fm.failureMode,
            effectsOfFailure: fm.effects,
            potentialCauses: fm.causes,
            currentControls: fm.controls,
            severity: fm.severity,
            occurrence: fm.occurrence,
            detection: fm.detection,
            rpn: fm.rpn,
            recommendedActions: fm.actions,
            responsiblePerson: fm.responsible,
            status: "OPEN",
          })),
        },
      },
      include: {
        failureModes: true,
      },
    });

    return NextResponse.json({ success: true, data: fmea });
  } catch (error: any) {
    console.error("Error creating FMEA:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
