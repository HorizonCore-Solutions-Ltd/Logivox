/**
 * Collaboration Messages API
 * Real-time messaging between collaboration participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET - List messages for a collaboration request
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.collaborationMessage.findMany({
      where: { requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, content, messageType, metadata } = body;

    if (!requestId || !content) {
      return NextResponse.json(
        { error: 'Request ID and content are required' },
        { status: 400 }
      );
    }

    // Verify request exists and user is participant
    const request = await prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (
      request.requesterId !== session.user.id &&
      request.assigneeId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You are not a participant in this collaboration' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.collaborationMessage.create({
      data: {
        requestId,
        senderId: session.user.id,
        content,
        messageType: messageType || 'TEXT',
        metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send real-time notification via WebSocket

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
