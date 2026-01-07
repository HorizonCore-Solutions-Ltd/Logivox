import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreatePatrolRouteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  warehouseId: z.string().optional(),
  frequency: z
    .enum(["HOURLY", "EVERY_2_HOURS", "EVERY_4_HOURS", "DAILY", "CUSTOM"])
    .optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  checkpoints: z
    .array(
      z.object({
        name: z.string(),
        location: z.string(),
        checkpointNumber: z.number().int().positive(),
        checkpointType: z.enum(["QR_CODE", "NFC", "GPS", "MANUAL"]),
        qrCode: z.string().optional(),
        nfcId: z.string().optional(),
        gpsLat: z.number().optional(),
        gpsLng: z.number().optional(),
        gpsRadius: z.number().optional(),
        instructions: z.string().optional(),
        photoRequired: z.boolean().optional(),
      }),
    )
    .min(1),
});

// POST /api/security/patrol-routes - Create patrol route
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = CreatePatrolRouteSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Create route with checkpoints
    const route = await prisma.patrolRoute.create({
      data: {
        organizationId,
        name: body.name,
        description: body.description,
        warehouseId: body.warehouseId,
        frequency: body.frequency,
        estimatedMinutes: body.estimatedMinutes,
        checkpoints: {
          create: body.checkpoints.map((cp) => ({
            organizationId,
            name: cp.name,
            location: cp.location,
            checkpointNumber: cp.checkpointNumber,
            checkpointType: cp.checkpointType,
            qrCode: cp.qrCode,
            nfcId: cp.nfcId,
            gpsLat: cp.gpsLat,
            gpsLng: cp.gpsLng,
            gpsRadius: cp.gpsRadius,
            instructions: cp.instructions,
            photoRequired: cp.photoRequired,
          })),
        },
      },
      include: {
        checkpoints: {
          orderBy: { checkpointNumber: "asc" },
        },
      },
    });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error("Error creating patrol route:", error);
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

// GET /api/security/patrol-routes - List patrol routes
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const isActive = searchParams.get("isActive");

    const routes = await prisma.patrolRoute.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        checkpoints: {
          where: { isActive: true },
          orderBy: { checkpointNumber: "asc" },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routes);
  } catch (error: any) {
    console.error("Error listing patrol routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
