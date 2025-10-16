import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ReorderAlertEngine } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/alerts/[id]/resolve
 * Resolve an alert (reorder has been placed)
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

    const alert = await ReorderAlertEngine.resolveAlert(alertId, notes);

    return NextResponse.json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error('[POST /api/alerts/:id/resolve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}
