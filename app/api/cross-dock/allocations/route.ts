import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as matchingService from '@/lib/services/cross-dock/matching-service';

/**
 * GET /api/cross-dock/allocations
 * List allocations
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
      receiptItemId: searchParams.get('receiptItemId') || undefined,
      shipmentId: searchParams.get('shipmentId') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const allocations = await matchingService.getAllocations(filters);

    return NextResponse.json(allocations);
  } catch (error: any) {
    console.error('Failed to get allocations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get allocations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cross-dock/allocations
 * Create manual allocation
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
      userId: session.user.id,
      ...body,
    };

    const allocation = await matchingService.manualAllocate(input);

    return NextResponse.json(allocation, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create allocation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create allocation' },
      { status: 500 }
    );
  }
}
