/**
 * Packing Operations API
 * Handles pack creation, cartonization, and packer productivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { PackingService } from '@/lib/services/packing.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get pack details or packer metrics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pack':
        const packId = searchParams.get('packId');
        if (!packId) {
          return NextResponse.json(
            { error: 'Pack ID is required' },
            { status: 400 }
          );
        }

        const pack = await prisma.pack.findUnique({
          where: { id: packId },
          include: { salesOrder: true, packages: true },
        });
        return NextResponse.json(pack);

      case 'packer-metrics':
        const packerId = searchParams.get('packerId');
        const warehouseId = searchParams.get('warehouseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!warehouseId || !packerId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required parameters (warehouseId, packerId, startDate, endDate)' },
            { status: 400 }
          );
        }

        const metrics = await PackingService.getPackerMetrics({
          warehouseId,
          packedById: packerId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });

        return NextResponse.json(metrics);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pack, packer-metrics' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Packing GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - Create pack, cartonize, start/complete packing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create-pack':
        const { organizationId, salesOrderId, pickListId, createdById, warehouseId: packWarehouseId, packages } = body;
        
        if (!organizationId || !salesOrderId || !createdById || !packWarehouseId || !packages) {
          return NextResponse.json(
            { error: 'Missing required fields (organizationId, salesOrderId, createdById, warehouseId, packages)' },
            { status: 400 }
          );
        }

        const pack = await PackingService.createPack({
          organizationId,
          warehouseId: packWarehouseId,
          salesOrderId,
          packages,
          createdById,
        });

        return NextResponse.json(pack, { status: 201 });

      case 'cartonize':
        const { salesOrderId: cartonizeOrderId, items: cartonizeItems } = body;
        
        if (!cartonizeOrderId || !cartonizeItems) {
          return NextResponse.json(
            { error: 'salesOrderId and items are required' },
            { status: 400 }
          );
        }

        const cartonized = await PackingService.cartonizeOrder({
          salesOrderId: cartonizeOrderId,
          items: cartonizeItems,
        });

        return NextResponse.json(cartonized);

      case 'start-packing':
        const { packId: startPackId, packerId } = body;
        
        if (!startPackId || !packerId) {
          return NextResponse.json(
            { error: 'Pack ID and Packer ID are required' },
            { status: 400 }
          );
        }

        const started = await PackingService.startPacking({
          packId: startPackId,
          packedById: packerId,
        });

        return NextResponse.json(started);

      case 'complete-pack':
        const { packId: completePackId, weight, dimensions } = body;
        
        if (!completePackId) {
          return NextResponse.json(
            { error: 'Pack ID is required' },
            { status: 400 }
          );
        }

        const completed = await PackingService.completePack(completePackId);

        return NextResponse.json(completed);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Packing POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
