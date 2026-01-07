import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createGateSchema = z.object({
  name: z.string().min(1),
  gateNumber: z.string().min(1),
  type: z.enum(["INBOUND", "OUTBOUND", "BOTH"]),
  warehouseId: z.string(),
  hasLPRCamera: z.boolean().default(false),
  hasWeighBridge: z.boolean().default(false),
  maxVehicleHeight: z.number().optional(),
  maxVehicleWidth: z.number().optional(),
  operatingHours: z
    .object({
      start: z.string(), // HH:MM format
      end: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

const listSchema = z.object({
  warehouseId: z.string().optional(),
  type: z.enum(["INBOUND", "OUTBOUND", "BOTH"]).optional(),
  status: z.enum(["OPEN", "CLOSED", "MAINTENANCE"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createGateSchema.parse(body);

    // Check if gate number already exists for this warehouse
    const existing = await prisma.gate.findFirst({
      where: {
        organizationId: session.user.organizationId,
        warehouseId: data.warehouseId,
        gateNumber: data.gateNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Gate number already exists for this warehouse" },
        { status: 400 },
      );
    }

    const gate = await prisma.gate.create({
      data: {
        organizationId: session.user.organizationId,
        name: data.name,
        gateNumber: data.gateNumber,
        type: data.type,
        warehouseId: data.warehouseId,
        hasLPRCamera: data.hasLPRCamera,
        hasWeighBridge: data.hasWeighBridge,
        maxVehicleHeight: data.maxVehicleHeight,
        maxVehicleWidth: data.maxVehicleWidth,
        operatingHours: data.operatingHours || undefined,
        notes: data.notes,
        status: "OPEN",
      },
    });

    return NextResponse.json(gate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating gate:", error);
    return NextResponse.json(
      { error: "Failed to create gate" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = listSchema.parse({
      warehouseId: searchParams.get("warehouseId") || undefined,
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (params.warehouseId) {
      where.warehouseId = params.warehouseId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    const gates = await prisma.gate.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            queue: {
              where: {
                status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] },
              },
            },
          },
        },
      },
      orderBy: { gateNumber: "asc" },
    });

    // Add real-time queue count and status
    const gatesWithStatus = gates.map((gate) => ({
      ...gate,
      currentQueueCount: gate._count.queue,
      isOperational: gate.status === "OPEN",
    }));

    return NextResponse.json({ gates: gatesWithStatus });
  } catch (error) {
    console.error("Error fetching gates:", error);
    return NextResponse.json(
      { error: "Failed to fetch gates" },
      { status: 500 },
    );
  }
}
