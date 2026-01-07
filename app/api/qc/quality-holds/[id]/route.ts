import { NextRequest, NextResponse } from 'next/server';
import { QualityHoldService } from '@/lib/services/qc/quality-hold-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hold = await QualityHoldService.getHoldById(params.id);
    
    if (!hold) {
      return NextResponse.json(
        { error: 'Quality hold not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(hold);
  } catch (error: any) {
    console.error('Error fetching quality hold:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quality hold' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'requestRelease':
        result = await QualityHoldService.requestRelease({
          holdId: params.id,
          releaseRequestedBy: data.requestedBy,
          releaseConditions: data.releaseConditions,
        });
        break;

      case 'approveRelease':
        result = await QualityHoldService.approveRelease({
          holdId: params.id,
          releaseApprovedBy: data.reviewedBy,
          approved: data.approved,
          quantity: data.quantityReleased,
          disposition: data.finalDisposition,
          dispositionReason: data.reviewNotes,
        });
        break;

      case 'updateInvestigation':
        result = await QualityHoldService.updateInvestigation({
          holdId: params.id,
          investigationStatus: data.investigationStatus,
          investigationNotes: data.investigationFindings,
        });
        break;

      case 'escalate':
        result = await QualityHoldService.escalateHold({
          holdId: params.id,
          escalatedTo: data.escalatedBy,
        });
        break;

      case 'cancel':
        result = await QualityHoldService.cancelHold(params.id, data.cancellationReason);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating quality hold:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quality hold' },
      { status: 500 }
    );
  }
}
