import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/security/geofences/violations - List violations
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
    const guardId = searchParams.get("guardId");
    const acknowledged = searchParams.get("acknowledged");

    const violations = await prisma.geofenceViolation.findMany({
      where: {
        organizationId,
        ...(guardId && { guardId }),
        ...(acknowledged !== null && { acknowledged: acknowledged === "true" }),
      },
      include: {
        geofence: {
          select: {
            name: true,
            zoneType: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json(violations);
  } catch (error: any) {
    console.error("Error fetching geofence violations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
