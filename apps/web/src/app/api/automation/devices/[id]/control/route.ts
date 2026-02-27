import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// POST /api/automation/devices/[id]/control — send a control command to a device
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { command } = await request.json();
    if (!command) {
      return NextResponse.json({ error: "command is required" }, { status: 400 });
    }

    // Map commands to device status changes
    const statusMap: Record<string, string> = {
      START: "ACTIVE",
      STOP: "IDLE",
      PAUSE: "IDLE",
      CHARGE: "CHARGING",
      MAINTENANCE: "MAINTENANCE",
      RESET: "IDLE",
      EMERGENCY_STOP: "IDLE",
    };

    const newStatus = statusMap[command.toUpperCase()];
    if (!newStatus) {
      return NextResponse.json(
        {
          error: `Unknown command '${command}'. Valid commands: ${Object.keys(statusMap).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const updated = await (prisma as any).automationDevice.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(command.toUpperCase() === "MAINTENANCE"
          ? { lastMaintenanceDate: new Date() }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: params.id,
      command: command.toUpperCase(),
      newStatus,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending device control command:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
