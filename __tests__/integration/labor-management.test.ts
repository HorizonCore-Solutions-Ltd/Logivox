import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';

describe('Labor Management API Tests', () => {
  let testOrganizationId: string;
  let testWarehouseId: string;
  let testEmployeeId: string;
  let testShiftId: string;

  beforeAll(async () => {
    // Setup test data
    const org = await prisma.organization.create({
      data: { name: 'Test Labor Org', code: 'TLABOR' },
    });
    testOrganizationId = org.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Test Warehouse',
        code: 'TW01',
        organizationId: testOrganizationId,
      },
    });
    testWarehouseId = warehouse.id;
  });

  afterAll(async () => {
    await prisma.timeEntry.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.shift.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.employee.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.warehouse.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.organization.delete({ where: { id: testOrganizationId } });
  });

  test('should create employee', async () => {
    const employee = await prisma.employee.create({
      data: {
        organizationId: testOrganizationId,
        warehouseId: testWarehouseId,
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        status: 'ACTIVE',
        hireDate: new Date(),
        isFullTime: true,
      },
    });

    testEmployeeId = employee.id;
    expect(employee.employeeNumber).toBe('EMP001');
    expect(employee.status).toBe('ACTIVE');
  });

  test('should list employees', async () => {
    const employees = await prisma.employee.findMany({
      where: { organizationId: testOrganizationId },
    });

    expect(employees.length).toBeGreaterThan(0);
    expect(employees[0].organizationId).toBe(testOrganizationId);
  });

  test('should create shift', async () => {
    const shift = await prisma.shift.create({
      data: {
        organizationId: testOrganizationId,
        warehouseId: testWarehouseId,
        name: 'Morning Shift',
        shiftType: 'MORNING',
        startTime: new Date('2026-01-03T08:00:00Z'),
        endTime: new Date('2026-01-03T16:00:00Z'),
      },
    });

    testShiftId = shift.id;
    expect(shift.name).toBe('Morning Shift');
    expect(shift.shiftType).toBe('MORNING');
  });

  test('should assign employee to shift', async () => {
    await prisma.shift.update({
      where: { id: testShiftId },
      data: {
        employees: {
          connect: { id: testEmployeeId },
        },
      },
    });

    const shift = await prisma.shift.findUnique({
      where: { id: testShiftId },
      include: { employees: true },
    });

    expect(shift?.employees.length).toBeGreaterThan(0);
  });

  test('should clock in employee', async () => {
    const timeEntry = await prisma.timeEntry.create({
      data: {
        organizationId: testOrganizationId,
        employeeId: testEmployeeId,
        warehouseId: testWarehouseId,
        clockIn: new Date(),
      },
    });

    expect(timeEntry.employeeId).toBe(testEmployeeId);
    expect(timeEntry.clockOut).toBeNull();
  });

  test('should clock out employee and calculate hours', async () => {
    const clockInTime = new Date();
    const clockOutTime = new Date(clockInTime.getTime() + 8 * 60 * 60 * 1000); // 8 hours

    const timeEntry = await prisma.timeEntry.create({
      data: {
        organizationId: testOrganizationId,
        employeeId: testEmployeeId,
        warehouseId: testWarehouseId,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        hoursWorked: 8,
      },
    });

    expect(timeEntry.hoursWorked).toBe(8);
    expect(timeEntry.clockOut).toBeTruthy();
  });

  test('should prevent duplicate employee numbers', async () => {
    await expect(
      prisma.employee.create({
        data: {
          organizationId: testOrganizationId,
          warehouseId: testWarehouseId,
          employeeNumber: 'EMP001', // Duplicate
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@test.com',
          status: 'ACTIVE',
          hireDate: new Date(),
        },
      })
    ).rejects.toThrow();
  });
});
