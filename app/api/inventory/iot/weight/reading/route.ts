/**
 * IoT Weight Sensor Reading API
 * Real-time weight monitoring with quantity estimation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { iotMonitoringService } from '@/lib/services/inventory/iot-monitoring-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/inventory/iot/weight/reading
 * Process weight sensor reading
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
      productId,
      weight,
      unitWeight,
      temperature,
      location
    } = body;

    if (!deviceId || !productId || weight === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields: deviceId, productId, weight',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const reading = {
      deviceId,
      productId,
      weight,
      unitWeight,
      temperature,
      timestamp: new Date(),
      location
    };

    const result = await iotMonitoringService.processWeightSensorReading(reading);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Weight sensor processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process weight sensor reading',
        message: error.message
      },
      { status: 500 }
    );
  }
}
