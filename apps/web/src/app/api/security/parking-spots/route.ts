import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createSpotSchema = z.object({
  spotNumber: z.string().min(1),
  zone: z.string().min(1),
  type: z.enum(["STANDARD", "OVERSIZED", "REFRIGERATED", "HAZMAT"]),
  warehouseId: z.string(),
  maxVehicleLength: z.number().optional(),
  maxVehicleWidth: z.number().optional(),
  maxVehicleHeight: z.number().optional(),
  maxWeight: z.number().optional(),
  hasElectricity: z.boolean().default(false),
  hasWaterHookup: z.boolean().default(false),
  refrigeratedApproved: z.boolean().default(false),
  hazmatApproved: z.boolean().default(false),
  notes: z.string().optional(),
});

const findAvailableSchema = z.object({
  warehouseId: z.string(),
  type: z.enum(["STANDARD", "OVERSIZED", "REFRIGERATED", "HAZMAT"]).optional(),
  requiresElectricity: z.string().optional(),
  requiresRefrigeration: z.string().optional(),
  requiresHazmat: z.string().optional(),
  vehicleLength: z.string().optional(),
  vehicleWidth: z.string().optional(),
  vehicleHeight: z.string().optional(),
  vehicleWeight: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createSpotSchema.parse(body);

    // Check if spot number already exists
    const existing = await prisma.parkingSpot.findFirst({
      where: {
        organizationId: session.user.organizationId,
        warehouseId: data.warehouseId,
        spotNumber: data.spotNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Spot number already exists" },
        { status: 400 },
      );
    }

    const spot = await prisma.parkingSpot.create({
      data: {
        organizationId: session.user.organizationId,
        ...data,
      },
    });

    return NextResponse.json(spot, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating parking spot:", error);
    return NextResponse.json(
      { error: "Failed to create parking spot" },
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
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const zone = searchParams.get("zone");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (zone) {
      where.zone = zone;
    }

    const spots = await prisma.parkingSpot.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentVehicle: {
          select: {
            id: true,
            licensePlate: true,
            driverName: true,
            entryTime: true,
          },
        },
      },
      orderBy: [{ zone: "asc" }, { spotNumber: "asc" }],
    });

    return NextResponse.json({ spots });
  } catch (error) {
    console.error("Error fetching parking spots:", error);
    return NextResponse.json(
      { error: "Failed to fetch parking spots" },
      { status: 500 },
    );
  }
}
