/**
 * Label Tracking API
 * GET /api/returns/labels/[id]/track - Get shipment tracking
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LabelServiceFactory } from '@/lib/services/returns/label-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get label
    const label = await prisma.$queryRaw`
      SELECT rl.*, r.organization_id, r.rma_number
      FROM return_labels rl
      JOIN "RMA" r ON r.id = rl.rma_id
      WHERE rl.id = ${params.id}
        AND r.organization_id = ${membership.organizationId}
    ` as any[];

    if (!label || label.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    const labelData = label[0];

    // Get tracking from carrier
    const settings = await prisma.$queryRaw`
      SELECT * FROM return_settings WHERE organization_id = ${membership.organizationId}
    ` as any[];
    const labelSettings = settings[0]?.labels || {};
    const provider = labelSettings.provider || process.env.LABEL_PROVIDER || 'shipstation';

    const labelService = LabelServiceFactory.create(provider, {
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
      apiSecret: process.env[`${provider.toUpperCase()}_API_SECRET`],
    });

    const tracking = await labelService.trackShipment(labelData.tracking_number);

    // Update label with latest tracking
    await prisma.$executeRaw`
      UPDATE return_labels
      SET 
        tracking_status = ${tracking.status},
        tracking_events = ${JSON.stringify(tracking.events)}::jsonb,
        delivered_at = ${tracking.deliveredAt},
        updated_at = NOW()
      WHERE id = ${params.id}
    `;

    // If delivered, update RMA status
    if (tracking.status === 'DELIVERED' && labelData.type === 'PREPAID') {
      await prisma.rMA.update({
        where: { id: labelData.rma_id },
        data: { status: 'IN_TRANSIT' },
      });
    }

    return NextResponse.json({
      tracking,
      label: {
        id: labelData.id,
        rmaNumber: labelData.rma_number,
        trackingNumber: labelData.tracking_number,
        carrier: labelData.carrier,
      },
    });
  } catch (error) {
    console.error('Error tracking label:', error);
    return NextResponse.json(
      { error: 'Failed to track shipment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
