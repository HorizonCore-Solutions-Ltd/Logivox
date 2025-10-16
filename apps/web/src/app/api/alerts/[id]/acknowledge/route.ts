import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ReorderAlertEngine } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/[id]/acknowledge
 * Acknowledge an alert (user has seen it)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const alertId = params.id;

    const alert = await ReorderAlertEngine.acknowledgeAlert(alertId);

    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('[POST /api/alerts/:id/acknowledge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
