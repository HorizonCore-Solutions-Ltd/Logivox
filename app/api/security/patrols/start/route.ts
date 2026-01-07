import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StartPatrolSchema = z.object({
  routeId: z.string(),
  guardId: z.string(),
});

// POST /api/security/patrols/start - Start patrol
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = StartPatrolSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Get route and checkpoints
    const route = await prisma.patrolRoute.findFirst({
      where: {
        id: body.routeId,
        organizationId,
        isActive: true,
      },
      include: {
        checkpoints: {
          where: { isActive: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Patrol route not found" },
        { status: 404 },
      );
    }

    // Check if guard already has an active patrol
    const activePatrol = await prisma.patrolExecution.findFirst({
      where: {
        organizationId,
        guardId: body.guardId,
        status: "IN_PROGRESS",
      },
    });

    if (activePatrol) {
      return NextResponse.json(
        { error: "Guard already has an active patrol" },
        { status: 400 },
      );
    }

    // Create patrol execution
    const execution = await prisma.patrolExecution.create({
      data: {
        organizationId,
        routeId: body.routeId,
        guardId: body.guardId,
        startTime: new Date(),
        status: "IN_PROGRESS",
        totalCheckpoints: route.checkpoints.length,
        scannedCheckpoints: 0,
        missedCheckpoints: 0,
        completionRate: 0,
      },
      include: {
        route: {
          include: {
            checkpoints: {
              where: { isActive: true },
              orderBy: { checkpointNumber: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(execution);
  } catch (error: any) {
    console.error("Error starting patrol:", error);
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
