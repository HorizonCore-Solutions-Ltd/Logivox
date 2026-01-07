import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/qc/fmea/[id]/failure-modes - List all failure modes for an FMEA
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const failureModes = await prisma.fMEAFailureMode.findMany({
      where: { fmeaId: params.id },
      orderBy: {
        rpn: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: failureModes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/qc/fmea/[id]/failure-modes - Add failure mode to FMEA
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      processStep,
      processFunction,
      failureMode,
      effectsOfFailure,
      potentialCauses,
      currentControls,
      severity,
      occurrence,
      detection,
      recommendedActions,
      responsiblePerson,
      targetDate
    } = body;

    // Calculate RPN
    const rpn = severity * occurrence * detection;

    const failureModeRecord = await prisma.fMEAFailureMode.create({
      data: {
        fmeaId: params.id,
        processStep,
        processFunction: processFunction || '',
        failureMode,
        effectsOfFailure,
        potentialCauses,
        currentControls,
        severity,
        occurrence,
        detection,
        rpn,
        recommendedActions,
        responsiblePerson,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        status: 'OPEN'
      }
    });

    return NextResponse.json({ success: true, data: failureModeRecord });
  } catch (error: any) {
    console.error('Error creating failure mode:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
