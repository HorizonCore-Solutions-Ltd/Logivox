import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/qc/fmea/failure-modes/[fmId] - Update failure mode including residual risk
export async function PUT(
  req: NextRequest,
  { params }: { params: { fmId: string } }
) {
  try {
    const body = await req.json();
    const {
      processStep,
      failureMode,
      effectsOfFailure,
      potentialCauses,
      currentControls,
      severity,
      occurrence,
      detection,
      recommendedActions,
      responsiblePerson,
      targetDate,
      actionsTaken,
      residualSeverity,
      residualOccurrence,
      residualDetection,
      status,
      linkedCAPAIds
    } = body;

    const updateData: any = {};

    // Basic fields
    if (processStep !== undefined) updateData.processStep = processStep;
    if (failureMode !== undefined) updateData.failureMode = failureMode;
    if (effectsOfFailure !== undefined) updateData.effectsOfFailure = effectsOfFailure;
    if (potentialCauses !== undefined) updateData.potentialCauses = potentialCauses;
    if (currentControls !== undefined) updateData.currentControls = currentControls;
    if (recommendedActions !== undefined) updateData.recommendedActions = recommendedActions;
    if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson;
    if (actionsTaken !== undefined) updateData.actionsTaken = actionsTaken;
    if (status !== undefined) updateData.status = status;
    if (linkedCAPAIds !== undefined) updateData.linkedCAPAIds = JSON.stringify(linkedCAPAIds);

    // Target date
    if (targetDate) updateData.targetDate = new Date(targetDate);

    // Recalculate RPN if severity/occurrence/detection changed
    if (severity !== undefined || occurrence !== undefined || detection !== undefined) {
      const current = await prisma.fMEAFailureMode.findUnique({
        where: { id: params.fmId }
      });

      if (current) {
        const newSeverity = severity !== undefined ? severity : current.severity;
        const newOccurrence = occurrence !== undefined ? occurrence : current.occurrence;
        const newDetection = detection !== undefined ? detection : current.detection;

        updateData.severity = newSeverity;
        updateData.occurrence = newOccurrence;
        updateData.detection = newDetection;
        updateData.rpn = newSeverity * newOccurrence * newDetection;
      }
    }

    // Calculate residual RPN if residual values provided
    if (residualSeverity !== undefined || residualOccurrence !== undefined || residualDetection !== undefined) {
      const current = await prisma.fMEAFailureMode.findUnique({
        where: { id: params.fmId }
      });

      if (current) {
        const newResSeverity = residualSeverity !== undefined ? residualSeverity : (current.residualSeverity || current.severity);
        const newResOccurrence = residualOccurrence !== undefined ? residualOccurrence : (current.residualOccurrence || current.occurrence);
        const newResDetection = residualDetection !== undefined ? residualDetection : (current.residualDetection || current.detection);

        updateData.residualSeverity = newResSeverity;
        updateData.residualOccurrence = newResOccurrence;
        updateData.residualDetection = newResDetection;
        updateData.residualRPN = newResSeverity * newResOccurrence * newResDetection;
      }
    }

    const failureModeRecord = await prisma.fMEAFailureMode.update({
      where: { id: params.fmId },
      data: updateData
    });

    return NextResponse.json({ success: true, data: failureModeRecord });
  } catch (error: any) {
    console.error('Error updating failure mode:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/qc/fmea/failure-modes/[fmId] - Delete failure mode
export async function DELETE(
  req: NextRequest,
  { params }: { params: { fmId: string } }
) {
  try {
    await prisma.fMEAFailureMode.delete({
      where: { id: params.fmId }
    });

    return NextResponse.json({ success: true, message: 'Failure mode deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
