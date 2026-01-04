import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as sortingService from '@/lib/services/cross-dock/sorting-service';

/**
 * PATCH /api/cross-dock/sorting/:id
 * Update sorting progress or assign worker
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
      case 'updateProgress':
        result = await sortingService.updateSortingProgress({
          sortingId: params.id,
          ...data,
        });
        break;

      case 'assignWorker':
        result = await sortingService.assignWorkerToSorting({
          sortingId: params.id,
          workerId: data.workerId,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update sorting task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sorting task' },
      { status: 500 }
    );
  }
}
