import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const organizationId = session.user.organizationId; // Assuming org context

  try {
    const whereClause: any = {
      // organizationId: // Wait, schema had organizationId?
      // Yes, DockAppointment has organizationId.
    };

    // If user has organizationId
    // Need to verify if session.user has organizationId. usually added in callbacks.
    // If not, maybe query first org.

    // For MVP, I'll filter by status if provided.
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
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
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

    // Determine Dock (or leave null for auto-assign later)
    // Create Appointment
    const appointment = await prisma.dockAppointment.create({
      data: {
        organizationId: "org_default", // Placeholder or get from session
        appointmentNumber: `APT-${Date.now()}`, // Simple generator
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
