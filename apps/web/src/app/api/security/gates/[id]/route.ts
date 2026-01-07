import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED", "MAINTENANCE"]).optional(),
  hasLPRCamera: z.boolean().optional(),
  hasWeighBridge: z.boolean().optional(),
  maxVehicleHeight: z.number().optional(),
  maxVehicleWidth: z.number().optional(),
  operatingHours: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await prisma.gate.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        warehouse: true,
        queue: {
          where: {
            status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] },
          },
          orderBy: [{ priority: "desc" }, { arrivalTime: "asc" }],
        },
      },
    });

    if (!gate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    return NextResponse.json(gate);
  } catch (error) {
    console.error("Error fetching gate:", error);
    return NextResponse.json(
      { error: "Failed to fetch gate" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await prisma.gate.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!gate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.gate.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating gate:", error);
    return NextResponse.json(
      { error: "Failed to update gate" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gate = await prisma.gate.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!gate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    // Check if gate has active queue
    const activeQueue = await prisma.gateQueue.count({
      where: {
        gateId: params.id,
        status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] },
      },
    });

    if (activeQueue > 0) {
      return NextResponse.json(
        { error: "Cannot delete gate with active queue" },
        { status: 400 },
      );
    }

    await prisma.gate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gate:", error);
    return NextResponse.json(
      { error: "Failed to delete gate" },
      { status: 500 },
    );
  }
}
