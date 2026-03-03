import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Complete a shunter task — marks the related DockAppointment as COMPLETED
// Task IDs are prefixed: "PULL-<appointmentId>" or "SPOT-<appointmentId>"
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    // Strip PULL- / SPOT- prefix to get the real appointment id
    const appointmentId = params.id.replace(/^(PULL|SPOT)-/, "");

    const appointment = await prisma.dockAppointment.findFirst({
      where: { id: appointmentId, organizationId: orgId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Shunter task not found" }, { status: 404 });
    }

    const updated = await prisma.dockAppointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        actualEnd: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        id: params.id,
        appointmentId: updated.id,
        status: "COMPLETED",
        completedAt: updated.actualEnd?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error completing shunter task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
