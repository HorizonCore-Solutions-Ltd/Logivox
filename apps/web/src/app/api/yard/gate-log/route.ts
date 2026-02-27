import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction"); // INBOUND | OUTBOUND | null
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hrs

    const where: Record<string, unknown> = { createdAt: { gte: since } };
    if (direction) where.direction = direction;

    const [entries, summary] = await Promise.all([
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
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.gateEntry.groupBy({
        by: ["direction"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    const inbound = summary.find((s) => s.direction === "INBOUND")?._count.id ?? 0;
    const outbound = summary.find((s) => s.direction === "OUTBOUND")?._count.id ?? 0;

    // Check-in time KPI: avg minutes between scheduledTime and createdAt
    const withAppt = entries.filter(
      (e) => e.scheduledTime && e.createdAt,
    );
    const avgWaitMin =
      withAppt.length > 0
        ? Math.round(
            withAppt.reduce((acc, e) => {
              const diff =
                Math.abs(
                  new Date(e.createdAt).getTime() -
                    new Date(e.scheduledTime!).getTime(),
                ) /
                60_000;
              return acc + diff;
            }, 0) / withAppt.length,
          )
        : 0;

    return NextResponse.json({
      summary: {
        totalToday: inbound + outbound,
        inbound,
        outbound,
        avgCheckInVarianceMinutes: avgWaitMin,
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
        vehicleNumber: e.vehicleNumber,
        licensePlate: e.licensePlate,
        trailerNumber: e.trailerNumber,
        driverName: e.driverName,
        carrierName: e.carrierName ?? e.appointment?.carrierName,
        scheduledTime: e.scheduledTime?.toISOString(),
        actualTime: e.createdAt.toISOString(),
        securityCheckPassed: e.securityCheckPassed,
        securityNotes: e.securityNotes,
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
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      organizationId,
      warehouseId,
    } = body;

    if (!vehicleNumber && !driverName) {
      return NextResponse.json(
        { error: "vehicleNumber or driverName is required" },
        { status: 400 },
      );
    }

    // Auto-link to appointment if not provided — match by vehicleNumber
    let resolvedAppointmentId = appointmentId;
    if (!resolvedAppointmentId && vehicleNumber) {
      const matchAppt = await prisma.dockAppointment.findFirst({
        where: {
          vehicleNumber,
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
          data: {
            status: "CHECKED_IN",
            actualArrival: new Date(),
          },
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
        organizationId: organizationId ?? "default",
        warehouseId,
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
