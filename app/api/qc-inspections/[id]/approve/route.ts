import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approvalSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_REWORK', 'ESCALATE']),
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// POST /api/qc-inspections/[id]/approve - Submit approval decision
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    // Get inspection with current approval
    const inspection = await prisma.qCInspection.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        approvals: {
          where: { level: { lte: inspection?.currentApprovalLevel || 1 } },
          orderBy: { level: 'desc' },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (inspection.status !== 'AWAITING_APPROVAL') {
      return NextResponse.json(
        { error: "Inspection is not awaiting approval" },
        { status: 400 }
      );
    }

    // Find or create approval for current level
    let currentApproval = inspection.approvals[0];
    if (!currentApproval) {
      currentApproval = await prisma.qCApproval.create({
        data: {
          inspectionId: params.id,
          level: inspection.currentApprovalLevel || 1,
          status: 'PENDING',
        },
      });
    }

    // Update approval
    const updatedApproval = await prisma.qCApproval.update({
      where: { id: currentApproval.id },
      data: {
        approverId: session.user.id,
        approvedDate: new Date(),
        decision: validatedData.decision,
        status: validatedData.decision === 'APPROVE' ? 'APPROVED' :
                validatedData.decision === 'REJECT' ? 'REJECTED' :
                validatedData.decision === 'ESCALATE' ? 'ESCALATED' :
                'PENDING',
        comments: validatedData.comments,
        rejectionReason: validatedData.rejectionReason,
      },
    });

    // Update inspection based on decision
    let inspectionUpdate: any = {};

    if (validatedData.decision === 'APPROVE') {
      const nextLevel = (inspection.currentApprovalLevel || 1) + 1;
      
      if (nextLevel > inspection.template.approvalLevels) {
        // All approvals complete
        inspectionUpdate = {
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          completedDate: new Date(),
        };
      } else {
        // Move to next approval level
        inspectionUpdate = {
          currentApprovalLevel: nextLevel,
          approvalStatus: 'PENDING',
        };

        // Create next approval
        await prisma.qCApproval.create({
          data: {
            inspectionId: params.id,
            level: nextLevel,
            status: 'PENDING',
            notifiedDate: new Date(),
          },
        });
      }
    } else if (validatedData.decision === 'REJECT') {
      inspectionUpdate = {
        status: 'CANCELLED',
        approvalStatus: 'REJECTED',
      };
    } else if (validatedData.decision === 'REQUEST_REWORK') {
      inspectionUpdate = {
        status: 'IN_PROGRESS',
        approvalStatus: 'PENDING',
      };
    } else if (validatedData.decision === 'ESCALATE') {
      const nextLevel = (inspection.currentApprovalLevel || 1) + 1;
      inspectionUpdate = {
        currentApprovalLevel: nextLevel,
        approvalStatus: 'ESCALATED',
      };

      await prisma.qCApproval.create({
        data: {
          inspectionId: params.id,
          level: nextLevel,
          status: 'PENDING',
          notifiedDate: new Date(),
        },
      });
    }

    const updatedInspection = await prisma.qCInspection.update({
      where: { id: params.id },
      data: inspectionUpdate,
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    });

    return NextResponse.json({
      inspection: updatedInspection,
      approval: updatedApproval,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
