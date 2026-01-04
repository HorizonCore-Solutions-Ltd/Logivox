/**
 * Customer Fraud Profile API
 * GET /api/returns/fraud/[customerId] - Get customer fraud profile
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FraudDetectionService } from '@/lib/services/returns/fraud-detection';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    // Verify customer belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.customerId,
        organizationId: membership.organizationId,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get fraud analyses for customer
    const analyses = await prisma.$queryRaw`
      SELECT fa.*, r.rma_number, r.created_at as rma_date
      FROM fraud_analyses fa
      JOIN "RMA" r ON r.id = fa.rma_id
      WHERE fa.customer_id = ${params.customerId}
        AND r.organization_id = ${membership.organizationId}
      ORDER BY fa.created_at DESC
      LIMIT 50
    ` as any[];

    // Calculate customer risk profile
    const avgRiskScore = analyses.length > 0 
      ? analyses.reduce((sum: number, a: any) => sum + a.risk_score, 0) / analyses.length
      : 0;

    const highRiskCount = analyses.filter((a: any) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL').length;

    const fraudService = new FraudDetectionService();
    const profile = await fraudService.getCustomerRiskProfile(params.customerId);

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      profile,
      analyses,
      summary: {
        totalAnalyses: analyses.length,
        avgRiskScore,
        highRiskCount,
        lastAnalyzed: analyses.length > 0 ? analyses[0].created_at : null,
      },
    });
  } catch (error) {
    console.error('Error fetching customer fraud profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer fraud profile' },
      { status: 500 }
    );
  }
}
