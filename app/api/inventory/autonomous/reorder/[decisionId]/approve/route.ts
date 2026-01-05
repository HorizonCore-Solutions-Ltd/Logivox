/**
 * Autonomous Decision Approval API
 * Manual approval/rejection of autonomous decisions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/autonomous/reorder/[decisionId]/approve
 * Approve or reject a pending autonomous decision
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { decisionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { decisionId } = params;
    const body = await request.json();
    const { action, notes } = body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get decision
    const decision = await prisma.autonomousDecision.findFirst({
      where: {
        id: decisionId,
        organizationId: session.user.organizationId
      },
      include: {
        product: {
          include: {
            product: true
          }
        }
      }
    });

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    if (decision.result !== 'PENDING') {
      return NextResponse.json(
        { error: `Decision already ${decision.result.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Execute the purchase order
      const reasoning = decision.reasoning as any;
      const supplier = reasoning.supplier || { id: 'default-supplier' };
      
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber: `AUTO-PO-${Date.now()}`,
          supplierId: supplier.id,
          organizationId: session.user.organizationId,
          status: 'APPROVED', // Auto-approve since manual approval given
          totalAmount: parseFloat(decision.estimatedCost.toString()),
          expectedDelivery: reasoning.expectedDelivery || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          notes: `Autonomous reorder - Manual approval by ${session.user.name}\n${notes || ''}`,
          items: {
            create: [{
              productId: decision.productId,
              quantity: reasoning.quantity,
              unitPrice: reasoning.unitPrice || 0,
              totalPrice: parseFloat(decision.estimatedCost.toString())
            }]
          }
        }
      });

      // Update decision
      await prisma.autonomousDecision.update({
        where: { id: decisionId },
        data: {
          result: 'SUCCESS',
          actionTaken: true,
          purchaseOrderId: purchaseOrder.id,
          metadata: {
            ...decision.metadata as any,
            approvedBy: session.user.id,
            approvedAt: new Date().toISOString(),
            approvalNotes: notes
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Decision approved and purchase order created',
        data: {
          decisionId,
          purchaseOrder: {
            id: purchaseOrder.id,
            poNumber: purchaseOrder.poNumber,
            status: purchaseOrder.status,
            totalAmount: purchaseOrder.totalAmount
          }
        }
      });

    } else {
      // Reject the decision
      await prisma.autonomousDecision.update({
        where: { id: decisionId },
        data: {
          result: 'REJECTED',
          actionTaken: false,
          metadata: {
            ...decision.metadata as any,
            rejectedBy: session.user.id,
            rejectedAt: new Date().toISOString(),
            rejectionReason: notes
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Decision rejected',
        data: {
          decisionId,
          status: 'REJECTED'
        }
      });
    }

  } catch (error: any) {
    console.error('Decision approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval', message: error.message },
      { status: 500 }
    );
  }
}
