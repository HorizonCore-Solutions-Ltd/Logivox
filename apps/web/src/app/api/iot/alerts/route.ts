export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendSMS } from '@/lib/services/sms-service';

const alertSchema = z.object({
  deviceId: z.string(),
  alertType: z.enum(['ERROR', 'WARNING', 'INFO', 'CRITICAL']),
  message: z.string().min(1),
  severity: z.number().int().min(1).max(5).default(3),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/iot/alerts
 * List all IoT device alerts
 */
export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const alertType = searchParams.get('alertType');
    const isResolved = searchParams.get('isResolved');

    const alerts = await prisma.ioTAlert.findMany({
      where: {
        organizationId,
        ...(deviceId && { deviceId }),
        ...(alertType && { alertType: alertType as any }),
        ...(isResolved !== null && { isResolved: isResolved === 'true' }),
      },
      include: {
        device: {
          select: {
            id: true,
            deviceId: true,
            name: true,
            deviceType: true,
            warehouse: { select: { name: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('Error fetching IoT alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch IoT alerts' }, { status: 500 });
  }
}

/**
 * POST /api/iot/alerts
 * Create a new IoT device alert
 */
export async function POST(req: NextRequest) {
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
    const validatedData = alertSchema.parse(body);

    const device = await prisma.ioTDevice.findFirst({
      where: {
        id: validatedData.deviceId,
        organizationId,
      },
      include: {
        warehouse: true,
      },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const alert = await prisma.ioTAlert.create({
      data: {
        ...validatedData,
        organizationId,
        timestamp: new Date(),
      },
      include: {
        device: {
          select: {
            id: true,
            deviceId: true,
            name: true,
            deviceType: true,
          },
        },
      },
    });

    // Send SMS for critical alerts
    if (validatedData.alertType === 'CRITICAL' || validatedData.severity >= 4) {
      // Get warehouse manager phone
      const manager = await prisma.user.findFirst({
        where: {
          organizationMemberships: {
            some: {
              organizationId,
              role: { in: ['ADMIN', 'MANAGER'] },
            },
          },
        },
      });

      if (manager?.phone) {
        await sendSMS({
          to: manager.phone,
          message: `🚨 CRITICAL IoT Alert: ${device.name} (${device.deviceId}) - ${validatedData.message}`,
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'IOT_ALERT_CREATED',
        entityType: 'IoTAlert',
        entityId: alert.id,
        metadata: {
          deviceId: device.deviceId,
          alertType: alert.alertType,
          message: alert.message,
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating IoT alert:', error);
    return NextResponse.json({ error: 'Failed to create IoT alert' }, { status: 500 });
  }
}
