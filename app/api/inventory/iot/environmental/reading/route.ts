/**
 * IoT Environmental Monitoring API
 * Temperature and humidity compliance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { iotMonitoringService } from '@/lib/services/inventory/iot-monitoring-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/iot/environmental/reading
 * Process environmental sensor reading
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      deviceId,
      zoneId,
      temperature,
      humidity,
      productIds = []
    } = body;

    if (!deviceId || temperature === undefined || humidity === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields: deviceId, temperature, humidity',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const reading = {
      deviceId,
      zoneId,
      temperature,
      humidity,
      timestamp: new Date(),
      productIds
    };

    const result = await iotMonitoringService.processEnvironmentalReading(reading);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Environmental reading processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process environmental reading',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inventory/iot/environmental/reading
 * Get environmental readings for a zone
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const hours = parseInt(searchParams.get('hours') || '24');

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const where: any = {
      timestamp: { gte: startTime }
    };

    if (zoneId) {
      where.zoneId = zoneId;
    }

    const readings = await prisma.environmentalReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000
    });

    // Calculate statistics
    const temps = readings.map(r => r.temperature);
    const humidities = readings.map(r => r.humidity);

    return NextResponse.json({
      success: true,
      data: {
        readings: readings.slice(0, 100),
        statistics: {
          temperature: {
            current: temps[0],
            avg: temps.reduce((a, b) => a + b, 0) / temps.length,
            min: Math.min(...temps),
            max: Math.max(...temps)
          },
          humidity: {
            current: humidities[0],
            avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
            min: Math.min(...humidities),
            max: Math.max(...humidities)
          },
          violations: readings.filter(r => 
            r.temperature > 30 || r.temperature < 0 ||
            r.humidity > 80 || r.humidity < 20
          ).length
        }
      }
    });

  } catch (error: any) {
    console.error('Environmental readings retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve readings', message: error.message },
      { status: 500 }
    );
  }
}
