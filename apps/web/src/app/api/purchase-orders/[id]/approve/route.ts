import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================================================
// POST /api/purchase-orders/[id]/approve - Approve purchase order
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if PO exists
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Check if PO can be approved
    if (existingPO.status !== 'PENDING' && existingPO.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot approve purchase order with status: ${existingPO.status}` },
        { status: 400 }
      );
    }

    // Approve PO
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        approvedById: session.user.id,
      },
      include: {
        supplier: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: 'APPROVE',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        metadata: { 
          poNumber: purchaseOrder.poNumber,
          status: 'APPROVED',
        },
      },
    });

    return NextResponse.json({
      purchaseOrder,
      message: 'Purchase order approved successfully',
    });

  } catch (error) {
    console.error('Error approving purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to approve purchase order' },
      { status: 500 }
    );
  }
}
