import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shipmentId } = params;

    // Get shipment info
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        statusHistory: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Get blockchain transactions for this shipment
    const transactions = await prisma.blockchainTransaction.findMany({
      where: {
        entityType: 'SHIPMENT',
        entityId: shipmentId,
        status: 'CONFIRMED',
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    const trace = {
      shipmentId: shipment.id,
      currentStatus: shipment.status,
      origin: shipment.originWarehouse.name,
      destination: shipment.destinationWarehouse?.name || 'Unknown',
      checkpoints: shipment.statusHistory.map((history, index) => {
        const tx = transactions[index];
        return {
          timestamp: history.timestamp.toISOString(),
          location: history.notes || 'Warehouse',
          status: history.status,
          verifiedBy: tx?.from || 'System',
          blockchainHash: tx?.transactionHash || 'N/A',
        };
      }),
    };

    return NextResponse.json(trace);
  } catch (error) {
    console.error('Error tracing shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
