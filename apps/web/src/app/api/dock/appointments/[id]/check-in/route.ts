import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkInSchema = z.object({
  actualArrival: z.string().datetime().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
  trailerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = checkInSchema.parse(body);

    const appointment = await prisma.dockAppointment.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        yardLocation: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (
      appointment.status === "CHECKED_IN" ||
      appointment.status === "IN_PROGRESS" ||
      appointment.status === "COMPLETED"
    ) {
      return NextResponse.json(
        { error: "Appointment already checked in" },
        { status: 400 },
      );
    }

    const now = new Date();
    const updatedAppointment = await prisma.dockAppointment.update({
      where: { id: params.id },
      data: {
        status: "CHECKED_IN",
        actualArrival: validatedData.actualArrival
          ? new Date(validatedData.actualArrival)
          : now,
        checkedInAt: now,
        checkedInBy: session.user.id,
        driverName: validatedData.driverName || appointment.driverName,
        driverPhone: validatedData.driverPhone || appointment.driverPhone,
        vehicleNumber: validatedData.vehicleNumber || appointment.vehicleNumber,
        trailerNumber: validatedData.trailerNumber || appointment.trailerNumber,
        sealNumber: validatedData.sealNumber || appointment.sealNumber,
      },
      include: {
        yardLocation: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "CHECK_IN",
        entityType: "DOCK_APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          appointmentNumber: appointment.appointmentNumber,
          dockLocation: appointment.yardLocation?.locationCode,
          vehicleNumber: validatedData.vehicleNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: "Appointment checked in successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error checking in appointment:", error);
    return NextResponse.json(
      { error: "Failed to check in appointment" },
      { status: 500 },
    );
  }
}
