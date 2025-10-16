import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating PO
const updatePOSchema = z.object({
  expectedDate: z.string().datetime().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryCountry: z.string().optional(),
  deliveryNotes: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// ============================================================================
// GET /api/purchase-orders/[id] - Get single purchase order
// ============================================================================

export async function GET(
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

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        receipts: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ purchaseOrder });

  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/purchase-orders/[id] - Update purchase order
// ============================================================================

export async function PUT(
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

    const body = await req.json();
    const validatedData = updatePOSchema.parse(body);

    // Check if PO exists and is editable
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'PENDING'].includes(existingPO.status)) {
      return NextResponse.json(
        { error: 'Cannot update purchase order in current status' },
        { status: 400 }
      );
    }

    // Update PO
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : undefined,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'PurchaseOrder',
        entityId: purchaseOrder.id,
        metadata: { poNumber: purchaseOrder.poNumber },
      },
    });

    return NextResponse.json({
      purchaseOrder,
      message: 'Purchase order updated successfully',
    });

  } catch (error) {
    console.error('Error updating purchase order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/purchase-orders/[id] - Delete purchase order
// ============================================================================

export async function DELETE(
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

    // Check if PO exists and can be deleted
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        receipts: true,
      },
    });

    if (!existingPO) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of DRAFT or CANCELLED POs with no receipts
    if (existingPO.receipts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete purchase order with receipts' },
        { status: 400 }
      );
    }

    if (!['DRAFT', 'CANCELLED'].includes(existingPO.status)) {
      return NextResponse.json(
        { error: 'Can only delete DRAFT or CANCELLED purchase orders' },
        { status: 400 }
      );
    }

    // Delete PO (items will be cascade deleted)
    await prisma.purchaseOrder.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: existingPO.organizationId,
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'PurchaseOrder',
        entityId: existingPO.id,
        metadata: { poNumber: existingPO.poNumber },
      },
    });

    return NextResponse.json({
      message: 'Purchase order deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
