import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateLocationSchema = z.object({
  guardId: z.string(),
  gpsLat: z.number(),
  gpsLng: z.number(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
});

// POST /api/security/location - Update guard location
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const body = UpdateLocationSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Create location record
    const location = await prisma.guardLocation.create({
      data: {
        organizationId,
        guardId: body.guardId,
        gpsLat: body.gpsLat,
        gpsLng: body.gpsLng,
        accuracy: body.accuracy,
        speed: body.speed,
        heading: body.heading,
        batteryLevel: body.batteryLevel,
      },
    });

    // Check for geofence violations
    const geofences = await prisma.geofence.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const violations = [];
    for (const geofence of geofences) {
      // Check if guard is allowed in this zone
      if (
        geofence.allowedGuards.length > 0 &&
        !geofence.allowedGuards.includes(body.guardId)
      ) {
        // Guard not in allowed list, check if they're inside
        const isInside = checkPointInGeofence(
          body.gpsLat,
          body.gpsLng,
          geofence,
        );

        if (isInside && geofence.zoneType === "RESTRICTED") {
          violations.push({
            geofenceId: geofence.id,
            type: "ENTERED_RESTRICTED",
          });
        }
      }
    }

    // Create violation records
    if (violations.length > 0) {
      await prisma.geofenceViolation.createMany({
        data: violations.map((v) => ({
          organizationId,
          geofenceId: v.geofenceId,
          guardId: body.guardId,
          guardName: "", // TODO: Fetch from SecurityPersonnel
          violationType: v.type,
          gpsLat: body.gpsLat,
          gpsLng: body.gpsLng,
        })),
      });
    }

    return NextResponse.json({
      location,
      violations: violations.length > 0 ? violations : undefined,
    });
  } catch (error: any) {
    console.error("Error updating guard location:", error);
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

// GET /api/security/location - Get all guard locations
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
    const since = searchParams.get("since"); // Minutes ago

    const sinceDate = since
      ? new Date(Date.now() - parseInt(since) * 60 * 1000)
      : new Date(Date.now() - 15 * 60 * 1000); // Default 15 minutes

    // Get latest location for each guard
    const locations = await prisma.guardLocation.findMany({
      where: {
        organizationId,
        timestamp: { gte: sinceDate },
      },
      orderBy: { timestamp: "desc" },
      distinct: ["guardId"],
    });

    return NextResponse.json(locations);
  } catch (error: any) {
    console.error("Error fetching guard locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function checkPointInGeofence(
  lat: number,
  lng: number,
  geofence: any,
): boolean {
  // Simple circular geofence check
  if (geofence.centerLat && geofence.centerLng && geofence.radius) {
    const R = 6371000; // meters
    const φ1 = (lat * Math.PI) / 180;
    const φ2 = (geofence.centerLat * Math.PI) / 180;
    const Δφ = ((geofence.centerLat - lat) * Math.PI) / 180;
    const Δλ = ((geofence.centerLng - lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= geofence.radius;
  }

  // TODO: Implement polygon-based geofence check using coordinates JSON
  return false;
}
