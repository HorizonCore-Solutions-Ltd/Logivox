import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const addLineSchema = z.object({
  salesOrderId: z.string(),
  inventoryItemId: z.string(),
  orderedQuantity: z.number().int().positive(),
  locationId: z.string().optional(),
  lotId: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
  priority: z.number().int().default(0),
});

// GET /api/waves/[id]/lines - Get wave lines
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {
      wavePickId: params.id,
    };

    if (status) where.status = status;

    const lines = await prisma.wavePickLine.findMany({
      where,
      include: {
        salesOrder: {
          select: {
            id: true,
            soNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            zone: true,
            aisle: true,
            rack: true,
            bin: true,
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
            expiryDate: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pickedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ pickSequence: "asc" }, { lineNumber: "asc" }],
    });

    return NextResponse.json({ lines });
  } catch (error) {
    console.error("Error fetching wave lines:", error);
    return NextResponse.json(
      { error: "Failed to fetch wave lines" },
      { status: 500 },
    );
  }
}

// POST /api/waves/[id]/lines - Add lines to wave
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = addLineSchema.parse(body);

    // Check wave status
    const wave = await prisma.wavePick.findUnique({
      where: { id: params.id },
      select: {
        status: true,
        organizationId: true,
        totalLines: true,
        maxLines: true,
      },
    });

    if (!wave) {
      return NextResponse.json({ error: "Wave not found" }, { status: 404 });
    }

    if (wave.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Cannot add lines to wave in current status" },
        { status: 400 },
      );
    }

    // Check max lines limit
    if (wave.maxLines && wave.totalLines >= wave.maxLines) {
      return NextResponse.json(
        { error: "Wave has reached maximum lines limit" },
        { status: 400 },
      );
    }

    // Get next line number
    const maxLine = await prisma.wavePickLine.findFirst({
      where: { wavePickId: params.id },
      orderBy: { lineNumber: "desc" },
      select: { lineNumber: true },
    });

    const lineNumber = (maxLine?.lineNumber || 0) + 1;

    // Create line
    const line = await prisma.wavePickLine.create({
      data: {
        organizationId: wave.organizationId,
        wavePickId: params.id,
        lineNumber,
        salesOrderId: validatedData.salesOrderId,
        inventoryItemId: validatedData.inventoryItemId,
        orderedQuantity: validatedData.orderedQuantity,
        locationId: validatedData.locationId,
        lotId: validatedData.lotId,
        serialNumbers: validatedData.serialNumbers || [],
        priority: validatedData.priority,
        status: "PENDING",
      },
      include: {
        salesOrder: {
          select: {
            id: true,
            soNumber: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
      },
    });

    // Update wave totals
    await prisma.wavePick.update({
      where: { id: params.id },
      data: {
        totalLines: { increment: 1 },
        totalQuantity: { increment: validatedData.orderedQuantity },
      },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error adding wave line:", error);
    return NextResponse.json(
      { error: "Failed to add wave line" },
      { status: 500 },
    );
  }
}
