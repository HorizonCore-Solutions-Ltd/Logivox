import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await prisma.automationDevice.findMany({
      include: {
        assignedTasks: {
          where: {
            status: 'IN_PROGRESS',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedDevices = devices.map(d => ({
      id: d.id,
      name: d.name,
      deviceType: d.deviceType,
      status: d.status,
      currentTask: d.assignedTasks[0]?.taskType || undefined,
      batteryLevel: d.batteryLevel || undefined,
      location: d.currentLocation || undefined,
      utilizationRate: d.utilizationRate * 100,
      tasksCompleted: d.tasksCompletedToday,
      uptime: d.uptimeToday / 60, // Convert minutes to hours
      lastMaintenance: d.lastMaintenanceDate?.toISOString(),
    }));

    return NextResponse.json(formattedDevices);
  } catch (error) {
    console.error('Error fetching automation devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
