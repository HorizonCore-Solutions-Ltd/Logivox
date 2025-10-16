import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ReorderAlertEngine } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/[id]/dismiss
 * Dismiss an alert (user wants to ignore it)
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
    const body = await request.json();
    const notes = body.notes;

    const alert = await ReorderAlertEngine.dismissAlert(alertId, notes);

    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('[POST /api/alerts/:id/dismiss] Error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}
