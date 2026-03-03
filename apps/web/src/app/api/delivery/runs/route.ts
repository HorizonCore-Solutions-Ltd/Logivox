import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/delivery/runs – list delivery routes shaped as runs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    // Default: last 7 days to +1 day ahead
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const dateFilter = date
      ? { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86_400_000) }
      : { gte: cutoff };

    const routes = await prisma.deliveryRoute.findMany({
      where: { organizationId: orgId, deliveryDate: dateFilter },
      include: { stops: { select: { id: true, deliveryStatus: true } } },
      orderBy: [{ deliveryDate: "asc" }, { routeNumber: "asc" }],
      take: 100,
    });

    // Map DB status PLANNED → SCHEDULED so the delivery page UI matches
    const statusMap: Record<string, string> = { PLANNED: "SCHEDULED", OPTIMIZED: "SCHEDULED", ASSIGNED: "SCHEDULED" };

    const runs = routes.map((r) => ({
      id: r.id,
      runNumber: r.routeNumber,
      routeName: r.routeName,
      driverName: r.driverName,
      vehicleRegistration: r.vehicleId,
      totalStops: r.stops.length,
      completedStops: r.stops.filter((s) => s.deliveryStatus === "DELIVERED").length,
      status: statusMap[r.status] ?? r.status,
      startTime: r.startTime?.toISOString(),
      endTime: r.endTime?.toISOString(),
      deliveryDate: r.deliveryDate.toISOString(),
      estimatedDuration: r.estimatedDuration,
      totalDistance: r.totalDistance,
    }));

    return NextResponse.json({ routes: runs, total: runs.length });
  } catch (error) {
    console.error("GET /api/delivery/runs error:", error);
    return NextResponse.json({ error: "Failed to fetch delivery runs" }, { status: 500 });
  }
}
