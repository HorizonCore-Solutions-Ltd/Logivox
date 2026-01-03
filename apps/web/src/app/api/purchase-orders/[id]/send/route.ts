export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email-service';

// ============================================================================
// POST /api/purchase-orders/[id]/send - Send PO to supplier
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
        items: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Check if PO can be sent
    if (existingPO.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Purchase order must be approved before sending' },
        { status: 400 }
      );
    }

    // Check if supplier has email
    if (!existingPO.supplier.email) {
      return NextResponse.json(
        { error: 'Supplier does not have an email address' },
        { status: 400 }
      );
    }

    // Update PO status to SENT
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    // Send email to supplier
    if (existingPO.supplier.email) {
      await sendEmail({
        to: existingPO.supplier.email,
        subject: `Purchase Order ${existingPO.poNumber}`,
        html: `
          <h2>Purchase Order ${existingPO.poNumber}</h2>
          <p>Dear ${existingPO.supplier.name},</p>
          <p>Please find attached purchase order details below:</p>
          <ul>
            <li><strong>PO Number:</strong> ${existingPO.poNumber}</li>
            <li><strong>Total Amount:</strong> $${existingPO.totalAmount.toFixed(2)}</li>
            <li><strong>Items:</strong> ${existingPO.items.length}</li>
            <li><strong>Expected Date:</strong> ${existingPO.expectedDate?.toLocaleDateString() || 'TBD'}</li>
          </ul>
          <p>Thank you for your business!</p>
        `,
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: 'SEND',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        metadata: { 
          poNumber: purchaseOrder.poNumber,
          supplierEmail: existingPO.supplier.email,
          status: 'SENT',
        },
      },
    });

    return NextResponse.json({
      purchaseOrder,
      message: 'Purchase order sent to supplier successfully',
      supplierEmail: existingPO.supplier.email,
    });

  } catch (error) {
    console.error('Error sending purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to send purchase order' },
      { status: 500 }
    );
  }
}
