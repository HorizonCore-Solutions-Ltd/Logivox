import { NextResponse } from 'next/server';
import AuditService from '@/lib/services/audit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/qc/audits/[id]
 * Get audit by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: params.id },
      include: {
        findings: {
          orderBy: {
            severity: 'desc'
          }
        },
        supplier: true
      }
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: audit
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get audit' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/qc/audits/[id]
 * Update audit
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const audit = await AuditService.updateAuditStatus(
      params.id,
      body.status,
      body.summary,
      body.recommendations
    );

    return NextResponse.json({
      success: true,
      data: audit
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update audit' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qc/audits/[id]
 * Delete audit
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.audit.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Audit deleted'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete audit' },
      { status: 500 }
    );
  }
}
