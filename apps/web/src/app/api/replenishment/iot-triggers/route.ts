/**
 * GET  /api/replenishment/iot-triggers  – list IoT trigger events
 * POST /api/replenishment/iot-triggers  – ingest an IoT event and optionally auto-create a task
 *
 * Called by: sensor firmware, IoT gateway, RFID middleware, computer-vision pipeline.
 * The payload is tenant-scoped; the warehouseId is resolved from the device registration.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SUPPORTED_EVENTS = [
  "WEIGHT_LOW",
  "PICK_FACE_EMPTY",
  "RFID_DEPLETION",
  "VISION_DETECT",
  "MANUAL_SCAN",
] as const;

const ingestSchema = z.object({
  deviceId: z.string(),
  eventType: z.enum(SUPPORTED_EVENTS),
  sensorValue: z.number().optional(),
  threshold: z.number().optional(),
  inventoryItemId: z.string().optional(),
  locationId: z.string().optional(),
  rawPayload: z.record(z.unknown()).default({}),
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  const { searchParams } = new URL(request.url);
  const processed = searchParams.get("processed");
  const deviceId = searchParams.get("deviceId");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Number(searchParams.get("limit") || 50));

  const where: any = { organizationId };
  if (processed !== null) where.processed = processed === "true";
  if (deviceId) where.deviceId = deviceId;

  const [triggers, total] = await Promise.all([
    prisma.replenishmentIoTTrigger.findMany({
      where,
      include: {
        device: { select: { id: true, deviceName: true, deviceType: true } },
        inventoryItem: {
          select: { id: true, name: true, sku: true, quantity: true },
        },
        task: { select: { id: true, status: true, requiredQty: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.replenishmentIoTTrigger.count({ where }),
  ]);

  return NextResponse.json({
    triggers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;

  // Check feature flag
  const flags = await prisma.replenishmentFeatureFlag.findUnique({
    where: { organizationId },
  });
  if (flags && !flags.iotTriggers)
    return NextResponse.json(
      { error: "IoT triggers feature is not enabled for this organisation." },
      { status: 403 },
    );

  const body = await request.json();
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  const {
    deviceId,
    eventType,
    sensorValue,
    threshold,
    inventoryItemId,
    locationId,
    rawPayload,
  } = parsed.data;

  // Resolve device → warehouseId
  const device = await prisma.ioTDevice.findFirst({
    where: { deviceId, organizationId },
    select: { id: true, warehouseId: true },
  });
  if (!device)
    return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const warehouseId = device.warehouseId ?? "";
  if (!warehouseId)
    return NextResponse.json(
      { error: "Device has no warehouseId assigned" },
      { status: 422 },
    );

  // Record the raw event
  const trigger = await prisma.replenishmentIoTTrigger.create({
    data: {
      organizationId,
      deviceId: device.id,
      inventoryItemId: inventoryItemId ?? null,
      locationId: locationId ?? null,
      warehouseId,
      eventType,
      sensorValue: sensorValue ?? null,
      threshold: threshold ?? null,
      rawPayload,
    },
  });

  // Auto-create replenishment task if an item is known
  let createdTaskId: string | null = null;
  if (inventoryItemId) {
    // Check for an existing live task to avoid duplicates
    const existing = await prisma.replenishmentTask.findFirst({
      where: {
        organizationId,
        inventoryItemId,
        warehouseId,
        status: { in: ["PENDING", "IN_PROGRESS", "PO_CREATED"] },
      },
    });

    if (!existing) {
      const item = await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, organizationId },
        select: { quantity: true, minStockLevel: true, maxStockLevel: true },
      });

      if (item) {
        const requiredQty = Math.max(
          1,
          (item.maxStockLevel ?? item.minStockLevel * 2 ?? 20) -
            (item.quantity ?? 0),
        );

        const task = await prisma.replenishmentTask.create({
          data: {
            organizationId,
            warehouseId,
            inventoryItemId,
            requiredQty,
            status: "PENDING",
            priority: "HIGH",
            triggerSource: "IOT_SENSOR",
          },
        });

        createdTaskId = task.id;

        // Link trigger → task
        await prisma.replenishmentIoTTrigger.update({
          where: { id: trigger.id },
          data: { processed: true, processedAt: new Date(), taskId: task.id },
        });
      }
    } else {
      // Mark processed but no task created (duplicate suppressed)
      await prisma.replenishmentIoTTrigger.update({
        where: { id: trigger.id },
        data: { processed: true, processedAt: new Date(), taskId: existing.id },
      });
      createdTaskId = existing.id;
    }
  }

  return NextResponse.json(
    { success: true, triggerId: trigger.id, taskId: createdTaskId },
    { status: 201 },
  );
}
