/**
 * Pareto Analysis API
 * GET /api/qc/analytics/pareto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsDashboardService } from '@/lib/services/qc/analytics-dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const analysisType = searchParams.get('analysisType') || 'defect_category';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const pareto = await AnalyticsDashboardService.getQualityTrendCharts({
      organizationId,
      chartType: 'PARETO',
      period: 'LAST_12_MONTHS',
    });

    // Extract pareto data from trend analysis
    return NextResponse.json({
      type: analysisType,
      data: pareto,
      generated: new Date(),
    }, { status: 200 });
  } catch (error: any) {
    console.error('Pareto analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
