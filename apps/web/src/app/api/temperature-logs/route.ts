export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendSMS } from '@/lib/services/sms-service';

const tempLogSchema = z.object({
  warehouseId: z.string(),
  locationId: z.string().optional(),
  temperature: z.number(),
  humidity: z.number().min(0).max(100).optional(),
  deviceId: z.string().optional(),
  sensorType: z.enum(['MANUAL', 'AUTOMATED', 'IOT_SENSOR']).default('MANUAL'),
  notes: z.string().optional(),
});

/**
 * GET /api/temperature-logs
 * List temperature logs
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
    const warehouseId = searchParams.get('warehouseId');
    const locationId = searchParams.get('locationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const logs = await prisma.temperatureLog.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(locationId && { locationId }),
        ...(startDate && { timestamp: { gte: new Date(startDate) } }),
        ...(endDate && { timestamp: { lte: new Date(endDate) } }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
        recordedBy: { select: { name: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching temperature logs:', error);
    return NextResponse.json({ error: 'Failed to fetch temperature logs' }, { status: 500 });
  }
}

/**
 * POST /api/temperature-logs
 * Record a temperature reading
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
    const validatedData = tempLogSchema.parse(body);

    // Get warehouse temperature thresholds
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: validatedData.warehouseId, organizationId },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Check for temperature violations
    const minTemp = warehouse.minTemperature || -20; // Default cold storage range
    const maxTemp = warehouse.maxTemperature || 25;
    const isViolation = validatedData.temperature < minTemp || validatedData.temperature > maxTemp;

    const log = await prisma.temperatureLog.create({
      data: {
        ...validatedData,
        organizationId,
        recordedById: session.user.id,
        timestamp: new Date(),
        isViolation,
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
        recordedBy: { select: { name: true, email: true } },
      },
    });

    // Send alert for temperature violations
    if (isViolation) {
      // Find warehouse manager
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
          message: `🌡️ TEMPERATURE ALERT: ${warehouse.name} - ${validatedData.temperature}°C (Expected: ${minTemp}°C to ${maxTemp}°C)`,
        });
      }

      // Create alert in system
      await prisma.alert.create({
        data: {
          organizationId,
          type: 'TEMPERATURE_VIOLATION',
          severity: 'HIGH',
          title: 'Temperature Out of Range',
          message: `Temperature reading of ${validatedData.temperature}°C at ${warehouse.name} is outside acceptable range (${minTemp}°C to ${maxTemp}°C)`,
          metadata: {
            logId: log.id,
            temperature: validatedData.temperature,
            minTemp,
            maxTemp,
          },
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'TEMPERATURE_LOG_RECORDED',
        entityType: 'TemperatureLog',
        entityId: log.id,
        metadata: {
          temperature: log.temperature,
          humidity: log.humidity,
          isViolation,
        },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating temperature log:', error);
    return NextResponse.json({ error: 'Failed to create temperature log' }, { status: 500 });
  }
}
