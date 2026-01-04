/**
 * Customer Portal - Individual Return Management
 * GET /api/portal/returns/[id] - Get return details
 * POST /api/portal/returns/[id]/cancel - Cancel return
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerUser = await prisma.customerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!customerUser) {
      return NextResponse.json({ error: 'Customer access required' }, { status: 403 });
    }

    // Get return - verify it belongs to customer
    const rma = await prisma.rMA.findFirst({
      where: {
        id: params.id,
        customerId: customerUser.customerId,
      },
      include: {
        returnReason: true,
        items: {
          include: {
            inventoryItem: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
        salesOrder: {
          select: {
            soNumber: true,
            orderDate: true,
          },
        },
        returnLabels: {
          where: {
            voidedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!rma) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Get tracking events if label exists
    let trackingInfo = null;
    if (rma.returnLabels && rma.returnLabels.length > 0) {
      const label = rma.returnLabels[0];
      trackingInfo = {
        trackingNumber: label.trackingNumber,
        carrier: label.carrier,
        status: label.trackingStatus,
        events: label.trackingEvents,
        labelUrl: label.labelUrl,
      };
    }

    return NextResponse.json({
      rma: {
        ...rma,
        returnLabels: undefined, // Remove from response, use trackingInfo instead
      },
      trackingInfo,
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return details' },
      { status: 500 }
    );
  }
}
