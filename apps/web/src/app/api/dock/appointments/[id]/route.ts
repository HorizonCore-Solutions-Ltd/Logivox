import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  appointmentType: z
    .enum(["INBOUND", "OUTBOUND", "CROSS_DOCK", "MAINTENANCE", "OTHER"])
    .optional(),
  yardLocationId: z.string().nullable().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  duration: z.number().positive().optional(),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
  trailerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  expectedPallets: z.number().int().positive().nullable().optional(),
  expectedWeight: z.number().positive().nullable().optional(),
  actualPallets: z.number().int().positive().nullable().optional(),
  actualWeight: z.number().positive().nullable().optional(),
  status: z
    .enum([
      "SCHEDULED",
      "CONFIRMED",
      "CHECKED_IN",
      "IN_PROGRESS",
      "COMPLETED",
      "NO_SHOW",
      "CANCELLED",
    ])
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.dockAppointment.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        yardLocation: true,
        gateEntries: {
          orderBy: { entryTime: "desc" },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Check appointment exists
    const existing = await prisma.dockAppointment.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Check for dock conflicts if updating schedule or location
    if (
      validatedData.yardLocationId ||
      validatedData.scheduledStart ||
      validatedData.scheduledEnd
    ) {
      const scheduledStart = validatedData.scheduledStart
        ? new Date(validatedData.scheduledStart)
        : existing.scheduledStart;
      const scheduledEnd = validatedData.scheduledEnd
        ? new Date(validatedData.scheduledEnd)
        : existing.scheduledEnd;
      const yardLocationId =
        validatedData.yardLocationId !== undefined
          ? validatedData.yardLocationId
          : existing.yardLocationId;

      if (yardLocationId) {
        const conflicts = await prisma.dockAppointment.findMany({
          where: {
            id: { not: params.id },
            organizationId: session.user.organizationId,
            yardLocationId: yardLocationId,
            status: { not: "CANCELLED" },
            OR: [
              {
                AND: [
                  { scheduledStart: { lte: scheduledStart } },
                  { scheduledEnd: { gte: scheduledStart } },
                ],
              },
              {
                AND: [
                  { scheduledStart: { lte: scheduledEnd } },
                  { scheduledEnd: { gte: scheduledEnd } },
                ],
              },
            ],
          },
        });

        if (conflicts.length > 0) {
          return NextResponse.json(
            {
              error: "Dock conflict detected",
              message: "Another appointment is scheduled during this time slot",
              conflicts,
            },
            { status: 409 },
          );
        }
      }
    }

    // Calculate actual duration if completing
    const updateData: any = { ...validatedData };
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate);
    }
    if (validatedData.scheduledStart) {
      updateData.scheduledStart = new Date(validatedData.scheduledStart);
    }
    if (validatedData.scheduledEnd) {
      updateData.scheduledEnd = new Date(validatedData.scheduledEnd);
    }

    if (validatedData.status === "COMPLETED" && existing.actualArrival) {
      const now = new Date();
      updateData.actualEnd = now;
      updateData.actualDuration =
        (now.getTime() - existing.actualArrival.getTime()) / (1000 * 60); // minutes
    }

    const appointment = await prisma.dockAppointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        yardLocation: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entityType: "DOCK_APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          appointmentNumber: appointment.appointmentNumber,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.dockAppointment.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Soft delete by setting status to CANCELLED
    await prisma.dockAppointment.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "DELETE",
        entityType: "DOCK_APPOINTMENT",
        entityId: appointment.id,
        metadata: {
          appointmentNumber: appointment.appointmentNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
