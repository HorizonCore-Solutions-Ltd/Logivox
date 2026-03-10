import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from "../../../../../../../lib/audit-service";
import { publishEvent } from "../../../../../../../lib/event-service";
import { z } from "zod";
import { validateContract } from "../../../../../../../lib/api-middleware";
import { logAudit } from "../../../../../../../lib/audit-service";
import { publishEvent } from "../../../../../../../lib/event-service";
import { z } from "zod";
import { validateContract } from "../../../../../../../lib/api-middleware";

const gateEntrySchema = z.object({
  entryType: z.string(),
  direction: z.string(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  trailerNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverLicense: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierName: z.string().optional(),
  appointmentId: z.string().optional(),
  referenceNumber: z.string().optional(),
  gateNumber: z.string().optional(),
  securityCheckPassed: z.boolean().optional(),
  notes: z.string().optional(),
});

const gateEntrySchema = z.object({
  entryType: z.string(),
  direction: z.string(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licensePlate: z.string().optional(),
  trailerNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverLicense: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierName: z.string().optional(),
  appointmentId: z.string().optional(),
  referenceNumber: z.string().optional(),
  gateNumber: z.string().optional(),
  securityCheckPassed: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    if (direction) where.direction = direction;
    if (dateStr) {
      const day = new Date(dateStr);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.entryTime = { gte: day, lt: nextDay };
    }

    const entries = await prisma.gateEntry.findMany({
      where,
      orderBy: { entryTime: "desc" },
      take: 100,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = entries.filter((e) => e.entryTime >= today);
    const stats = {
      totalToday: todayEntries.length,
      inboundToday: todayEntries.filter((e) => e.direction === "INBOUND")
        .length,
      outboundToday: todayEntries.filter((e) => e.direction === "OUTBOUND")
        .length,
      onSite: entries.filter(
        (e) =>
          e.status === "CHECKED_IN" ||
          e.status === "PROCESSING" ||
          e.status === "APPROVED",
      ).length,
      pendingCheckIn: entries.filter((e) => e.status === "SCHEDULED").length,
    };

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        entryNumber: e.entryNumber,
        entryType: e.entryType,
        direction: e.direction,
        vehicleNumber: e.vehicleNumber ?? e.licensePlate,
        licensePlate: e.licensePlate,
        trailerNumber: e.trailerNumber,
        driverName: e.driverName,
        carrierName: e.carrierName,
        status: e.status,
        appointmentId: e.appointmentId,
        entryTime: e.entryTime.toISOString(),
        exitTime: e.exitTime?.toISOString() ?? null,
        securityCheckPassed: e.securityCheckPassed,
        createdAt: e.entryTime.toISOString(),
      })),
      total: entries.length,
      stats,
    });
  } catch (error) {
    console.error("Error fetching gate entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;
    const userId = session.user.id;

    const { data: body, errorResponse } = await validateContract(
      request,
      gateEntrySchema,
    );
    if (errorResponse) return errorResponse;

    const {
      entryType,
      direction,
      vehicleType,
      vehicleNumber,
      licensePlate,
      trailerNumber,
      driverName,
      driverLicense,
      driverPhone,
      carrierName,
      appointmentId,
      referenceNumber,
      gateNumber,
      securityCheckPassed,
      notes,
    } = body!;

    // Generate sequential entry number
    const count = await prisma.gateEntry.count({
      where: { organizationId: orgId },
    });
    const entryNumber = `GE-${String(count + 1).padStart(5, "0")}`;

    const entry = await prisma.gateEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        entryType,
        direction,
        vehicleType,
        vehicleNumber,
        licensePlate,
        trailerNumber,
        driverName,
        driverLicense,
        driverPhone,
        carrierName,
        appointmentId,
        referenceNumber,
        gateNumber,
        securityCheckPassed: securityCheckPassed ?? false,
        notes,
        entryTime: new Date(),
        status: "CHECKED_IN",
      },
    });

    // Zero-trust Traceability: Log the Action
    await logAudit({
      eventType: "GATE_ENTRY_CREATED",
      userId,
      resource: "GateEntry",
      resourceId: entry.id,
      action: `Driver ${driverName || "Unknown"} checked in at gate ${gateNumber || "Unknown"}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      success: true,
      changes: { direction, entryType, vehicleNumber, driverName },
    });

    // Indempotency/Eventing: Write to Outbox
    await publishEvent({
      eventType: "gate_entry.checked_in",
      payload: {
        entryId: entry.id,
        organizationId: orgId,
        driverName,
        entryNumber,
      },
      aggregateId: entry.id,
      aggregateType: "GateEntry",
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating gate entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
