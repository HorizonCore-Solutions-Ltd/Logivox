import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/computer-vision/stats
 * Get aggregated statistics for computer vision scans
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

    const where = {
      organizationId: session.user.organizationId,
      createdAt: {
        gte: startDate,
      },
    };

    // Get all scans for aggregation
    const scans = await prisma.computerVisionScan.findMany({
      where,
      select: {
        mode: true,
        confidence: true,
        processingTime: true,
        detectedItems: true,
        damageDetected: true,
        variance: true,
        createdAt: true,
      },
    });

    // Calculate statistics
    const totalScans = scans.length;
    const averageConfidence = totalScans > 0
      ? scans.reduce((sum, scan) => sum + scan.confidence, 0) / totalScans
      : 0;
    
    const averageProcessingTime = totalScans > 0
      ? scans.reduce((sum, scan) => sum + scan.processingTime, 0) / totalScans
      : 0;

    const varianceCount = scans.filter(scan => 
      scan.variance !== null && scan.variance !== undefined && scan.variance !== 0
    ).length;

    const damageCount = scans.filter(scan => scan.damageDetected === true).length;

    const totalItems = scans.reduce((sum, scan) => 
      sum + (scan.detectedItems || 0), 0
    );

    // Group by mode
    const scansByMode = scans.reduce((acc, scan) => {
      acc[scan.mode] = (acc[scan.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by date for trend analysis
    const scansByDate = scans.reduce((acc, scan) => {
      const date = scan.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate accuracy (scans with confidence > 85%)
    const highConfidenceScans = scans.filter(scan => scan.confidence >= 0.85).length;
    const accuracyRate = totalScans > 0 ? (highConfidenceScans / totalScans) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalScans,
          averageConfidence: Math.round(averageConfidence * 100),
          accuracyRate: Math.round(accuracyRate),
          averageProcessingTime: Math.round(averageProcessingTime),
          varianceCount,
          damageCount,
          totalItems,
        },
        scansByMode,
        scansByDate: Object.entries(scansByDate).map(([date, count]) => ({
          date,
          count,
        })),
        performance: {
          highConfidence: highConfidenceScans,
          mediumConfidence: scans.filter(s => s.confidence >= 0.70 && s.confidence < 0.85).length,
          lowConfidence: scans.filter(s => s.confidence < 0.70).length,
        },
        trends: {
          dailyAverage: totalScans / days,
          recentScans: scans.filter(s => {
            const hourAgo = new Date();
            hourAgo.setHours(hourAgo.getHours() - 1);
            return s.createdAt >= hourAgo;
          }).length,
        },
      },
    });

  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
