import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateGeofenceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  warehouseId: z.string().optional(),
  zoneType: z.enum(["ALLOWED", "RESTRICTED", "ALERT_ONLY", "SAFETY_ZONE"]),
  coordinates: z.any(), // GeoJSON polygon
  radius: z.number().optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  alertOnEntry: z.boolean().optional(),
  alertOnExit: z.boolean().optional(),
  allowedGuards: z.array(z.string()).optional(),
});

// POST /api/security/geofences - Create geofence
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = CreateGeofenceSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const geofence = await prisma.geofence.create({
      data: {
        organizationId,
        name: body.name,
        description: body.description,
        warehouseId: body.warehouseId,
        zoneType: body.zoneType,
        coordinates: body.coordinates,
        radius: body.radius,
        centerLat: body.centerLat,
        centerLng: body.centerLng,
        alertOnEntry: body.alertOnEntry || false,
        alertOnExit: body.alertOnExit || false,
        allowedGuards: body.allowedGuards || [],
      },
    });

    return NextResponse.json(geofence);
  } catch (error: any) {
    console.error("Error creating geofence:", error);
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

// GET /api/security/geofences - List geofences
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

    const geofences = await prisma.geofence.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        _count: {
          select: {
            violations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(geofences);
  } catch (error: any) {
    console.error("Error listing geofences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
