/**
 * ABC Analysis Execution API
 * Revenue-based velocity classification
 * 
 * Features:
 * - Automatic ABC classification (A/B/C/D)
 * - Velocity scoring (0-100)
 * - Turnover rate calculation
 * - Count frequency recommendations
 * - Safety stock optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedInventoryService } from '@/lib/services/inventory/advanced-inventory-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for analysis

/**
 * POST /api/inventory/abc-analysis/run
 * Execute ABC analysis for all products
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    // Run ABC analysis
    const results = await advancedInventoryService.performABCAnalysis(organizationId);

    // Store classifications in database
    await Promise.all(
      results.map(async (result) => {
        await prisma.velocityClassification.upsert({
          where: { productId: result.productId },
          update: {
            velocityClass: result.velocityClass,
            velocityScore: result.velocityScore,
            turnoverRate: result.turnoverRate,
            annualRevenue: result.annualRevenue,
            lastCalculated: new Date(),
            metadata: {
              countFrequency: result.recommendedCountFrequency,
              safetyStockDays: result.recommendedSafetyStockDays,
              reorderPoint: result.recommendedReorderPoint
            } as any
          },
          create: {
            productId: result.productId,
            velocityClass: result.velocityClass,
            velocityScore: result.velocityScore,
            turnoverRate: result.turnoverRate,
            annualRevenue: result.annualRevenue,
            lastCalculated: new Date(),
            metadata: {
              countFrequency: result.recommendedCountFrequency,
              safetyStockDays: result.recommendedSafetyStockDays,
              reorderPoint: result.recommendedReorderPoint
            } as any
          }
        });
      })
    );

    // Calculate distribution
    const distribution = results.reduce((acc: any, r) => {
      acc[r.velocityClass] = (acc[r.velocityClass] || 0) + 1;
      return acc;
    }, {});

    // Top performers
    const topPerformers = results
      .filter(r => r.velocityClass === 'A')
      .sort((a, b) => b.velocityScore - a.velocityScore)
      .slice(0, 10);

    // Slow movers
    const slowMovers = results
      .filter(r => r.velocityClass === 'D')
      .sort((a, b) => a.turnoverRate - b.turnoverRate)
      .slice(0, 10);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts: results.length,
          distribution,
          aClassItems: distribution.A || 0,
          bClassItems: distribution.B || 0,
          cClassItems: distribution.C || 0,
          dClassItems: distribution.D || 0,
          analysisTime: `${responseTime}ms`,
          completedAt: new Date().toISOString()
        },
        topPerformers: topPerformers.map(p => ({
          productId: p.productId,
          sku: p.sku,
          name: p.name,
          velocityClass: p.velocityClass,
          velocityScore: Math.round(p.velocityScore),
          turnoverRate: p.turnoverRate.toFixed(2),
          annualRevenue: `$${p.annualRevenue.toLocaleString()}`,
          countFrequency: p.recommendedCountFrequency
        })),
        slowMovers: slowMovers.map(p => ({
          productId: p.productId,
          sku: p.sku,
          name: p.name,
          velocityClass: p.velocityClass,
          velocityScore: Math.round(p.velocityScore),
          turnoverRate: p.turnoverRate.toFixed(2),
          annualRevenue: `$${p.annualRevenue.toLocaleString()}`,
          recommendation: 'Consider reducing stock or discontinuing'
        })),
        recommendations: [
          {
            category: 'A Items (Top 20%)',
            count: distribution.A || 0,
            action: 'Daily counts, high safety stock, priority reordering',
            impact: 'Prevent stockouts on high-value items'
          },
          {
            category: 'B Items (Next 30%)',
            count: distribution.B || 0,
            action: 'Weekly counts, moderate safety stock',
            impact: 'Balance inventory investment'
          },
          {
            category: 'C Items (Next 40%)',
            count: distribution.C || 0,
            action: 'Monthly counts, minimal safety stock',
            impact: 'Reduce carrying costs'
          },
          {
            category: 'D Items (Bottom 10%)',
            count: distribution.D || 0,
            action: 'Quarterly counts, consider discontinuation',
            impact: 'Free up warehouse space and capital'
          }
        ]
      }
    });

  } catch (error: any) {
    console.error('ABC analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run ABC analysis',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/abc-analysis/run
 * Get ABC analysis information
 */
export async function GET() {
  return NextResponse.json({
    description: 'ABC Analysis classifies inventory by revenue contribution',
    methodology: {
      classA: 'Top 20% of items by revenue (typically 80% of revenue)',
      classB: 'Next 30% of items (typically 15% of revenue)',
      classC: 'Next 40% of items (typically 4% of revenue)',
      classD: 'Bottom 10% of items (typically 1% of revenue)'
    },
    metrics: {
      velocityScore: '0-100 score based on turnover rate and revenue',
      turnoverRate: 'Annual sales / average inventory',
      annualRevenue: 'Total revenue from product in last 12 months'
    },
    benefits: [
      'Optimize inventory investment',
      'Prioritize cycle counting',
      'Improve space utilization',
      'Reduce carrying costs',
      'Prevent stockouts on critical items'
    ],
    recommendedFrequency: 'Run monthly or when product mix changes significantly'
  });
}
