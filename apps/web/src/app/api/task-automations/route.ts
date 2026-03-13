import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createAutomationSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  triggerEvent: z.enum([
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "ORDER_CREATED",
    "ORDER_RELEASED",
    "SHIPMENT_DUE",
    "WAVE_RELEASED",
    "LOCATION_FULL",
    "LOCATION_EMPTY",
    "SCHEDULE",
    "MANUAL",
    "CUSTOM",
  ]),
  triggerConditions: z.record(z.any()),
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
  taskPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .default("NORMAL"),
  taskTemplate: z.record(z.any()),
  assignmentRule: z
    .enum([
      "ROUND_ROBIN",
      "LEAST_BUSY",
      "SKILL_BASED",
      "ZONE_BASED",
      "RANDOM",
      "MANUAL",
    ])
    .default("ROUND_ROBIN"),
  assignToRole: z.string().optional(),
  assignToUserId: z.string().optional(),
  scheduleType: z
    .enum(["IMMEDIATE", "SCHEDULED", "DELAYED", "RECURRING"])
    .default("IMMEDIATE"),
  scheduleTime: z.string().optional(),
  scheduleDays: z.array(z.string()).optional(),
  delay: z.number().int().positive().optional(),
  maxExecutionsPerDay: z.number().int().positive().optional(),
  maxExecutionsPerHour: z.number().int().positive().optional(),
  cooldownPeriod: z.number().int().positive().optional(),
  retryOnFailure: z.boolean().default(true),
  maxRetries: z.number().int().min(0).default(3),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/task-automations - List automations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const triggerEvent = searchParams.get("triggerEvent");
    const taskType = searchParams.get("taskType");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (triggerEvent) where.triggerEvent = triggerEvent;
    if (taskType) where.taskType = taskType;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.taskAutomation.count({ where });

    const automations = await prisma.taskAutomation.findMany({
      where,
      include: {
        assignToUser: {
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
            executions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      automations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 },
    );
  }
}

// POST /api/task-automations - Create automation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAutomationSchema.parse(body);

    // Check for duplicate code
    const existing = await prisma.taskAutomation.findFirst({
      where: {
        organizationId: session.user.organizationId,
        code: validatedData.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Automation with this code already exists" },
        { status: 400 },
      );
    }

    // Create automation
    const automation = await prisma.taskAutomation.create({
      data: {
        organizationId: session.user.organizationId,
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        triggerEvent: validatedData.triggerEvent,
        triggerConditions: validatedData.triggerConditions,
        taskType: validatedData.taskType,
        taskPriority: validatedData.taskPriority,
        taskTemplate: validatedData.taskTemplate,
        assignmentRule: validatedData.assignmentRule,
        assignToRole: validatedData.assignToRole,
        assignToUserId: validatedData.assignToUserId,
        scheduleType: validatedData.scheduleType,
        scheduleTime: validatedData.scheduleTime,
        scheduleDays: validatedData.scheduleDays || [],
        delay: validatedData.delay,
        maxExecutionsPerDay: validatedData.maxExecutionsPerDay,
        maxExecutionsPerHour: validatedData.maxExecutionsPerHour,
        cooldownPeriod: validatedData.cooldownPeriod,
        retryOnFailure: validatedData.retryOnFailure,
        maxRetries: validatedData.maxRetries,
        isActive: validatedData.isActive,
        tags: validatedData.tags || [],
        metadata: validatedData.metadata || {},
        createdById: session.user.id,
      },
      include: {
        assignToUser: {
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
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 },
    );
  }
}
