import { NextResponse } from 'next/server';
import RiskService from '@/lib/services/risk.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/qc/risk
 * Get all risks
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    const risks = await prisma.riskRegister.findMany({
      where: { organizationId },
      orderBy: { rpn: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: risks
    });

  } catch (error: any) {
    console.error('Get risks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get risks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qc/risk
 * Create new risk
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const risk = await RiskService.createRisk({
      organizationId: body.organizationId,
      title: body.title,
      description: body.description,
      category: body.category,
      processArea: body.processArea,
      severity: body.severity,
      occurrence: body.occurrence,
      detection: body.detection,
      owner: body.owner,
      createdBy: body.createdBy
    });

    return NextResponse.json({
      success: true,
      data: risk
    });

  } catch (error: any) {
    console.error('Create risk error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create risk' },
      { status: 500 }
    );
  }
}
