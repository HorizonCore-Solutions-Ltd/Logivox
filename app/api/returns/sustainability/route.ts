import { NextRequest, NextResponse } from 'next/server';
import { sustainabilityService } from '@/lib/services/returns/sustainability-service';

/**
 * POST /api/returns/sustainability/report
 * Generate sustainability report for return or organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rmaId, organizationId, reportType, periodStart, periodEnd } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing required field: organizationId' },
        { status: 400 }
      );
    }

    if (reportType === 'RETURN' && rmaId) {
      // Generate return-level report
      const report = await sustainabilityService.calculateReturnSustainability({
        rmaId,
        organizationId,
      });

      return NextResponse.json({
        success: true,
        report,
      });
    } else if (reportType === 'ORGANIZATION') {
      // Generate organization ESG report
      const report = await sustainabilityService.generateESGReport({
        organizationId,
        period: {
          start: new Date(periodStart),
          end: new Date(periodEnd),
        },
      });

      return NextResponse.json({
        success: true,
        report,
      });
    }

    return NextResponse.json(
      { error: 'Invalid report type or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Sustainability report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sustainability report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/returns/sustainability/product?sku=xxx&organizationId=xxx
 * Get product sustainability profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const organizationId = searchParams.get('organizationId');

    if (!sku || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const profile = await sustainabilityService.getProductSustainabilityProfile(sku);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Product sustainability error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product sustainability' },
      { status: 500 }
    );
  }
}
