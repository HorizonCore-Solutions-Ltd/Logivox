export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shiftSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  warehouseId: z.string(),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
  assignedEmployeeIds: z.array(z.string()).optional(),
  shiftType: z
    .enum(["MORNING", "AFTERNOON", "NIGHT", "WEEKEND"])
    .default("MORNING"),
  capacity: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/shifts
 * List all shifts
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const shifts = await prisma.shift.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(startDate && { startTime: { gte: new Date(startDate) } }),
        ...(endDate && { endTime: { lte: new Date(endDate) } }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(shifts);
  } catch (error: any) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/shifts
 * Create a new shift
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizationMemberships: { include: { organization: true }, take: 1 },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const { assignedEmployeeIds, ...shiftData } = shiftSchema.parse(body);

    const shift = await prisma.shift.create({
      data: {
        ...shiftData,
        organizationId,
        ...(assignedEmployeeIds &&
          assignedEmployeeIds.length > 0 && {
            employees: {
              connect: assignedEmployeeIds.map((id) => ({ id })),
            },
          }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "SHIFT_CREATED",
        entityType: "Shift",
        entityId: shift.id,
        metadata: {
          shiftName: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          employeeCount: assignedEmployeeIds?.length || 0,
        },
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 },
    );
  }
}
