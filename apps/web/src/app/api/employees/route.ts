export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const employeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  warehouseId: z.string(),
  department: z.string().optional(),
  position: z.string().optional(),
  hireDate: z.string().transform(str => new Date(str)),
  hourlyRate: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
  isFullTime: z.boolean().default(true),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

/**
 * GET /api/employees
 * List all employees
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        ...(warehouseId && { warehouseId }),
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeNumber: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        warehouse: { select: { name: true, code: true } },
        _count: {
          select: {
            shifts: true,
            timeEntries: true,
            productivityRecords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

/**
 * POST /api/employees
 * Create a new employee
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true }, take: 1 } },
    });

    if (!user?.organizationMemberships?.[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const body = await req.json();
    const validatedData = employeeSchema.parse(body);

    // Check for duplicate employee number
    const existing = await prisma.employee.findFirst({
      where: {
        organizationId,
        employeeNumber: validatedData.employeeNumber,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Employee number already exists' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        organizationId,
      },
      include: {
        warehouse: { select: { name: true, code: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: 'EMPLOYEE_CREATED',
        entityType: 'Employee',
        entityId: employee.id,
        metadata: {
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
        },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
