import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/qc/fmea/[id] - Get single FMEA with all failure modes
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fmea = await prisma.fMEA.findUnique({
      where: { id: params.id },
      include: {
        failureModes: {
          orderBy: {
            rpn: 'desc'
          }
        }
      }
    });

    if (!fmea) {
      return NextResponse.json(
        { success: false, error: 'FMEA not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: fmea });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/qc/fmea/[id] - Update FMEA
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, scope, teamLead, teamMembers, status, lastReviewDate } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (scope) updateData.scope = scope;
    if (teamLead) updateData.teamLead = teamLead;
    if (teamMembers) updateData.teamMembers = JSON.stringify(teamMembers);
    if (status) updateData.status = status;
    if (lastReviewDate) updateData.lastReviewDate = new Date(lastReviewDate);

    const fmea = await prisma.fMEA.update({
      where: { id: params.id },
      data: updateData,
      include: {
        failureModes: true
      }
    });

    return NextResponse.json({ success: true, data: fmea });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/qc/fmea/[id] - Delete FMEA
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all failure modes first
    await prisma.fMEAFailureMode.deleteMany({
      where: { fmeaId: params.id }
    });

    // Delete FMEA
    await prisma.fMEA.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'FMEA deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
