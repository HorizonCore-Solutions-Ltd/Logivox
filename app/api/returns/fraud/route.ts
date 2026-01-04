/**
 * Fraud Detection API
 * POST /api/returns/fraud/analyze - Analyze RMA for fraud
 * GET /api/returns/fraud/[customerId] - Get customer fraud profile
 * GET /api/returns/fraud/stats - Get fraud statistics
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { FraudDetectionService, FraudMonitoringService } from '@/lib/services/returns/fraud-detection';

const analyzeSchema = z.object({
  rmaId: z.string(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { rmaId } = analyzeSchema.parse(body);

    // Get RMA with customer and items
    const rma = await prisma.rMA.findFirst({
      where: {
        id: rmaId,
        organizationId: membership.organizationId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            salesOrderItem: true,
          },
        },
        salesOrder: true,
        returnReason: true,
      },
    });

    if (!rma) {
      return NextResponse.json({ error: 'RMA not found' }, { status: 404 });
    }

    // Get customer return history
    const returnHistory = await prisma.rMA.findMany({
      where: {
        customerId: rma.customerId,
        organizationId: membership.organizationId,
        createdAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last 365 days
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate return metrics
    const totalOrders = await prisma.salesOrder.count({
      where: {
        customerId: rma.customerId,
        organizationId: membership.organizationId,
      },
    });

    const returnRate = totalOrders > 0 ? (returnHistory.length / totalOrders) * 100 : 0;

    const totalReturned = returnHistory.reduce((sum, r) => sum + (r.totalAmount?.toNumber() || 0), 0);

    // Run fraud detection
    const fraudService = new FraudDetectionService();
    const analysis = await fraudService.analyze({
      rmaId: rma.id,
      customerId: rma.customerId,
      orderDate: rma.salesOrder?.orderDate || rma.createdAt,
      returnDate: rma.createdAt,
      totalAmount: rma.totalAmount?.toNumber() || 0,
      items: rma.items.map(item => ({
        sku: item.product?.sku || '',
        quantity: item.quantity,
        price: item.unitPrice?.toNumber() || 0,
        condition: item.condition || 'UNKNOWN',
      })),
      reason: rma.returnReason?.reason || '',
      customerHistory: {
        totalReturns: returnHistory.length,
        returnRate,
        totalReturned,
        avgReturnValue: returnHistory.length > 0 ? totalReturned / returnHistory.length : 0,
        firstOrderDate: rma.customer?.createdAt || new Date(),
      },
      shippingAddress: rma.returnShippingAddress as any,
      metadata: rma.metadata as any || {},
    });

    // Save analysis
    await prisma.$executeRaw`
      INSERT INTO fraud_analyses (
        id, rma_id, customer_id, risk_score, risk_level,
        confidence, signals, recommendations, rules_triggered,
        ml_features, created_at, created_by
      ) VALUES (
        gen_random_uuid(), ${rmaId}, ${rma.customerId}, ${analysis.riskScore},
        ${analysis.riskLevel}, ${analysis.confidence}, ${JSON.stringify(analysis.signals)}::jsonb,
        ${JSON.stringify(analysis.recommendations)}::jsonb, ${JSON.stringify(analysis.rulesTriggered)}::jsonb,
        ${JSON.stringify(analysis.mlFeatures)}::jsonb, NOW(), ${session.user.id}
      )
    `;

    // Update RMA with fraud score
    await prisma.rMA.update({
      where: { id: rmaId },
      data: {
        metadata: {
          ...(rma.metadata as any || {}),
          fraudScore: analysis.riskScore,
          fraudLevel: analysis.riskLevel,
          flaggedForReview: analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL',
        },
      },
    });

    // If high risk, create alert
    if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') {
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: session.user.id,
          action: 'FRAUD_ALERT',
          entityType: 'RMA',
          entityId: rmaId,
          metadata: {
            rmaNumber: rma.rmaNumber,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            signals: analysis.signals.slice(0, 3),
          },
        },
      });
    }

    return NextResponse.json({
      analysis,
      message: 'Fraud analysis completed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error analyzing fraud:', error);
    return NextResponse.json(
      { error: 'Failed to analyze fraud', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get fraud statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_analyses,
        AVG(risk_score) as avg_risk_score,
        COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN risk_level = 'CRITICAL' THEN 1 END) as critical_risk_count,
        COUNT(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = 'LOW' THEN 1 END) as low_risk_count
      FROM fraud_analyses fa
      JOIN "RMA" r ON r.id = fa.rma_id
      WHERE r.organization_id = ${membership.organizationId}
        AND fa.created_at >= NOW() - INTERVAL '30 days'
    ` as any[];

    const topSignals = await prisma.$queryRaw`
      SELECT 
        signal->>'type' as signal_type,
        COUNT(*) as occurrences,
        AVG((signal->>'severity')::numeric) as avg_severity
      FROM fraud_analyses fa
      JOIN "RMA" r ON r.id = fa.rma_id,
      jsonb_array_elements(fa.signals) as signal
      WHERE r.organization_id = ${membership.organizationId}
        AND fa.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY signal->>'type'
      ORDER BY occurrences DESC
      LIMIT 10
    ` as any[];

    const monitoringService = new FraudMonitoringService();
    const monitoring = await monitoringService.getStatistics(membership.organizationId);

    return NextResponse.json({
      stats: stats[0],
      topSignals,
      monitoring,
    });
  } catch (error) {
    console.error('Error fetching fraud stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud statistics' },
      { status: 500 }
    );
  }
}
