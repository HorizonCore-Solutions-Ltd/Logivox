import { NextRequest, NextResponse } from 'next/server';
import rootCauseAnalysisService from '@/lib/services/qc/root-cause-analysis-service';

/**
 * GET /api/qc/root-cause-analysis
 * List RCAs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const result = await rootCauseAnalysisService.listRCAs({
      organizationId,
      vendorId: vendorId || undefined,
      status: status || undefined,
      severity: severity as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing RCAs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qc/root-cause-analysis
 * Create RCA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rca = await rootCauseAnalysisService.createRCA({
      organizationId: body.organizationId,
      vendorId: body.vendorId,
      issueTitle: body.issueTitle,
      issueDescription: body.issueDescription,
      issueType: body.issueType,
      severity: body.severity,
      affectedProducts: body.affectedProducts,
      affectedOrders: body.affectedOrders,
      relatedRTVs: body.relatedRTVs,
      quantityAffected: body.quantityAffected,
      financialImpact: body.financialImpact,
      customerImpact: body.customerImpact,
      responsibleParty: body.responsibleParty,
      targetCompletionDate: new Date(body.targetCompletionDate),
      createdBy: body.createdBy || 'system',
    });

    return NextResponse.json(rca, { status: 201 });
  } catch (error: any) {
    console.error('Error creating RCA:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
