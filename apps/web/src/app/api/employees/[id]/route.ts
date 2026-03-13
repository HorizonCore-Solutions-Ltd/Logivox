export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  warehouseId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  isFullTime: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

/**
 * GET /api/employees/[id]
 * Get employee by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        warehouse: true,
        shifts: {
          take: 10,
          orderBy: { startTime: "desc" },
        },
        timeEntries: {
          take: 20,
          orderBy: { clockIn: "desc" },
        },
        productivityRecords: {
          take: 10,
          orderBy: { date: "desc" },
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
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/employees/[id]
 * Update employee
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const validatedData = updateEmployeeSchema.parse(body);

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "EMPLOYEE_UPDATED",
        entityType: "Employee",
        entityId: employee.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/employees/[id]
 * Soft delete employee
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Soft delete by setting status to TERMINATED
    await prisma.employee.update({
      where: { id: params.id },
      data: { status: "TERMINATED" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "EMPLOYEE_TERMINATED",
        entityType: "Employee",
        entityId: employee.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Employee terminated" });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 },
    );
  }
}
