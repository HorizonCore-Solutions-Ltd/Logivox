import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const moves = await prisma.yardMove.findMany({
      include: {
        fromLocation: true,
        toLocation: true,
        assignedTo: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Pending first
        { priority: 'desc' }
      ]
    });
    return NextResponse.json(moves);
  } catch (error) {
    console.error('[YARD_MOVES_GET]', error);
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
      trailerNumber, 
      fromLocationId, 
      toLocationId, 
      priority, 
      notes,
      appointmentId
    } = body;

    if (!fromLocationId || !toLocationId) {
      return new NextResponse("Missing location IDs", { status: 400 });
    }
    
    // Create Yard Move
    const move = await prisma.yardMove.create({
      data: {
        organizationId: "org_default", // TODO: Session driven
        warehouseId: "wh_default", // TODO: Context driven
        trailerNumber,
        fromLocationId,
        toLocationId,
        appointmentId,
        priority: priority || 1,
        notes,
        status: "PENDING"
      }
    });

    return NextResponse.json(move);
  } catch (error) {
    console.error('[YARD_MOVES_POST]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
