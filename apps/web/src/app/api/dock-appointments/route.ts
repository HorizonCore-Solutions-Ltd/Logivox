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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const dateStr = searchParams.get("date");

    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    if (type) where.appointmentType = type;
    if (dateStr) {
      const day = new Date(dateStr);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.scheduledDate = { gte: day, lt: nextDay };
    }

    const appointments = await prisma.dockAppointment.findMany({
      where,
      include: {
        yardLocation: {
          select: { id: true, locationCode: true, locationName: true, locationType: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
      take: 100,
    });

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        appointmentType: a.appointmentType,
        status: a.status,
        scheduledDate: a.scheduledDate.toISOString(),
        scheduledStart: a.scheduledStart.toISOString(),
        scheduledEnd: a.scheduledEnd.toISOString(),
        actualArrival: a.actualArrival?.toISOString() ?? null,
        actualStart: a.actualStart?.toISOString() ?? null,
        actualEnd: a.actualEnd?.toISOString() ?? null,
        carrierName: a.carrierName,
        driverName: a.driverName,
        vehicleNumber: a.vehicleNumber,
        trailerNumber: a.trailerNumber,
        referenceNumber: a.referenceNumber,
        expectedPallets: a.expectedPallets,
        actualPallets: a.actualPallets,
        yardLocation: a.yardLocation,
      })),
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching dock appointments:", error);
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
      appointmentType,
      scheduledDate,
      scheduledStart,
      scheduledEnd,
      duration,
      carrierName,
      driverName,
      driverPhone,
      vehicleNumber,
      trailerNumber,
      referenceNumber,
      expectedPallets,
      expectedWeight,
      yardLocationId,
    } = body;

    if (!appointmentType || !scheduledDate || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: "appointmentType, scheduledDate, scheduledStart, scheduledEnd are required" },
        { status: 400 },
      );
    }

    const count = await prisma.dockAppointment.count({ where: { organizationId: orgId } });
    const appointmentNumber = `DA-${String(count + 1).padStart(5, "0")}`;

    const appointment = await prisma.dockAppointment.create({
      data: {
        organizationId: orgId,
        appointmentNumber,
        appointmentType,
        scheduledDate: new Date(scheduledDate),
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        duration: duration ?? 60,
        carrierName,
        driverName,
        driverPhone,
        vehicleNumber,
        trailerNumber,
        referenceNumber,
        expectedPallets,
        expectedWeight,
        yardLocationId,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error) {
    console.error("Error creating dock appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
