/**
 * Yard Management API
 * Handles dock appointments, yard locations, gate entry/exit, and carrier performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { YardManagementService } from '@/lib/services/yard-management.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get appointments, yard utilization, or carrier performance
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'appointment':
        const appointmentId = searchParams.get('appointmentId');
        if (!appointmentId) {
          return NextResponse.json(
            { error: 'Appointment ID is required' },
            { status: 400 }
          );
        }

        const appointment = await prisma.dockAppointment.findUnique({
          where: { id: appointmentId },
        });

        return NextResponse.json(appointment);

      case 'yard-utilization':
        const warehouseId = searchParams.get('warehouseId');
        if (!warehouseId) {
          return NextResponse.json(
            { error: 'Warehouse ID is required' },
            { status: 400 }
          );
        }

        const utilization = await YardManagementService.getYardUtilization({
          warehouseId,
        });

        return NextResponse.json(utilization);

      case 'dock-schedule':
        const scheduleWarehouseId = searchParams.get('warehouseId');
        const date = searchParams.get('date');

        if (!scheduleWarehouseId || !date) {
          return NextResponse.json(
            { error: 'Warehouse ID and date are required' },
            { status: 400 }
          );
        }

        const schedule = await YardManagementService.getDockSchedule({
          warehouseId: scheduleWarehouseId,
          date: new Date(date),
        });

        return NextResponse.json(schedule);

      case 'carrier-performance':
        const organizationId = searchParams.get('organizationId');
        const carrierName = searchParams.get('carrierName');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!carrierName || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required parameters (carrierName, startDate, endDate)' },
            { status: 400 }
          );
        }

        const performance = await YardManagementService.getCarrierPerformance({
          carrierName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });

        return NextResponse.json(performance);

      case 'gate-activity':
        const gateWarehouseId = searchParams.get('warehouseId');
        const gateDate = searchParams.get('date');

        if (!gateWarehouseId || !gateDate) {
          return NextResponse.json(
            { error: 'Warehouse ID and date are required' },
            { status: 400 }
          );
        }

        const activity = await YardManagementService.getGateActivity({
          warehouseId: gateWarehouseId,
          startDate: new Date(gateDate),
          endDate: new Date(new Date(gateDate).setDate(new Date(gateDate).getDate() + 1)),
        });

        return NextResponse.json(activity);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Yard Management GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - Create appointments, assign locations, check in/out
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create-appointment':
        const { 
          organizationId, 
          warehouseId, 
          carrierName, 
          scheduledDate, 
          duration,
          notes,
          dockDoorId,
          appointmentType
        } = body;
        
        if (!organizationId || !warehouseId || !carrierName || !scheduledDate) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const appointment = await YardManagementService.createAppointment({
          organizationId,
          warehouseId,
          appointmentType: appointmentType || 'RECEIVING',
          scheduledDate: new Date(scheduledDate),
          scheduledStart: new Date(scheduledDate),
          scheduledEnd: new Date(new Date(scheduledDate).getTime() + (duration || 60) * 60000),
          carrierName,
          referenceNumber: notes,
        });

        return NextResponse.json(appointment, { status: 201 });

      case 'assign-location':
        const { appointmentId: assignAppointmentId, yardLocationId } = body;
        
        if (!assignAppointmentId || !yardLocationId) {
          return NextResponse.json(
            { error: 'Appointment ID and Yard Location ID are required' },
            { status: 400 }
          );
        }

        const assigned = await YardManagementService.assignYardLocation({
          appointmentId: assignAppointmentId,
          yardLocationId,
        });

        return NextResponse.json(assigned);

      case 'check-in':
        const { appointmentId: checkInAppointmentId, checkedInBy: checkInBy } = body;
        
        if (!checkInAppointmentId || !checkInBy) {
          return NextResponse.json(
            { error: 'Appointment ID and checkedInBy are required' },
            { status: 400 }
          );
        }

        const checkIn = await YardManagementService.checkIn({
          appointmentId: checkInAppointmentId,
          checkedInBy: checkInBy,
        });

        return NextResponse.json(checkIn);

      case 'check-out':
        const { appointmentId: checkOutAppointmentId, checkedOutBy } = body;
        
        if (!checkOutAppointmentId || !checkedOutBy) {
          return NextResponse.json(
            { error: 'appointmentId and checkedOutBy are required' },
            { status: 400 }
          );
        }

        const checkOut = await YardManagementService.checkOut({
          appointmentId: checkOutAppointmentId,
          checkedOutBy,
        });

        return NextResponse.json(checkOut);

      case 'cancel-appointment':
        const { appointmentId: cancelAppointmentId, reason } = body;
        
        if (!cancelAppointmentId) {
          return NextResponse.json(
            { error: 'Appointment ID is required' },
            { status: 400 }
          );
        }

        const cancelled = await YardManagementService.cancelAppointment({
          appointmentId: cancelAppointmentId,
          reason,
        });

        return NextResponse.json(cancelled);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Yard Management POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
