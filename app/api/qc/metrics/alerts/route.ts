/**
 * Quality Alerts API
 * GET /api/qc/metrics/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QualityMetricsService } from '@/lib/services/qc/quality-metrics.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const severity = searchParams.get('severity') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const alerts = await QualityMetricsService.getQualityAlerts({
      organizationId,
      severity: severity || undefined,
    });

    return NextResponse.json(alerts, { status: 200 });
  } catch (error: any) {
    console.error('Quality alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
