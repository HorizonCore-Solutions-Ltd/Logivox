import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as schedulingService from '@/lib/services/cross-dock/scheduling-service';

/**
 * GET /api/cross-dock/appointments
 * List cross-dock appointments
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    const filters = {
      organizationId: session.user.organizationId,
      warehouseId: searchParams.get('warehouseId') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await schedulingService.listAppointments(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to list appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list appointments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cross-dock/appointments
 * Create a new cross-dock appointment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const input = {
      organizationId: session.user.organizationId,
      ...body,
    };

    const appointment = await schedulingService.createAppointment(input);

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
