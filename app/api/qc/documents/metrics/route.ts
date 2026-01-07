import { NextResponse } from 'next/server';
import DocumentService from '@/lib/services/document.service';

/**
 * GET /api/qc/documents/metrics
 * Get document control metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    const metrics = await DocumentService.getDocumentMetrics(organizationId);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Get document metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
