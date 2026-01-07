import { NextResponse } from 'next/server';
import SupplierScorecardService from '@/lib/services/supplier-scorecard.service';

/**
 * GET /api/qc/suppliers/trend
 * Get supplier scorecard trend over time
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const supplierId = searchParams.get('supplierId');
    const periods = parseInt(searchParams.get('periods') || '6', 10);

    if (!supplierId) {
      return NextResponse.json(
        { error: 'supplierId is required' },
        { status: 400 }
      );
    }

    const trend = await SupplierScorecardService.getScorecardTrend(
      supplierId,
      periods
    );

    return NextResponse.json({
      success: true,
      data: trend,
      meta: {
        supplierId,
        periods
      }
    });

  } catch (error: any) {
    console.error('Supplier trend error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate trend' },
      { status: 500 }
    );
  }
}
