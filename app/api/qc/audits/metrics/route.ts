import { NextResponse } from 'next/server';
import AuditService from '@/lib/services/audit.service';

/**
 * GET /api/qc/audits/metrics
 * Get audit metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const metrics = await AuditService.getAuditMetrics(organizationId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Get audit metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
