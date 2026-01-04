import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as matchingService from '@/lib/services/cross-dock/matching-service';
import * as sortingService from '@/lib/services/cross-dock/sorting-service';

/**
 * PATCH /api/cross-dock/allocations/:id
 * Update allocation (picking, staging, loading, shipping)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'pick':
        result = await sortingService.updateAllocationPicking({
          allocationId: params.id,
          quantityPicked: data.quantityPicked,
          userId: session.user.id,
          locationId: data.locationId,
        });
        break;

      case 'stage':
        result = await sortingService.stageAllocation(params.id, data.locationId);
        break;

      case 'load':
        result = await sortingService.loadAllocation(params.id);
        break;

      case 'ship':
        result = await sortingService.shipAllocation(params.id);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update allocation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update allocation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cross-dock/allocations/:id
 * Remove allocation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await matchingService.deallocate(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to deallocate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deallocate' },
      { status: 500 }
    );
  }
}
