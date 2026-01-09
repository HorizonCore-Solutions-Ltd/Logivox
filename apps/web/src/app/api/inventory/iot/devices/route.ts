/**
 * IoT Devices Management API
 * Manage IoT devices, health monitoring, maintenance
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { iotMonitoringService } from "@/lib/services/inventory/iot-monitoring-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/iot/devices
 * List all IoT devices with health status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deviceType = searchParams.get("type"); // RFID, WEIGHT_SENSOR, ENVIRONMENTAL
    const status = searchParams.get("status"); // ACTIVE, OFFLINE, MAINTENANCE

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (deviceType) {
      where.deviceType = deviceType;
    }

    if (status) {
      where.status = status;
    }

    const devices = await prisma.ioTDevice.findMany({
      where,
      include: {
        location: true,
        _count: {
          select: {
            readings: true,
            alerts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate maintenance predictions for each device
    const devicesWithHealth = await Promise.all(
      devices.map(async (device) => {
        try {
          const maintenance =
            await iotMonitoringService.predictDeviceMaintenance(device.id);

          return {
            ...device,
            health: {
              batteryLevel: device.batteryLevel,
              signalStrength: device.signalStrength,
              lastCalibration: device.lastCalibration,
              maintenance,
            },
          };
        } catch (error) {
          return {
            ...device,
            health: {
              batteryLevel: device.batteryLevel,
              signalStrength: device.signalStrength,
              lastCalibration: device.lastCalibration,
              maintenance: { required: false },
            },
          };
        }
      }),
    );

    // Statistics
    const byType = devices.reduce((acc: any, d) => {
      acc[d.deviceType] = (acc[d.deviceType] || 0) + 1;
      return acc;
    }, {});

    const byStatus = devices.reduce((acc: any, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        devices: devicesWithHealth,
        statistics: {
          total: devices.length,
          byType,
          byStatus,
          needingMaintenance: devicesWithHealth.filter(
            (d) => d.health.maintenance.required,
          ).length,
        },
      },
    });
  } catch (error: any) {
    console.error("Devices retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve devices", message: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/iot/devices
 * Register new IoT device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      deviceType,
      serialNumber,
      locationId,
      ipAddress,
      configuration,
    } = body;

    if (!name || !deviceType || !serialNumber) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, deviceType, serialNumber",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    const device = await prisma.ioTDevice.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        deviceType,
        serialNumber,
        locationId,
        ipAddress,
        status: "ACTIVE",
        batteryLevel: 100,
        signalStrength: 100,
        lastCalibration: new Date(),
        configuration: configuration || {},
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device registered successfully",
      data: { device },
    });
  } catch (error: any) {
    console.error("Device registration error:", error);
    return NextResponse.json(
      { error: "Failed to register device", message: error.message },
      { status: 500 },
    );
  }
}
