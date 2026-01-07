export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceType: z.enum([
    "SCANNER",
    "PRINTER",
    "RFID_READER",
    "SCALE",
    "SENSOR",
    "GATEWAY",
    "OTHER",
  ]),
  name: z.string().min(1, "Device name is required"),
  warehouseId: z.string(),
  locationId: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  status: z
    .enum(["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"])
    .default("OFFLINE"),
  configuration: z.record(z.any()).optional(),
});

/**
 * GET /api/iot/devices
 * List all IoT devices
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const deviceType = searchParams.get("deviceType");
    const status = searchParams.get("status");

    const devices = await prisma.ioTDevice.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(deviceType && { deviceType: deviceType as any }),
        ...(status && { status: status as any }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        location: { select: { name: true, code: true } },
        _count: {
          select: { alerts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("Error fetching IoT devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch IoT devices" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/iot/devices
 * Register a new IoT device
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = deviceSchema.parse(body);

    // Check for duplicate device ID
    const existing = await prisma.ioTDevice.findFirst({
      where: {
        organizationId,
        deviceId: validatedData.deviceId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Device ID already exists" },
        { status: 400 },
      );
    }

    const device = await prisma.ioTDevice.create({
      data: {
        ...validatedData,
        organizationId,
        lastSeen: new Date(),
      },
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
        action: "IOT_DEVICE_REGISTERED",
        entityType: "IoTDevice",
        entityId: device.id,
        metadata: {
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          name: device.name,
        },
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error registering IoT device:", error);
    return NextResponse.json(
      { error: "Failed to register IoT device" },
      { status: 500 },
    );
  }
}
