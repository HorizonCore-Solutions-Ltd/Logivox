/**
 * Return-to-Vendor (RTV) API
 * GET /api/returns/rtv - List RTV requests
 * POST /api/returns/rtv - Create RTV request
 * GET /api/returns/rtv/policies - List vendor return policies
 * POST /api/returns/rtv/policies - Create vendor policy
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { RTVService } from '@/lib/services/returns/rtv-management';

const createRTVSchema = z.object({
  vendorId: z.string(),
  rmaItemIds: z.array(z.string()),
  reason: z.string(),
  requestedAction: z.enum(['REFUND', 'REPLACEMENT', 'CREDIT']),
  estimatedValue: z.number(),
  notes: z.string().optional(),
});

const createPolicySchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  allowsReturns: z.boolean().default(true),
  returnWindowDays: z.number(),
  requiresAuthorization: z.boolean().default(true),
  restockingFee: z.number().optional(),
  acceptedConditions: z.array(z.string()),
  acceptedReasons: z.array(z.string()),
  shippingResponsibility: z.enum(['VENDOR', 'CUSTOMER', 'SHARED']),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');

    if (type === 'policies') {
      let query = `
        SELECT * FROM vendor_return_policies
        WHERE organization_id = $1
      `;
      const params: any[] = [membership.organizationId];

      if (vendorId) {
        query += ` AND vendor_id = $${params.length + 1}`;
        params.push(vendorId);
      }

      query += ` ORDER BY vendor_name`;

      const policies = await prisma.$queryRawUnsafe(query, ...params);
      return NextResponse.json({ policies });
    }

    // Get RTV requests
    let query = `
      SELECT rtv.*, v.name as vendor_name,
             COUNT(DISTINCT ri.id) as item_count
      FROM rtv_requests rtv
      LEFT JOIN "Vendor" v ON v.id = rtv.vendor_id
      LEFT JOIN "RMAItem" ri ON ri.id = ANY(rtv.rma_item_ids)
      WHERE rtv.organization_id = $1
    `;

    const params: any[] = [membership.organizationId];

    if (status) {
      query += ` AND rtv.status = $${params.length + 1}`;
      params.push(status);
    }

    if (vendorId) {
      query += ` AND rtv.vendor_id = $${params.length + 1}`;
      params.push(vendorId);
    }

    query += ` GROUP BY rtv.id, v.name ORDER BY rtv.created_at DESC LIMIT 100`;

    const requests = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching RTV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RTV data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No active organization' }, { status: 404 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'policy') {
      const data = createPolicySchema.parse(body);

      await prisma.$executeRaw`
        INSERT INTO vendor_return_policies (
          id, organization_id, vendor_id, vendor_name, allows_returns,
          return_window_days, requires_authorization, restocking_fee,
          accepted_conditions, accepted_reasons, shipping_responsibility,
          metadata, created_at, created_by
        ) VALUES (
          gen_random_uuid(), ${membership.organizationId}, ${data.vendorId},
          ${data.vendorName}, ${data.allowsReturns}, ${data.returnWindowDays},
          ${data.requiresAuthorization}, ${data.restockingFee || null},
          ${JSON.stringify(data.acceptedConditions)}::jsonb,
          ${JSON.stringify(data.acceptedReasons)}::jsonb,
          ${data.shippingResponsibility}, '{}'::jsonb, NOW(), ${session.user.id}
        )
      `;

      return NextResponse.json({ message: 'Vendor policy created successfully' });
    }

    // Create RTV request
    const data = createRTVSchema.parse(body);

    // Verify RMA items
    const rmaItems = await prisma.rMAItem.findMany({
      where: {
        id: { in: data.rmaItemIds },
      },
      include: {
        rma: true,
        product: true,
      },
    });

    if (rmaItems.length !== data.rmaItemIds.length) {
      return NextResponse.json({ error: 'Some RMA items not found' }, { status: 404 });
    }

    // Verify all items belong to organization
    const invalidItems = rmaItems.filter(
      item => item.rma.organizationId !== membership.organizationId
    );

    if (invalidItems.length > 0) {
      return NextResponse.json({ error: 'Invalid RMA items' }, { status: 400 });
    }

    // Check vendor policy
    const policy = await prisma.$queryRaw`
      SELECT * FROM vendor_return_policies
      WHERE vendor_id = ${data.vendorId}
        AND organization_id = ${membership.organizationId}
        AND allows_returns = true
    ` as any[];

    const requiresAuth = policy.length > 0 ? policy[0].requires_authorization : true;

    const rtvService = new RTVService();
    const rtvRequest = await rtvService.createRTVRequest({
      vendorId: data.vendorId,
      rmaItemIds: data.rmaItemIds,
      reason: data.reason,
      requestedAction: data.requestedAction,
      estimatedValue: data.estimatedValue,
      items: rmaItems.map(item => ({
        rmaItemId: item.id,
        sku: item.sku || '',
        quantity: item.quantity,
        condition: item.condition || 'USED',
        defectDescription: data.reason,
      })),
    });

    await prisma.$executeRaw`
      INSERT INTO rtv_requests (
        id, organization_id, vendor_id, rma_item_ids, status,
        reason, requested_action, estimated_value, items,
        requires_authorization, metadata, created_at, created_by
      ) VALUES (
        ${rtvRequest.id}, ${membership.organizationId}, ${data.vendorId},
        ${data.rmaItemIds}, ${rtvRequest.status}, ${data.reason},
        ${data.requestedAction}, ${data.estimatedValue},
        ${JSON.stringify(rtvRequest.items)}::jsonb, ${requiresAuth},
        ${JSON.stringify({ notes: data.notes })}::jsonb,
        NOW(), ${session.user.id}
      )
    `;

    // Update RMA items
    await prisma.rMAItem.updateMany({
      where: { id: { in: data.rmaItemIds } },
      data: { disposition: 'RETURN_TO_VENDOR' },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: 'RTV_REQUEST_CREATED',
        entityType: 'RTV_REQUEST',
        entityId: rtvRequest.id,
        metadata: {
          vendorId: data.vendorId,
          itemCount: data.rmaItemIds.length,
          estimatedValue: data.estimatedValue,
        },
      },
    });

    return NextResponse.json({
      rtvRequest,
      message: 'RTV request created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating RTV data:', error);
    return NextResponse.json(
      { error: 'Failed to create RTV data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
