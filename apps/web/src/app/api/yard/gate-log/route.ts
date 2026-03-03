import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction"); // INBOUND | OUTBOUND | null
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hrs

    const where: Record<string, unknown> = { organizationId: orgId, entryTime: { gte: since } };
    if (direction) where.direction = direction;

    const [entries, dirSummary, onSiteCount, pendingCount] = await Promise.all([
      prisma.gateEntry.findMany({
        where,
        include: {
          appointment: {
            select: {
              appointmentNumber: true,
              appointmentType: true,
              scheduledStart: true,
              status: true,
              carrierName: true,
            },
          },
        },
        orderBy: { entryTime: "desc" },
        take: 100,
      }),
      prisma.gateEntry.groupBy({
        by: ["direction"],
        where: { organizationId: orgId, entryTime: { gte: since } },
        _count: { id: true },
      }),
      // On site = checked in but not checked out
      prisma.gateEntry.count({
        where: { organizationId: orgId, status: { in: ["CHECKED_IN", "PROCESSING", "APPROVED"] }, exitTime: null },
      }),
      // Pending = appointments today that haven't checked in yet
      prisma.dockAppointment.count({
        where: {
          organizationId: orgId,
          status: "SCHEDULED",
          scheduledDate: { gte: new Date(new Date().setHours(0,0,0,0)) },
        },
      }),
    ]);

    const inboundToday = dirSummary.find((s) => s.direction === "INBOUND")?._count.id ?? 0;
    const outboundToday = dirSummary.find((s) => s.direction === "OUTBOUND")?._count.id ?? 0;

    return NextResponse.json({
      summary: {
        inboundToday,
        outboundToday,
        onSite: onSiteCount,
        pendingCheckIn: pendingCount,
        totalToday: inboundToday + outboundToday,
        securityChecksPass: entries.filter((e) => e.securityCheckPassed).length,
        securityChecksFail: entries.filter((e) => !e.securityCheckPassed).length,
      },
      entries: entries.map((e) => ({
        id: e.id,
        entryNumber: e.entryNumber,
        entryType: e.entryType,
        direction: e.direction,
        gateNumber: e.gateNumber,
        vehicleType: e.vehicleType,
        vehicleNumber: e.vehicleNumber ?? e.licensePlate,
        licensePlate: e.licensePlate,
        trailerNumber: e.trailerNumber,
        driverName: e.driverName,
        carrierName: e.carrierName ?? e.appointment?.carrierName,
        status: e.status,
        createdAt: e.entryTime.toISOString(),
        exitTime: e.exitTime?.toISOString(),
        securityCheckPassed: e.securityCheckPassed,
        appointmentNumber: e.appointment?.appointmentNumber,
        appointmentType: e.appointment?.appointmentType,
        appointmentStatus: e.appointment?.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching gate log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const body = await request.json();
    const {
      entryType = "DELIVERY",
      direction = "INBOUND",
      gateNumber,
      vehicleType = "TRUCK",
      vehicleNumber,
      licensePlate,
      trailerNumber,
      driverName,
      driverPhone,
      carrierName,
      appointmentId,
      securityCheckPassed = true,
      securityNotes,
      warehouseId,
    } = body;

    if (!vehicleNumber && !licensePlate && !driverName) {
      return NextResponse.json(
        { error: "vehicleNumber, licensePlate, or driverName is required" },
        { status: 400 },
      );
    }

    // Auto-link to appointment if not provided — match by vehicleNumber or licensePlate
    let resolvedAppointmentId = appointmentId;
    if (!resolvedAppointmentId && (vehicleNumber || licensePlate)) {
      const matchAppt = await prisma.dockAppointment.findFirst({
        where: {
          organizationId: orgId,
          vehicleNumber: vehicleNumber ?? licensePlate,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        orderBy: { scheduledStart: "asc" },
      });
      resolvedAppointmentId = matchAppt?.id ?? undefined;

      // Auto check-in the appointment
      if (matchAppt) {
        await prisma.dockAppointment.update({
          where: { id: matchAppt.id },
          data: { status: "CHECKED_IN", actualArrival: new Date() },
        });
      }
    }

    const entryNumber = `GATE-${Date.now().toString(36).toUpperCase()}`;

    const entry = await prisma.gateEntry.create({
      data: {
        entryNumber,
        entryType,
        direction,
        gateNumber: gateNumber ?? "MAIN",
        vehicleType,
        vehicleNumber,
        licensePlate,
        trailerNumber,
        driverName,
        driverPhone,
        carrierName,
        appointmentId: resolvedAppointmentId,
        securityCheckPassed,
        securityNotes,
        organizationId: orgId,
        warehouseId,
        entryTime: new Date(),
        status: "CHECKED_IN",
      },
    });

    return NextResponse.json({
      success: true,
      entryId: entry.id,
      entryNumber: entry.entryNumber,
      autoLinkedAppointment: resolvedAppointmentId ?? null,
    });
  } catch (error) {
    console.error("Error creating gate entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
