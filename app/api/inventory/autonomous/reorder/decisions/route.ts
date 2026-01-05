/**
 * Autonomous Decisions Log API
 * View all autonomous decisions with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/autonomous/reorder/decisions
 * Retrieve autonomous reorder decisions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // EXECUTED, PENDING, REJECTED
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: session.user.organizationId,
      decisionType: 'REORDER'
    };

    if (status) {
      where.result = status;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const [decisions, total] = await Promise.all([
      prisma.autonomousDecision.findMany({
        where,
        include: {
          product: {
            include: {
              product: true
            }
          },
          purchaseOrder: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.autonomousDecision.count({ where })
    ]);

    // Calculate statistics
    const executed = decisions.filter(d => d.result === 'SUCCESS').length;
    const pending = decisions.filter(d => d.result === 'PENDING').length;
    const failed = decisions.filter(d => d.result === 'FAILED').length;
    
    const totalCost = decisions.reduce((sum, d) => sum + parseFloat(d.estimatedCost.toString()), 0);
    const totalSavings = decisions.reduce((sum, d) => sum + parseFloat(d.estimatedSavings?.toString() || '0'), 0);
    const avgConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        decisions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        statistics: {
          total,
          executed,
          pending,
          failed,
          successRate: total > 0 ? `${Math.round((executed / total) * 100)}%` : '0%',
          totalCost: `$${totalCost.toLocaleString()}`,
          totalSavings: `$${totalSavings.toLocaleString()}`,
          avgConfidence: `${Math.round(avgConfidence)}%`
        }
      }
    });

  } catch (error: any) {
    console.error('Decisions retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve decisions', message: error.message },
      { status: 500 }
    );
  }
}
