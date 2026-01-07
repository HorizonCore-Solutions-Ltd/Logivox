import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createWaveSchema = z.object({
  warehouseId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  waveType: z.enum([
    "SINGLE_ORDER",
    "BATCH",
    "ZONE",
    "CARRIER",
    "PRIORITY",
    "CUSTOM",
  ]),
  priority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .default("NORMAL"),
  strategy: z.enum([
    "FIFO",
    "LIFO",
    "ZONE_BASED",
    "CARRIER_BASED",
    "SHIP_DATE",
    "PRIORITY",
    "SHORTEST_PATH",
    "CUSTOM",
  ]),
  groupingCriteria: z.record(z.any()).optional(),
  maxLines: z.number().int().positive().optional(),
  maxOrders: z.number().int().positive().optional(),
  maxWeight: z.number().positive().optional(),
  maxVolume: z.number().positive().optional(),
  scheduledFor: z.string().datetime().optional(),
  pickDeadline: z.string().datetime().optional(),
  shipDate: z.string().datetime().optional(),
  orderIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/waves - List waves with filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const waveType = searchParams.get("waveType");
    const assignedToId = searchParams.get("assignedToId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build filter
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (waveType) where.waveType = waveType;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { waveNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.wavePick.count({ where });

    // Get waves
    const waves = await prisma.wavePick.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
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
            email: true,
          },
        },
        _count: {
          select: {
            lines: true,
            tasks: true,
            routes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      waves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching waves:", error);
    return NextResponse.json(
      { error: "Failed to fetch waves" },
      { status: 500 },
    );
  }
}

// POST /api/waves - Create new wave
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWaveSchema.parse(body);

    // Generate wave number: WAVE-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Get count of waves created today
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await prisma.wavePick.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequenceNumber = String(todayCount + 1).padStart(4, "0");
    const waveNumber = `WAVE-${dateStr}-${sequenceNumber}`;

    // Create wave
    const wave = await prisma.wavePick.create({
      data: {
        organizationId: session.user.organizationId,
        warehouseId: validatedData.warehouseId,
        waveNumber,
        name: validatedData.name,
        description: validatedData.description,
        waveType: validatedData.waveType,
        priority: validatedData.priority,
        strategy: validatedData.strategy,
        groupingCriteria: validatedData.groupingCriteria || {},
        maxLines: validatedData.maxLines,
        maxOrders: validatedData.maxOrders,
        maxWeight: validatedData.maxWeight,
        maxVolume: validatedData.maxVolume,
        scheduledFor: validatedData.scheduledFor
          ? new Date(validatedData.scheduledFor)
          : null,
        pickDeadline: validatedData.pickDeadline
          ? new Date(validatedData.pickDeadline)
          : null,
        shipDate: validatedData.shipDate
          ? new Date(validatedData.shipDate)
          : null,
        tags: validatedData.tags || [],
        notes: validatedData.notes,
        metadata: validatedData.metadata || {},
        status: "PLANNED",
        createdById: session.user.id,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If order IDs provided, create wave lines
    if (validatedData.orderIds && validatedData.orderIds.length > 0) {
      // TODO: Implement logic to add orders to wave
      // This would involve creating WavePickLine records
    }

    return NextResponse.json(wave, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating wave:", error);
    return NextResponse.json(
      { error: "Failed to create wave" },
      { status: 500 },
    );
  }
}
