/**
 * Bulk Operations API for Returns
 * POST /api/returns/bulk/approve - Batch approve returns
 * POST /api/returns/bulk/process - Batch process returns
 * POST /api/returns/bulk/labels - Batch generate labels
 * POST /api/returns/bulk/export - Export returns data
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { returnsNotificationService } from '@/lib/services/returns/notification-service';

const bulkApproveSchema = z.object({
  rmaIds: z.array(z.string()).min(1).max(100),
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

const bulkProcessSchema = z.object({
  rmaIds: z.array(z.string()).min(1).max(100),
  action: z.enum(['restock', 'refund', 'both']),
  restockLocation: z.string().optional(),
});

const bulkLabelsSchema = z.object({
  rmaIds: z.array(z.string()).min(1).max(50),
  carrier: z.string(),
  serviceLevel: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const body = await request.json();

    if (operation === 'approve') {
      return await handleBulkApprove(body, membership, session.user.id);
    }

    if (operation === 'process') {
      return await handleBulkProcess(body, membership, session.user.id);
    }

    if (operation === 'labels') {
      return await handleBulkLabels(body, membership, session.user.id);
    }

    if (operation === 'export') {
      return await handleBulkExport(body, membership);
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Bulk operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleBulkApprove(
  body: any,
  membership: any,
  userId: string
): Promise<NextResponse> {
  const data = bulkApproveSchema.parse(body);

  // Verify all RMAs belong to organization
  const rmas = await prisma.rMA.findMany({
    where: {
      id: { in: data.rmaIds },
      organizationId: membership.organizationId,
      status: 'PENDING',
    },
    include: {
      customer: true,
    },
  });

  if (rmas.length !== data.rmaIds.length) {
    return NextResponse.json(
      { error: 'Some RMAs not found or already processed' },
      { status: 404 }
    );
  }

  const results = {
    succeeded: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  // Process each RMA
  for (const rma of rmas) {
    try {
      await prisma.rMA.update({
        where: { id: rma.id },
        data: {
          status: data.approve ? 'APPROVED' : 'REJECTED',
          approvedById: userId,
          approvedDate: new Date(),
          rejectionReason: data.approve ? null : data.rejectionReason,
        },
      });

      // Send notification
      await returnsNotificationService.notifyCustomer(
        data.approve ? 'return_approved' : 'return_rejected',
        rma.id
      );

      results.succeeded.push(rma.id);

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          action: data.approve ? 'RMA_BULK_APPROVED' : 'RMA_BULK_REJECTED',
          entityType: 'RMA',
          entityId: rma.id,
          metadata: {
            rmaNumber: rma.rmaNumber,
            bulkOperation: true,
          },
        },
      });
    } catch (error) {
      results.failed.push({
        id: rma.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${results.succeeded.length} of ${data.rmaIds.length} RMAs`,
    results,
  });
}

async function handleBulkProcess(
  body: any,
  membership: any,
  userId: string
): Promise<NextResponse> {
  const data = bulkProcessSchema.parse(body);

  const rmas = await prisma.rMA.findMany({
    where: {
      id: { in: data.rmaIds },
      organizationId: membership.organizationId,
      status: { in: ['RECEIVED', 'INSPECTING'] },
    },
    include: {
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (rmas.length !== data.rmaIds.length) {
    return NextResponse.json(
      { error: 'Some RMAs not found or not ready for processing' },
      { status: 404 }
    );
  }

  const results = {
    succeeded: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const rma of rmas) {
    try {
      await prisma.$transaction(async (tx) => {
        // Restock items if requested
        if (data.action === 'restock' || data.action === 'both') {
          for (const item of rma.items) {
            if (item.quantityAccepted && item.quantityAccepted > 0) {
              await tx.inventoryItem.update({
                where: { id: item.inventoryId },
                data: {
                  currentQty: { increment: item.quantityAccepted },
                  availableQty: { increment: item.quantityAccepted },
                },
              });

              await tx.rMAItem.update({
                where: { id: item.id },
                data: {
                  isRestocked: true,
                  restockedDate: new Date(),
                  restockedById: userId,
                },
              });
            }
          }
        }

        // Update RMA status
        await tx.rMA.update({
          where: { id: rma.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            inspectedById: userId,
            inspectedDate: new Date(),
          },
        });
      });

      // Send notification
      await returnsNotificationService.notifyCustomer('return_processed', rma.id);

      results.succeeded.push(rma.id);

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          action: 'RMA_BULK_PROCESSED',
          entityType: 'RMA',
          entityId: rma.id,
          metadata: {
            rmaNumber: rma.rmaNumber,
            action: data.action,
            bulkOperation: true,
          },
        },
      });
    } catch (error) {
      results.failed.push({
        id: rma.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${results.succeeded.length} of ${data.rmaIds.length} RMAs`,
    results,
  });
}

async function handleBulkLabels(
  body: any,
  membership: any,
  userId: string
): Promise<NextResponse> {
  const data = bulkLabelsSchema.parse(body);

  return NextResponse.json({
    message: 'Bulk label generation not yet implemented',
    note: 'Use individual label generation API for now',
  });
}

async function handleBulkExport(
  body: any,
  membership: any
): Promise<NextResponse> {
  const { rmaIds, format = 'csv' } = body;

  // Get RMAs with all details
  const rmas = await prisma.rMA.findMany({
    where: {
      ...(rmaIds ? { id: { in: rmaIds } } : {}),
      organizationId: membership.organizationId,
    },
    include: {
      customer: true,
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
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: rmaIds ? undefined : 1000,
  });

  if (format === 'csv') {
    // Generate CSV
    const csvRows = [
      ['RMA Number', 'Status', 'Customer', 'Order', 'Items', 'Total Amount', 'Requested Date', 'Reason'].join(','),
    ];

    for (const rma of rmas) {
      csvRows.push(
        [
          rma.rmaNumber,
          rma.status,
          rma.customer.name,
          rma.salesOrder?.soNumber || 'N/A',
          rma.items.length.toString(),
          rma.totalRefundAmount?.toString() || '0',
          rma.requestedDate.toISOString().split('T')[0],
          rma.returnReason.reason,
        ].join(',')
      );
    }

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="returns-${Date.now()}.csv"`,
      },
    });
  }

  // Return JSON by default
  return NextResponse.json({ rmas, count: rmas.length });
}
