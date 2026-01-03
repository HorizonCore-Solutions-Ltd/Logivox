export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']).optional(),
  locationId: z.string().optional(),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().optional(),
  configuration: z.record(z.any()).optional(),
});

const heartbeatSchema = z.object({
  metrics: z.record(z.any()).optional(),
});

/**
 * GET /api/iot/devices/[id]
 * Get device details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const device = await prisma.ioTDevice.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        warehouse: true,
        location: true,
        alerts: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json(device);
  } catch (error: any) {
    console.error('Error fetching device:', error);
    return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 });
  }
}

/**
 * PUT /api/iot/devices/[id]
 * Update device
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = updateDeviceSchema.parse(body);

    const existingDevice = await prisma.ioTDevice.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const device = await prisma.ioTDevice.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        warehouse: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'IOT_DEVICE_UPDATED',
        entityType: 'IoTDevice',
        entityId: device.id,
        metadata: {
          deviceId: device.deviceId,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(device);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

/**
 * POST /api/iot/devices/[id]/heartbeat
 * Update device heartbeat and status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { metrics } = heartbeatSchema.parse(body);

    const device = await prisma.ioTDevice.findUnique({
      where: { id: params.id },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await prisma.ioTDevice.update({
      where: { id: params.id },
      data: {
        lastSeen: new Date(),
        status: 'ONLINE',
        ...(metrics && { metrics }),
      },
    });

    return NextResponse.json({ success: true, message: 'Heartbeat recorded' });
  } catch (error: any) {
    console.error('Error recording heartbeat:', error);
    return NextResponse.json({ error: 'Failed to record heartbeat' }, { status: 500 });
  }
}
