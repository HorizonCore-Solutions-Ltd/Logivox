import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCheckpointSchema = z.object({
  checkpointId: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
  actualValue: z.string().optional(),
  result: z.enum(['PASS', 'FAIL', 'NA']).optional(),
  defectType: z.enum(['CRITICAL', 'MAJOR', 'MINOR']).optional(),
  defectDescription: z.string().optional(),
  photos: z.array(z.string()).optional(),
  performedDate: z.string().optional(),
});

const updateCheckpointsSchema = z.object({
  checkpoints: z.array(updateCheckpointSchema),
});

// PATCH /api/qc-inspections/[id]/checkpoints - Update checkpoint results
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCheckpointsSchema.parse(body);

    // Get inspection
    const inspection = await prisma.qCInspection.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        checkpoints: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Update checkpoints
    const updatePromises = validatedData.checkpoints.map((cp) =>
      prisma.qCCheckpoint.update({
        where: { id: cp.checkpointId },
        data: {
          status: cp.status,
          actualValue: cp.actualValue,
          result: cp.result,
          defectType: cp.defectType,
          defectDescription: cp.defectDescription,
          photos: cp.photos,
          performedById: session.user.id,
          performedDate: cp.performedDate ? new Date(cp.performedDate) : new Date(),
        },
      })
    );

    await Promise.all(updatePromises);

    // Recalculate inspection results
    const updatedCheckpoints = await prisma.qCCheckpoint.findMany({
      where: { inspectionId: params.id },
    });

    const passedCount = updatedCheckpoints.filter(
      (cp) => cp.result === 'PASS'
    ).length;
    const failedCount = updatedCheckpoints.filter(
      (cp) => cp.result === 'FAIL'
    ).length;
    const criticalDefects = updatedCheckpoints.filter(
      (cp) => cp.defectType === 'CRITICAL'
    ).length;
    const majorDefects = updatedCheckpoints.filter(
      (cp) => cp.defectType === 'MAJOR'
    ).length;
    const minorDefects = updatedCheckpoints.filter(
      (cp) => cp.defectType === 'MINOR'
    ).length;
    const defectCount = criticalDefects + majorDefects + minorDefects;

    const completedCount = updatedCheckpoints.filter(
      (cp) => cp.status === 'COMPLETED'
    ).length;
    const totalCheckpoints = updatedCheckpoints.length;

    // Determine overall result
    let result: 'PASS' | 'FAIL' | 'PASS_WITH_NOTES' | 'CONDITIONAL' = 'PASS';
    if (criticalDefects > 0) {
      result = 'FAIL';
    } else if (failedCount > 0) {
      result = 'FAIL';
    } else if (minorDefects > 0) {
      result = 'PASS_WITH_NOTES';
    }

    // Calculate quality score
    const qualityScore = totalCheckpoints > 0
      ? Math.round((passedCount / totalCheckpoints) * 100)
      : 0;

    // Update inspection
    const updatedInspection = await prisma.qCInspection.update({
      where: { id: params.id },
      data: {
        passedCount,
        failedCount,
        defectCount,
        criticalDefects,
        majorDefects,
        minorDefects,
        qualityScore,
        result: completedCount === totalCheckpoints ? result : inspection.result,
        status: completedCount === totalCheckpoints ? 'AWAITING_APPROVAL' : 'IN_PROGRESS',
        // Auto-quarantine if failed and template requires it
        ...(result === 'FAIL' && inspection.template.autoQuarantine && {
          isQuarantined: true,
          quarantineReason: `Failed QC inspection with ${criticalDefects} critical, ${majorDefects} major, ${minorDefects} minor defects`,
        }),
      },
      include: {
        checkpoints: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedInspection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating checkpoints:", error);
    return NextResponse.json(
      { error: "Failed to update checkpoints" },
      { status: 500 }
    );
  }
}
