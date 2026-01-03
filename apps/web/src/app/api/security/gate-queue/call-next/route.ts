import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/services/sms-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gateId = searchParams.get('gateId');

    const where: any = {
      organizationId: session.user.organizationId,
      status: 'WAITING',
    };

    if (gateId) {
      where.gateId = gateId;
    }

    // Get next vehicle in queue (highest priority, then earliest arrival)
    const nextInQueue = await prisma.gateQueue.findFirst({
      where,
      orderBy: [
        { priority: 'desc' },
        { arrivalTime: 'asc' },
      ],
    });

    if (!nextInQueue) {
      return NextResponse.json(
        { error: 'No vehicles in queue' },
        { status: 404 }
      );
    }

    // Update status to CALLED
    const updated = await prisma.gateQueue.update({
      where: { id: nextInQueue.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
    });

    // Send notification to driver if phone number is available
    if (updated.driverPhone) {
      await sendSMS({
        to: updated.driverPhone,
        message: `Your vehicle ${updated.licensePlate} is being called to the gate. Please proceed to the entrance.`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error calling next vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to call next vehicle' },
      { status: 500 }
    );
  }
}
