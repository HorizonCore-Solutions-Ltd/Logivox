import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as matchingService from '@/lib/services/cross-dock/matching-service';

/**
 * POST /api/cross-dock/matching/auto
 * Auto-match receipts to shipments
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const criteria = {
      organizationId: session.user.organizationId,
      ...body,
    };

    const result = await matchingService.autoMatchReceiptsToShipments(criteria);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to auto-match:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-match' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cross-dock/matching/recommendations
 * Get matching recommendations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const criteria = {
      organizationId: session.user.organizationId,
      appointmentId: searchParams.get('appointmentId') || undefined,
      receiptId: searchParams.get('receiptId') || undefined,
      strategy: searchParams.get('strategy') as any || 'FIFO',
    };

    const recommendations = await matchingService.getMatchingRecommendations(criteria);

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Failed to get recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
