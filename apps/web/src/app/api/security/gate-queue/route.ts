import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const addToQueueSchema = z.object({
  licensePlate: z.string().min(1),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierName: z.string().optional(),
  appointmentId: z.string().optional(),
  gateId: z.string().optional(),
  priority: z.number().min(1).max(10).default(5),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "WAITING",
    "CALLED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
  gateId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = addToQueueSchema.parse(body);

    // Check if vehicle is already in queue
    const existingInQueue = await prisma.gateQueue.findFirst({
      where: {
        organizationId: session.user.organizationId,
        licensePlate: data.licensePlate.toUpperCase(),
        status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] },
      },
    });

    if (existingInQueue) {
      return NextResponse.json(
        { error: "Vehicle is already in queue", queueEntry: existingInQueue },
        { status: 400 },
      );
    }

    // Get current queue position
    const currentQueueCount = await prisma.gateQueue.count({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ["WAITING", "CALLED"] },
      },
    });

    // Calculate estimated wait time (5 minutes per vehicle in queue)
    const estimatedWaitMinutes = currentQueueCount * 5;

    // Create queue entry
    const queueEntry = await prisma.gateQueue.create({
      data: {
        organizationId: session.user.organizationId,
        licensePlate: data.licensePlate.toUpperCase(),
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        carrierName: data.carrierName,
        appointmentId: data.appointmentId,
        gateId: data.gateId,
        position: currentQueueCount + 1,
        estimatedWaitMinutes,
        priority: data.priority,
        status: "WAITING",
      },
    });

    return NextResponse.json(queueEntry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error adding to queue:", error);
    return NextResponse.json(
      { error: "Failed to add to queue" },
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
    const status = searchParams.get("status");
    const gateId = searchParams.get("gateId");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    } else {
      // Default to active queue entries
      where.status = { in: ["WAITING", "CALLED", "IN_PROGRESS"] };
    }

    if (gateId) {
      where.gateId = gateId;
    }

    const queueEntries = await prisma.gateQueue.findMany({
      where,
      include: {
        gateEntry: {
          select: {
            id: true,
            entryNumber: true,
            vehicleType: true,
          },
        },
        gate: {
          select: {
            id: true,
            name: true,
            gateNumber: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" }, // High priority first
        { arrivalTime: "asc" }, // Then FIFO
      ],
    });

    // Update positions and wait times
    const updatedEntries = queueEntries.map((entry, index) => ({
      ...entry,
      currentPosition: index + 1,
      currentWaitMinutes: index * 5,
    }));

    return NextResponse.json({
      queue: updatedEntries,
      total: queueEntries.length,
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 },
    );
  }
}
