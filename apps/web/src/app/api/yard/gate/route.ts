// src/app/api/yard/gate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GateEntryType, EntryDirection } from '@prisma/client';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const entries = await prisma.gateEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        // vehicleType?
      }
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('[YARD_GATE_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      direction, // INBOUND | OUTBOUND
      vehicleNumber,
      trailerNumber,
      driverName,
      appointmentId,
      gateNumber // Entry gate
    } = body;

    // Create Gate Entry
    const entry = await prisma.gateEntry.create({
      data: {
        organizationId: "org_default",
        entryNumber: `GATE-${Date.now()}`,
        entryType: "TRUCK", // Assuming enum
        direction: direction as EntryDirection,
        vehicleNumber,
        trailerNumber,
        driverName,
        gateNumber,
        entryTime: new Date(), // Required field
        appointmentId: appointmentId || undefined,
      }
    });
    
    // Update Appointment Status
    if (appointmentId) {
       await prisma.dockAppointment.update({
         where: { id: appointmentId },
         data: {
           status: 'CHECKED_IN',
           checkedInAt: new Date(),
         }
       });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('[YARD_GATE_POST]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
