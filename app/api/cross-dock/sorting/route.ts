import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as sortingService from '@/lib/services/cross-dock/sorting-service';

/**
 * GET /api/cross-dock/sorting
 * List sorting tasks
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const filters = {
      organizationId: session.user.organizationId,
      appointmentId: searchParams.get('appointmentId') || undefined,
      status: searchParams.get('status') || undefined,
      workerId: searchParams.get('workerId') || undefined,
    };

    const tasks = await sortingService.getSortingTasks(filters);

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Failed to get sorting tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sorting tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cross-dock/sorting
 * Create sorting task
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const input = {
      organizationId: session.user.organizationId,
      ...body,
    };

    const task = await sortingService.createSortingTask(input);

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create sorting task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create sorting task' },
      { status: 500 }
    );
  }
}
