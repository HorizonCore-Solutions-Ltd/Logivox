export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  eventType: z.enum(['USER_ACTION', 'SYSTEM_EVENT', 'BUSINESS_EVENT']),
  eventName: z.string().min(1, "Event name is required"),
  category: z.string().optional(),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  duration: z.number().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});

// POST /api/analytics/events - Track an analytics event
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await request.json();
    const validated = createEventSchema.parse(body);

    // Get request metadata
    const headers = request.headers;
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    // Create event
    const event = await prisma.analyticsEvent.create({
      data: {
        organizationId,
        userId: user.id,
        eventType: validated.eventType,
        eventName: validated.eventName,
        category: validated.category,
        properties: validated.properties || {},
        metadata: validated.metadata || {},
        ipAddress,
        userAgent,
        duration: validated.duration,
        success: validated.success,
        errorMessage: validated.errorMessage,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// GET /api/analytics/events - Query analytics events
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.organizationMemberships?.[0]?.organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const eventName = searchParams.get("eventName");
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");
    const success = searchParams.get("success");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (eventType) where.eventType = eventType;
    if (eventName) where.eventName = eventName;
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (success !== null && success !== undefined) {
      where.success = success === 'true';
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
