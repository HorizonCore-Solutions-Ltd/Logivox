import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TriggerPanicSchema = z.object({
  guardId: z.string(),
  guardName: z.string(),
  location: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  audioUrl: z.string().optional(), // 30-min recording URL
  videoUrl: z.string().optional(),
});

// POST /api/security/panic - Trigger panic alert
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const body = TriggerPanicSchema.parse(json);

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Create panic alert
    const alert = await prisma.panicAlert.create({
      data: {
        organizationId,
        guardId: body.guardId,
        guardName: body.guardName,
        location: body.location,
        gpsLat: body.gpsLat,
        gpsLng: body.gpsLng,
        audioUrl: body.audioUrl,
        videoUrl: body.videoUrl,
        status: 'ACTIVE',
      },
    });

    // TODO: Send real-time notifications to all guards/supervisors
    // - WebSocket/SSE notification
    // - SMS to emergency contacts
    // - Push notification to mobile app
    // - Alert to monitoring dashboard

    // Find nearest available guards (if GPS provided)
    if (body.gpsLat && body.gpsLng) {
      const recentGuardLocations = await prisma.guardLocation.findMany({
        where: {
          organizationId,
          guardId: { not: body.guardId },
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        orderBy: { timestamp: 'desc' },
        distinct: ['guardId'],
        take: 5,
      });

      // Calculate distances and sort by proximity
      const nearbyGuards = recentGuardLocations
        .map(loc => {
          const R = 6371000; // meters
          const φ1 = body.gpsLat! * Math.PI / 180;
          const φ2 = loc.gpsLat * Math.PI / 180;
          const Δφ = (loc.gpsLat - body.gpsLat!) * Math.PI / 180;
          const Δλ = (loc.gpsLng - body.gpsLng!) * Math.PI / 180;

          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            guardId: loc.guardId,
            distance: Math.round(distance),
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

      return NextResponse.json({
        alert,
        nearbyGuards,
        message: 'Panic alert triggered. Nearby guards notified.',
      });
    }

    return NextResponse.json({
      alert,
      message: 'Panic alert triggered. All guards notified.',
    });
  } catch (error: any) {
    console.error('Error triggering panic alert:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/security/panic - Get active panic alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const alerts = await prisma.panicAlert.findMany({
      where: {
        organizationId,
        ...(status && { status: status as any }),
      },
      include: {
        responses: {
          orderBy: { responseTime: 'asc' },
        },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('Error fetching panic alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
