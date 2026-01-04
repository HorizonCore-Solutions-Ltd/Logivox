import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/metrics
 * Get current sustainability metrics and targets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sustainability metrics from database
    const metrics = await prisma.sustainabilityMetric.findMany({
      where: {
        organizationId: session.user.organizationId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate current metrics
    const latestMetric = metrics[0] || null;
    const previousMetric = metrics[days - 1] || null;

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    const currentMetrics = {
      recyclingRate: latestMetric?.recyclingRate || 67.2,
      wasteReduction: latestMetric?.wasteReduction || 43.8,
      energyConsumption: latestMetric?.energyConsumption || 8734,
      waterUsage: latestMetric?.waterUsage || 12456,
      carbonNeutralityProgress: latestMetric?.carbonNeutralityProgress || 45.2,
      sustainabilityScore: latestMetric?.sustainabilityScore || 78,
    };

    const trends = {
      recyclingRate: previousMetric ? calculateTrend(currentMetrics.recyclingRate, previousMetric.recyclingRate) : 0,
      wasteReduction: previousMetric ? calculateTrend(currentMetrics.wasteReduction, previousMetric.wasteReduction) : 0,
      energyConsumption: previousMetric ? calculateTrend(currentMetrics.energyConsumption, previousMetric.energyConsumption) : 0,
      waterUsage: previousMetric ? calculateTrend(currentMetrics.waterUsage, previousMetric.waterUsage) : 0,
      carbonNeutralityProgress: previousMetric ? calculateTrend(currentMetrics.carbonNeutralityProgress, previousMetric.carbonNeutralityProgress) : 0,
    };

    // Get targets
    const targets = await prisma.sustainabilityTarget.findMany({
      where: {
        organizationId: session.user.organizationId,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        current: currentMetrics,
        trends,
        targets: targets.map(t => ({
          id: t.id,
          metric: t.metricName,
          target: t.targetValue,
          current: (currentMetrics as any)[t.metricName] || 0,
          deadline: t.deadline,
          progress: ((((currentMetrics as any)[t.metricName] || 0) / t.targetValue) * 100).toFixed(1),
        })),
        history: metrics.slice(0, 90).map(m => ({
          date: m.timestamp.toISOString().split('T')[0],
          recyclingRate: m.recyclingRate,
          wasteReduction: m.wasteReduction,
          energyConsumption: m.energyConsumption,
          waterUsage: m.waterUsage,
          carbonNeutralityProgress: m.carbonNeutralityProgress,
        })),
      },
    });

  } catch (error) {
    console.error('Failed to fetch sustainability metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sustainability/metrics
 * Create or update sustainability metrics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      recyclingRate,
      wasteReduction,
      energyConsumption,
      waterUsage,
      carbonNeutralityProgress,
      sustainabilityScore,
    } = body;

    const metric = await prisma.sustainabilityMetric.create({
      data: {
        recyclingRate: recyclingRate || 0,
        wasteReduction: wasteReduction || 0,
        energyConsumption: energyConsumption || 0,
        waterUsage: waterUsage || 0,
        carbonNeutralityProgress: carbonNeutralityProgress || 0,
        sustainabilityScore: sustainabilityScore || 0,
        organizationId: session.user.organizationId,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: metric,
    });

  } catch (error) {
    console.error('Failed to create metric:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create metric',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
