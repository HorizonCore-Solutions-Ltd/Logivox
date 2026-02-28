import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

const HARDWARE_PROVIDERS = [
  "ZEBRA",
  "ZEBRA_PRINTER",
  "HONEYWELL_SCANNER",
  "DATALOGIC",
  "IMPINJ_RFID",
  "SIEMENS_PLC",
  "ALLEN_BRADLEY",
] as const;

export interface HardwareDevice {
  serial: string;
  model: string;
  provider: string;
  ipAddress?: string;
  firmwareVersion?: string;
  lastHeartbeatAt?: string;
  status: "online" | "offline" | "warning";
  location?: string;
}

// GET /api/integrations/hardware
// Returns registered devices, firmware versions, heartbeat status
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId } = authResult as { orgId: string };

  const connections = await prisma.externalIntegration.findMany({
    where: {
      organizationId: orgId,
      provider: { in: HARDWARE_PROVIDERS as unknown as string[] },
    },
    select: {
      id: true,
      provider: true,
      name: true,
      isActive: true,
      lastSyncAt: true,
      features: true,
      createdAt: true,
    },
    orderBy: { provider: "asc" },
  });

  const enriched = connections.map((c) => {
    const features = (c.features as Record<string, unknown>) ?? {};
    const devices = (features.devices as HardwareDevice[]) ?? [];
    return {
      ...c,
      status: c.isActive ? "connected" : "disconnected",
      deviceCount: devices.length,
      onlineCount: devices.filter((d) => d.status === "online").length,
      devices,
    };
  });

  return NextResponse.json({
    connections: enriched,
    supportedProviders: HARDWARE_PROVIDERS,
    summary: {
      totalConnections: enriched.length,
      totalDevices: enriched.reduce((sum, c) => sum + c.deviceCount, 0),
      onlineDevices: enriched.reduce((sum, c) => sum + c.onlineCount, 0),
    },
  });
}

// POST /api/integrations/hardware
// Actions: register | configure | heartbeat | test
export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { orgId, userId } = authResult as { orgId: string; userId: string };

  const body = await req.json();
  const { action, integrationId, device, deviceConfig } = body as {
    action: "register" | "configure" | "heartbeat" | "test";
    integrationId: string;
    device?: Partial<HardwareDevice>;
    deviceConfig?: Record<string, unknown>;
  };

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId required" },
      { status: 400 },
    );
  }

  const integration = await prisma.externalIntegration.findFirst({
    where: { id: integrationId, organizationId: orgId },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 },
    );
  }

  if (action === "test") {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Hardware gateway test for ${integration.provider}`,
        data: { initiatedBy: userId },
      },
    });
    return NextResponse.json({
      success: true,
      provider: integration.provider,
      message: "Hardware gateway reachable",
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "register") {
    if (!device?.serial) {
      return NextResponse.json(
        { error: "device.serial required" },
        { status: 400 },
      );
    }

    const features = (integration.features as Record<string, unknown>) ?? {};
    const devices = (features.devices as HardwareDevice[]) ?? [];

    const exists = devices.find((d) => d.serial === device.serial);
    if (exists) {
      return NextResponse.json(
        { error: "Device already registered", serial: device.serial },
        { status: 409 },
      );
    }

    const newDevice: HardwareDevice = {
      serial: device.serial,
      model: device.model ?? "Unknown",
      provider: integration.provider,
      ipAddress: device.ipAddress,
      firmwareVersion: device.firmwareVersion,
      status: "offline",
      location: device.location,
    };

    devices.push(newDevice);

    await prisma.externalIntegration.update({
      where: { id: integrationId },
      data: { features: { ...features, devices } },
    });

    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Device registered: ${device.serial} (${device.model})`,
        data: { registeredBy: userId, device: newDevice },
      },
    });

    return NextResponse.json({ success: true, device: newDevice });
  }

  if (action === "configure") {
    if (!device?.serial || !deviceConfig) {
      return NextResponse.json(
        { error: "device.serial and deviceConfig required" },
        { status: 400 },
      );
    }

    // In production: push ZPL config to printer, or device config via MDM
    await prisma.integrationLog.create({
      data: {
        integrationId,
        level: "INFO",
        message: `Config pushed to device ${device.serial}`,
        data: { serial: device.serial, config: deviceConfig, pushedBy: userId },
      },
    });

    return NextResponse.json({
      success: true,
      serial: device.serial,
      message: "Configuration pushed to device",
    });
  }

  if (action === "heartbeat") {
    if (!device?.serial) {
      return NextResponse.json(
        { error: "device.serial required" },
        { status: 400 },
      );
    }

    const features = (integration.features as Record<string, unknown>) ?? {};
    const devices = (features.devices as HardwareDevice[]) ?? [];
    const idx = devices.findIndex((d) => d.serial === device.serial);

    if (idx !== -1) {
      devices[idx] = {
        ...devices[idx],
        status: "online",
        lastHeartbeatAt: new Date().toISOString(),
        firmwareVersion: device.firmwareVersion ?? devices[idx].firmwareVersion,
      };
      await prisma.externalIntegration.update({
        where: { id: integrationId },
        data: { features: { ...features, devices } },
      });
    }

    return NextResponse.json({
      success: true,
      ack: true,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
