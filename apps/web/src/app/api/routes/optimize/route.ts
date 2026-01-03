export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const optimizeRoutesSchema = z.object({
  warehouseId: z.string(),
  shipments: z.array(z.string()), // Shipment IDs
  maxVehicles: z.number().int().positive().optional().default(10),
  maxStopsPerRoute: z.number().int().positive().optional().default(25),
  vehicleCapacity: z.number().positive().optional(),
  optimizationGoal: z.enum(['DISTANCE', 'TIME', 'COST', 'BALANCED']).default('BALANCED'),
});

interface Stop {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  priority: number;
  timeWindow?: { start: string; end: string };
  serviceTime: number; // minutes
}

interface Route {
  routeId: string;
  vehicleId?: string;
  stops: Stop[];
  totalDistance: number;
  estimatedDuration: number;
  sequence: number[];
}

/**
 * POST /api/routes/optimize
 * Optimize delivery routes using VRP algorithm
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const { warehouseId, shipments, maxVehicles, maxStopsPerRoute, optimizationGoal } =
      optimizeRoutesSchema.parse(body);

    // Fetch shipment details
    const shipmentRecords = await prisma.shipment.findMany({
      where: {
        id: { in: shipments },
        organizationId,
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (shipmentRecords.length === 0) {
      return NextResponse.json({ error: 'No shipments found' }, { status: 404 });
    }

    // Get warehouse location (depot)
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Transform shipments to stops
    const stops: Stop[] = shipmentRecords.map((shipment, index) => ({
      id: shipment.id,
      address: shipment.shippingAddress || 'Unknown',
      priority: shipment.priority || 1,
      serviceTime: 15, // Default 15 minutes per stop
      lat: undefined, // Would need geocoding service
      lng: undefined,
    }));

    // **Simple Greedy Routing Algorithm**
    // In production, use proper VRP solver (Google OR-Tools, OSRM, etc.)
    const routes: Route[] = [];
    const unassigned = [...stops];
    let routeIndex = 0;

    while (unassigned.length > 0 && routeIndex < maxVehicles) {
      const route: Route = {
        routeId: `ROUTE-${Date.now()}-${routeIndex + 1}`,
        stops: [],
        totalDistance: 0,
        estimatedDuration: 0,
        sequence: [],
      };

      // Greedy: Add closest stops until capacity reached
      for (let i = 0; i < maxStopsPerRoute && unassigned.length > 0; i++) {
        // Sort by priority (higher first)
        unassigned.sort((a, b) => b.priority - a.priority);
        const stop = unassigned.shift()!;
        route.stops.push(stop);
        route.sequence.push(i);
        route.estimatedDuration += stop.serviceTime;
      }

      // Estimate distance (simplified - in production use routing API)
      route.totalDistance = route.stops.length * 5; // 5 miles per stop average
      route.estimatedDuration += route.stops.length * 10; // 10 min travel between stops

      routes.push(route);
      routeIndex++;
    }

    // Calculate metrics
    const metrics = {
      totalRoutes: routes.length,
      totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
      totalDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0),
      totalDuration: routes.reduce((sum, r) => sum + r.estimatedDuration, 0),
      averageStopsPerRoute: routes.length > 0
        ? Math.round(routes.reduce((sum, r) => sum + r.stops.length, 0) / routes.length)
        : 0,
      optimizationGoal,
    };

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'ROUTES_OPTIMIZED',
        entityType: 'Route',
        entityId: warehouseId,
        metadata: {
          shipmentCount: shipments.length,
          routeCount: routes.length,
          totalDistance: metrics.totalDistance,
        },
      },
    });

    return NextResponse.json({
      success: true,
      routes,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error optimizing routes:', error);
    return NextResponse.json({ error: 'Failed to optimize routes' }, { status: 500 });
  }
}

/**
 * GET /api/routes/optimize
 * Get route optimization history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get recent route optimizations from activity log
    const activities = await prisma.activityLog.findMany({
      where: {
        organizationId,
        action: 'ROUTES_OPTIMIZED',
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Error fetching route history:', error);
    return NextResponse.json({ error: 'Failed to fetch route history' }, { status: 500 });
  }
}
