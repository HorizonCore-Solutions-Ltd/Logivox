import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateRouteSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  frequency: z
    .enum(["HOURLY", "EVERY_2_HOURS", "EVERY_4_HOURS", "DAILY", "CUSTOM"])
    .optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/security/patrol-routes/[id] - Get route details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const route = await prisma.patrolRoute.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        checkpoints: {
          orderBy: { checkpointNumber: "asc" },
        },
        executions: {
          take: 10,
          orderBy: { startTime: "desc" },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            scannedCheckpoints: true,
            totalCheckpoints: true,
            completionRate: true,
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Patrol route not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(route);
  } catch (error: any) {
    console.error("Error fetching patrol route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/security/patrol-routes/[id] - Update route
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = UpdateRouteSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const route = await prisma.patrolRoute.updateMany({
      where: {
        id: params.id,
        organizationId,
      },
      data: body,
    });

    if (route.count === 0) {
      return NextResponse.json(
        { error: "Patrol route not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating patrol route:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/security/patrol-routes/[id] - Delete route
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const route = await prisma.patrolRoute.deleteMany({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (route.count === 0) {
      return NextResponse.json(
        { error: "Patrol route not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting patrol route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
