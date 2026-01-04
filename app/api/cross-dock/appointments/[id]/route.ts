import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as schedulingService from '@/lib/services/cross-dock/scheduling-service';

/**
 * GET /api/cross-dock/appointments/:id
 * Get appointment details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointment = await schedulingService.getAppointment(params.id);

    if (appointment.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Failed to get appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get appointment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cross-dock/appointments/:id
 * Update appointment status or assign door
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'updateStatus':
        result = await schedulingService.updateAppointmentStatus({
          appointmentId: params.id,
          ...data,
        });
        break;

      case 'assignDoor':
        result = await schedulingService.assignDoor(
          params.id,
          data.doorId,
          data.doorType
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cross-dock/appointments/:id
 * Cancel appointment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await schedulingService.deleteAppointment(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
