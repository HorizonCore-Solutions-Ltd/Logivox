/**
 * IoT Device Maintenance API
 * Predictive maintenance for IoT devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { iotMonitoringService } from '@/lib/services/inventory/iot-monitoring-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/iot/device/[deviceId]/maintenance
 * Get maintenance prediction for device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { deviceId } = params;

    // Get device
    const device = await prisma.ioTDevice.findFirst({
      where: {
        id: deviceId,
        organizationId: session.user.organizationId
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Predict maintenance
    const maintenance = await iotMonitoringService.predictDeviceMaintenance(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        device: {
          id: device.id,
          name: device.name,
          type: device.deviceType,
          status: device.status
        },
        maintenance,
        currentStatus: {
          batteryLevel: device.batteryLevel,
          signalStrength: device.signalStrength,
          lastCalibration: device.lastCalibration,
          lastSeen: device.lastSeen
        }
      }
    });

  } catch (error: any) {
    console.error('Maintenance prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict maintenance', message: error.message },
      { status: 500 }
    );
  }
}
