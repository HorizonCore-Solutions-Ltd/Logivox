import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createTaskSchema = z.object({
  warehouseId: z.string(),
  taskType: z.enum([
    "PICK",
    "PUT",
    "MOVE",
    "COUNT",
    "REPLENISH",
    "RESTOCK",
    "PACK",
    "INSPECT",
    "LABEL",
    "CUSTOM",
  ]),
  priority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .default("NORMAL"),
  title: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  wavePickId: z.string().optional(),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  inventoryItemId: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  assignedToId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  dueBy: z.string().datetime().optional(),
  dependsOn: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/picking-tasks - List tasks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const taskType = searchParams.get("taskType");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const wavePickId = searchParams.get("wavePickId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build filter
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (taskType) where.taskType = taskType;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (wavePickId) where.wavePickId = wavePickId;
    if (search) {
      where.OR = [
        { taskNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.pickingTask.count({ where });

    // Get tasks
    const tasks = await prisma.pickingTask.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        wavePick: {
          select: {
            id: true,
            waveNumber: true,
            name: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            zone: true,
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
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { scheduledFor: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

// POST /api/picking-tasks - Create task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Generate task number: TASK-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayCount = await prisma.pickingTask.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequenceNumber = String(todayCount + 1).padStart(4, "0");
    const taskNumber = `TASK-${dateStr}-${sequenceNumber}`;

    // Create task
    const task = await prisma.pickingTask.create({
      data: {
        organizationId: session.user.organizationId,
        warehouseId: validatedData.warehouseId,
        taskNumber,
        taskType: validatedData.taskType,
        priority: validatedData.priority,
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        wavePickId: validatedData.wavePickId,
        fromLocationId: validatedData.fromLocationId,
        toLocationId: validatedData.toLocationId,
        inventoryItemId: validatedData.inventoryItemId,
        quantity: validatedData.quantity,
        assignedToId: validatedData.assignedToId,
        assignedAt: validatedData.assignedToId ? new Date() : null,
        scheduledFor: validatedData.scheduledFor
          ? new Date(validatedData.scheduledFor)
          : null,
        dueBy: validatedData.dueBy ? new Date(validatedData.dueBy) : null,
        dependsOn: validatedData.dependsOn || [],
        metadata: validatedData.metadata || {},
        status: validatedData.assignedToId ? "ASSIGNED" : "PENDING",
        createdById: session.user.id,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
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
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
