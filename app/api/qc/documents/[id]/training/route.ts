import { NextResponse } from 'next/server';
import DocumentService from '@/lib/services/document.service';

/**
 * POST /api/qc/documents/[id]/training
 * Record training acknowledgment
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const training = await DocumentService.recordTraining({
      documentId: params.id,
      userId: body.userId,
      userName: body.userName,
      signature: body.signature,
      passed: body.passed,
      notes: body.notes
    });

    return NextResponse.json({
      success: true,
      data: training
    });

  } catch (error: any) {
    console.error('Record training error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record training' },
      { status: 500 }
    );
  }
}
