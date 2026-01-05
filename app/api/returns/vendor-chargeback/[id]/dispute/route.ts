import { NextRequest, NextResponse } from 'next/server';
import { vendorChargebackService } from '@/lib/services/returns/vendor-chargeback-service';

/**
 * POST /api/returns/vendor-chargeback/[id]/dispute
 * Process vendor dispute for chargeback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { disputeReason, supportingDocuments, organizationId } = body;

    if (!disputeReason || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await vendorChargebackService.processDispute({
      chargebackId: params.id,
      disputeReason,
      supportingDocuments: supportingDocuments || [],
      organizationId,
    });

    return NextResponse.json({
      success: true,
      dispute: result,
    });
  } catch (error: any) {
    console.error('Dispute error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process dispute' },
      { status: 500 }
    );
  }
}
