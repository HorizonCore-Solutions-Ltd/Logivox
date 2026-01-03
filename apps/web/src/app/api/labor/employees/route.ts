import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schemas
const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  hireDate: z.string().datetime(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']).default('ACTIVE'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'SEASONAL']).default('FULL_TIME'),
  department: z.string().optional(),
  position: z.string().optional(),
  hourlyRate: z.number().optional(),
  warehouseId: z.string().optional(),
  defaultZoneId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
  })).optional(),
  preferredShiftType: z.enum(['DAY', 'EVENING', 'NIGHT', 'ROTATING', 'SPLIT', 'ON_CALL']).optional(),
  maxHoursPerWeek: z.number().optional(),
  notes: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

// GET /api/labor/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const employmentType = searchParams.get('employmentType');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      organizationId: session.user.organizationId,
      isActive: true,
    };

    if (status) {
      where.status = status as any;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (employmentType) {
      where.employmentType = employmentType as any;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // Get paginated employees
    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            shiftAssignments: true,
            timeEntries: true,
            productivity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: employees,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/labor/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createEmployeeSchema.parse(body);

    // Check if employee number already exists
    const existing = await prisma.employee.findUnique({
      where: {
        organizationId_employeeNumber: {
          organizationId: session.user.organizationId,
          employeeNumber: validatedData.employeeNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Employee number already exists' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        organizationId: session.user.organizationId,
        ...validatedData,
        skills: validatedData.skills as any,
        certifications: validatedData.certifications as any,
        createdById: session.user.id,
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
        action: 'CREATE',
        entityType: 'EMPLOYEE',
        entityId: employee.id,
        description: `Created employee: ${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
