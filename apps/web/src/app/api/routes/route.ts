import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createRouteSchema = z.object({
  warehouseId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  wavePickId: z.string().optional(),
  routeType: z
    .enum(["STANDARD", "EXPRESS", "ZONE", "BATCH", "CUSTOM"])
    .default("STANDARD"),
  optimizationMethod: z
    .enum([
      "SHORTEST_PATH",
      "NEAREST_NEIGHBOR",
      "GENETIC_ALGORITHM",
      "ANNEALING",
      "MANUAL",
    ])
    .default("SHORTEST_PATH"),
  startLocationId: z.string().optional(),
  endLocationId: z.string().optional(),
  waypoints: z.array(z.record(z.any())),
  assignedToId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/routes - List routes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const wavePickId = searchParams.get("wavePickId");
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (wavePickId) where.wavePickId = wavePickId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const total = await prisma.pickingRoute.count({ where });

    const routes = await prisma.pickingRoute.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        wavePick: {
          select: {
            id: true,
            waveNumber: true,
            name: true,
          },
        },
        startLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
        endLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      routes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 },
    );
  }
}

// POST /api/routes - Create route
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRouteSchema.parse(body);

    // Generate route number: ROUTE-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await prisma.pickingRoute.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequenceNumber = String(todayCount + 1).padStart(4, "0");
    const routeNumber = `ROUTE-${dateStr}-${sequenceNumber}`;

    // Calculate route statistics
    const totalStops = validatedData.waypoints.length;
    let totalDistance = 0;
    let estimatedDuration = 0;

    // Simple distance calculation (can be enhanced with actual warehouse layout)
    for (let i = 1; i < validatedData.waypoints.length; i++) {
      const prev = validatedData.waypoints[i - 1];
      const curr = validatedData.waypoints[i];

      // Add distance from waypoint metadata if provided
      if (curr.distance) {
        totalDistance += curr.distance;
      }

      // Add estimated time if provided
      if (curr.estimatedTime) {
        estimatedDuration += curr.estimatedTime;
      }
    }

    // Create route
    const route = await prisma.pickingRoute.create({
      data: {
        organizationId: session.user.organizationId,
        warehouseId: validatedData.warehouseId,
        routeNumber,
        name: validatedData.name,
        description: validatedData.description,
        wavePickId: validatedData.wavePickId,
        routeType: validatedData.routeType,
        optimizationMethod: validatedData.optimizationMethod,
        startLocationId: validatedData.startLocationId,
        endLocationId: validatedData.endLocationId,
        waypoints: validatedData.waypoints,
        totalStops,
        totalDistance: totalDistance > 0 ? totalDistance : null,
        estimatedDuration: estimatedDuration > 0 ? estimatedDuration : null,
        assignedToId: validatedData.assignedToId,
        assignedAt: validatedData.assignedToId ? new Date() : null,
        metadata: validatedData.metadata || {},
        status: "PLANNED",
        createdById: session.user.id,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        wavePick: {
          select: {
            id: true,
            waveNumber: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
      { status: 500 },
    );
  }
}
