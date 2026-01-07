/**
 * Department Comparison API
 * GET /api/qc/analytics/departments
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
    const metricType = searchParams.get('metricType') || 'defect_rate';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const comparison = await AnalyticsDashboardService.getDepartmentComparison({
      organizationId,
      metricType,
    });

    return NextResponse.json(comparison, { status: 200 });
  } catch (error: any) {
    console.error('Department comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
