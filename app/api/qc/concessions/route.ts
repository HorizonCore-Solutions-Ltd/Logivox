import { NextRequest, NextResponse } from 'next/server';
import vendorConcessionService from '@/lib/services/qc/vendor-concession-service';

/**
 * GET /api/qc/concessions
 * List vendor concessions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');
    const concessionType = searchParams.get('concessionType');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const result = await vendorConcessionService.listConcessions({
      organizationId,
      vendorId: vendorId || undefined,
      status: status || undefined,
      concessionType: concessionType || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing concessions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qc/concessions
 * Create vendor concession
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const concession = await vendorConcessionService.createConcession({
      organizationId: body.organizationId,
      vendorId: body.vendorId,
      concessionType: body.concessionType,
      relatedIssue: body.relatedIssue,
      rtvId: body.rtvId,
      chargebackId: body.chargebackId,
      debitMemoId: body.debitMemoId,
      originalClaimAmount: body.originalClaimAmount,
      concessionValue: body.concessionValue,
      concessionDescription: body.concessionDescription,
      applicableOrders: body.applicableOrders,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      minimumOrderValue: body.minimumOrderValue,
      termsAndConditions: body.termsAndConditions,
      createdBy: body.createdBy || 'system',
    });

    return NextResponse.json(concession, { status: 201 });
  } catch (error: any) {
    console.error('Error creating concession:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
