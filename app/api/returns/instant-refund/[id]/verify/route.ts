import { NextRequest, NextResponse } from 'next/server';
import { instantRefundService } from '@/lib/services/returns/instant-refund-service';

/**
 * POST /api/returns/instant-refund/[id]/verify
 * Verify returned item after receipt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { organizationId, itemCondition, conditionMatches, notes } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing required field: organizationId' },
        { status: 400 }
      );
    }

    const result = await instantRefundService.verifyReturnedItem({
      instantRefundId: params.id,
      organizationId,
      itemCondition,
      conditionMatches,
      notes,
    });

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify item' },
      { status: 500 }
    );
  }
}
