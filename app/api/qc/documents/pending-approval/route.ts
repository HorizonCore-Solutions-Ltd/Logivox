import { NextResponse } from 'next/server';
import DocumentService from '@/lib/services/document.service';

/**
 * GET /api/qc/documents/pending-approval
 * Get documents pending approval
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';

    const documents = await DocumentService.getDocumentsPendingApproval(organizationId);

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error: any) {
    console.error('Get pending documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get pending documents' },
      { status: 500 }
    );
  }
}
