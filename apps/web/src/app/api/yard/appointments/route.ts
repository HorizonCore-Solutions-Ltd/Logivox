import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return new NextResponse("No organisation context", { status: 403 });
  }

  try {
    const whereClause: any = {
      organizationId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.dockAppointment.findMany({
      where: whereClause,
      include: {
        yardLocation: true,
        gateEntries: true,
        yardMoves: {
          include: { toLocation: true, fromLocation: true },
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("[YARD_APPOINTMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    return new NextResponse("No organisation context", { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      scheduledStart,
      scheduledEnd,
      appointmentType,
      carrierName,
      trailerNumber,
      // ... other fields
    } = body;

    // Validate
    if (!scheduledStart || !scheduledEnd) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysCount = await prisma.dockAppointment.count({
      where: {
        organizationId,
        createdAt: { gte: todayStart },
      },
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const appointmentNumber = `APT-${dateStr}-${String(todaysCount + 1).padStart(4, "0")}`;

    // Create Appointment
    const appointment = await prisma.dockAppointment.create({
      data: {
        organizationId,
        appointmentNumber,
        scheduledDate: new Date(scheduledStart),
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        duration:
          (new Date(scheduledEnd).getTime() -
            new Date(scheduledStart).getTime()) /
          60000,
        appointmentType: appointmentType || "INBOUND",
        carrierName,
        trailerNumber,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[YARD_APPOINTMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
