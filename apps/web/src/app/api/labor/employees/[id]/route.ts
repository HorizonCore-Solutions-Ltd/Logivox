import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"])
    .optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "SEASONAL"])
    .optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  hourlyRate: z.number().optional(),
  warehouseId: z.string().optional(),
  defaultZoneId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.any().optional(),
  preferredShiftType: z
    .enum(["DAY", "EVENING", "NIGHT", "ROTATING", "SPLIT", "ON_CALL"])
    .optional(),
  maxHoursPerWeek: z.number().optional(),
  notes: z.string().optional(),
  terminationDate: z.string().datetime().optional(),
});

// GET /api/labor/employees/[id] - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        shiftAssignments: {
          include: {
            shift: true,
          },
          orderBy: { assignedDate: "desc" },
          take: 10,
        },
        timeEntries: {
          orderBy: { startTime: "desc" },
          take: 10,
        },
        productivity: {
          orderBy: { recordDate: "desc" },
          take: 30,
        },
        _count: {
          select: {
            shiftAssignments: true,
            timeEntries: true,
            productivity: true,
            tasks: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 },
    );
  }
}

// PATCH /api/labor/employees/[id] - Update employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    // Check if employee exists
    const existing = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        skills: validatedData.skills as any,
        certifications: validatedData.certifications,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        description: `Updated employee: ${employee.firstName} ${employee.lastName}`,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

// DELETE /api/labor/employees/[id] - Soft delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if employee exists
    const existing = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Soft delete by setting isActive to false
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        isActive: false,
        status: "TERMINATED",
        terminationDate: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: "DELETE",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        description: `Terminated employee: ${employee.firstName} ${employee.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 },
    );
  }
}
