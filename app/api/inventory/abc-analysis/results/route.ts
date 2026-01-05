/**
 * ABC Analysis Results API
 * Retrieve stored ABC classification results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/abc-analysis/results
 * Get ABC analysis results with filtering
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
    const velocityClass = searchParams.get('class'); // A, B, C, D
    const minScore = parseFloat(searchParams.get('minScore') || '0');
    const maxScore = parseFloat(searchParams.get('maxScore') || '100');
    const sortBy = searchParams.get('sortBy') || 'velocityScore'; // velocityScore, turnoverRate, annualRevenue
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (velocityClass) {
      where.velocityClass = velocityClass;
    }

    if (minScore > 0 || maxScore < 100) {
      where.velocityScore = {
        gte: minScore,
        lte: maxScore
      };
    }

    // Get classifications with product details
    const [classifications, total] = await Promise.all([
      prisma.velocityClassification.findMany({
        where,
        include: {
          product: {
            include: {
              product: true,
              warehouse: true
            }
          }
        },
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset
      }),
      prisma.velocityClassification.count({ where })
    ]);

    // Calculate statistics
    const byClass = await prisma.velocityClassification.groupBy({
      by: ['velocityClass'],
      _count: { velocityClass: true },
      _avg: {
        velocityScore: true,
        turnoverRate: true
      },
      _sum: {
        annualRevenue: true
      }
    });

    const statistics = byClass.map(stat => ({
      class: stat.velocityClass,
      count: stat._count.velocityClass,
      avgVelocityScore: Math.round(stat._avg.velocityScore || 0),
      avgTurnoverRate: (stat._avg.turnoverRate || 0).toFixed(2),
      totalRevenue: `$${(stat._sum.annualRevenue || 0).toLocaleString()}`
    }));

    // Format results
    const results = classifications.map(c => ({
      productId: c.productId,
      sku: c.product?.product?.sku || 'Unknown',
      name: c.product?.product?.name || 'Unknown',
      warehouse: c.product?.warehouse?.name || 'Unknown',
      velocityClass: c.velocityClass,
      velocityScore: Math.round(c.velocityScore),
      turnoverRate: c.turnoverRate.toFixed(2),
      annualRevenue: `$${c.annualRevenue.toLocaleString()}`,
      currentQuantity: c.product?.quantity || 0,
      availableQuantity: c.product?.availableQty || 0,
      recommendations: c.metadata as any,
      lastCalculated: c.lastCalculated
    }));

    return NextResponse.json({
      success: true,
      data: {
        results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        statistics,
        filters: {
          velocityClass,
          minScore,
          maxScore,
          sortBy,
          order
        }
      }
    });

  } catch (error: any) {
    console.error('Results retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve results', message: error.message },
      { status: 500 }
    );
  }
}
