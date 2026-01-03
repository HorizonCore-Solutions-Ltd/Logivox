import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const logTempSchema = z.object({
  temperature: z.number(),
  unit: z.enum(['CELSIUS', 'FAHRENHEIT']),
  sensorId: z.string().optional(),
  location: z.string().optional(), // "FRONT", "REAR", "MIDDLE"
  targetMin: z.number().optional(),
  targetMax: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    const body = await req.json();
    const data = logTempSchema.parse(body);

    // Check if temperature is out of range
    let isOutOfRange = false;
    if (data.targetMin !== undefined && data.temperature < data.targetMin) {
      isOutOfRange = true;
    }
    if (data.targetMax !== undefined && data.temperature > data.targetMax) {
      isOutOfRange = true;
    }

    // Create temperature log
    const tempLog = await prisma.temperatureLog.create({
      data: {
        gateEntryId,
        organizationId: session.user.organizationId,
        temperature: data.temperature,
        unit: data.unit,
        sensorId: data.sensorId,
        location: data.location,
        targetMin: data.targetMin,
        targetMax: data.targetMax,
        isOutOfRange,
        recordedBy: session.user.id,
        notes: data.notes,
      },
    });

    // Create alert if out of range
    if (isOutOfRange) {
      await prisma.securityAlert.create({
        data: {
          organizationId: session.user.organizationId,
          type: 'TEMPERATURE_VIOLATION',
          severity: 'HIGH',
          message: `Temperature out of range for vehicle ${gateEntry.licensePlate || gateEntry.vehicleNumber}: ${data.temperature}°${data.unit === 'CELSIUS' ? 'C' : 'F'}`,
          metadata: {
            gateEntryId,
            temperature: data.temperature,
            unit: data.unit,
            targetMin: data.targetMin,
            targetMax: data.targetMax,
            location: data.location,
          },
        },
      });
    }

    return NextResponse.json({
      tempLog,
      alert: isOutOfRange ? {
        type: 'OUT_OF_RANGE',
        message: `Temperature ${data.temperature}°${data.unit === 'CELSIUS' ? 'C' : 'F'} is outside target range ${data.targetMin}-${data.targetMax}`,
      } : null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error logging temperature:', error);
    return NextResponse.json(
      { error: 'Failed to log temperature' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateEntryId = params.id;

    // Verify gate entry exists and belongs to organization
    const gateEntry = await prisma.gateEntry.findFirst({
      where: {
        id: gateEntryId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gateEntry) {
      return NextResponse.json({ error: 'Gate entry not found' }, { status: 404 });
    }

    const logs = await prisma.temperatureLog.findMany({
      where: { gateEntryId },
      orderBy: { recordedAt: 'desc' },
    });

    // Calculate summary
    const outOfRangeCount = logs.filter((log) => log.isOutOfRange).length;
    const avgTemp = logs.length > 0
      ? logs.reduce((sum, log) => sum + parseFloat(log.temperature.toString()), 0) / logs.length
      : 0;
    const minTemp = logs.length > 0
      ? Math.min(...logs.map((log) => parseFloat(log.temperature.toString())))
      : 0;
    const maxTemp = logs.length > 0
      ? Math.max(...logs.map((log) => parseFloat(log.temperature.toString())))
      : 0;

    return NextResponse.json({
      logs,
      summary: {
        totalReadings: logs.length,
        outOfRangeCount,
        avgTemp: avgTemp.toFixed(2),
        minTemp,
        maxTemp,
        unit: logs[0]?.unit || 'CELSIUS',
      },
    });
  } catch (error) {
    console.error('Error fetching temperature logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temperature logs' },
      { status: 500 }
    );
  }
}
