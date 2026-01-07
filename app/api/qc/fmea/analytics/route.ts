import { NextResponse } from 'next/server';
import FMEAService from '@/lib/services/fmea.service';

/**
 * GET /api/qc/fmea/analytics
 * Get FMEA analytics and dashboard metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    const analytics = await FMEAService.getFMEAAnalytics(organizationId);

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('FMEA analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate FMEA analytics' },
      { status: 500 }
    );
  }
}
