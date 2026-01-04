/**
 * Individual Label Management API
 * GET /api/returns/labels/[id] - Get label details
 * DELETE /api/returns/labels/[id] - Void a label
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

    const label = await prisma.$queryRaw`
      SELECT rl.*, r.rma_number, r.status as rma_status
      FROM return_labels rl
      JOIN "RMA" r ON r.id = rl.rma_id
      WHERE rl.id = ${params.id}
        AND r.organization_id = ${membership.organizationId}
    ` as any[];

    if (!label || label.length === 0) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    return NextResponse.json({ label: label[0] });
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch label' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      SELECT rl.*, r.organization_id
      FROM return_labels rl
      JOIN "RMA" r ON r.id = rl.rma_id
      WHERE rl.id = ${params.id}
        AND r.organization_id = ${membership.organizationId}
        AND rl.voided_at IS NULL
    ` as any[];

    if (!label || label.length === 0) {
      return NextResponse.json({ error: 'Label not found or already voided' }, { status: 404 });
    }

    const labelData = label[0];

    // Void with carrier
    const settings = await prisma.$queryRaw`
      SELECT * FROM return_settings WHERE organization_id = ${membership.organizationId}
    ` as any[];
    const labelSettings = settings[0]?.labels || {};
    const provider = labelSettings.provider || process.env.LABEL_PROVIDER || 'shipstation';

    const labelService = LabelServiceFactory.create(provider, {
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
      apiSecret: process.env[`${provider.toUpperCase()}_API_SECRET`],
    });

    await labelService.voidLabel(labelData.id);

    // Mark as voided
    await prisma.$executeRaw`
      UPDATE return_labels
      SET voided_at = NOW(), voided_by = ${session.user.id}
      WHERE id = ${params.id}
    `;

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: membership.organizationId,
        userId: session.user.id,
        action: 'RETURN_LABEL_VOIDED',
        entityType: 'RETURN_LABEL',
        entityId: params.id,
        metadata: {
          trackingNumber: labelData.tracking_number,
          carrier: labelData.carrier,
        },
      },
    });

    return NextResponse.json({ message: 'Label voided successfully' });
  } catch (error) {
    console.error('Error voiding label:', error);
    return NextResponse.json(
      { error: 'Failed to void label', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
