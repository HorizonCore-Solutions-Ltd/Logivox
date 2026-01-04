/**
 * AI Supervision API
 * Monitor worker performance and trigger interventions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET - List supervision sessions or get specific session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const workerId = searchParams.get('workerId');
    const active = searchParams.get('active');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get specific session
    if (sessionId) {
      const aiSession = await prisma.aISupervisionSession.findUnique({
        where: { id: sessionId },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          warehouse: true,
          interventions: {
            orderBy: { timestamp: 'desc' },
          },
          performanceMetrics: {
            orderBy: { timestamp: 'desc' },
            take: 20,
          },
        },
      });

      if (!aiSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ session: aiSession });
    }

    // Build filters
    const where: any = {};

    if (workerId) {
      where.workerId = workerId;
    }

    if (active === 'true') {
      where.status = 'ACTIVE';
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    // List sessions
    const sessions = await prisma.aISupervisionSession.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            interventions: true,
            performanceMetrics: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });

    // Calculate aggregate stats
    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE').length;
    const avgProductivity =
      sessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) /
        sessions.length || 0;
    const totalInterventions = sessions.reduce(
      (sum, s) => sum + s._count.interventions,
      0
    );

    return NextResponse.json({
      sessions,
      stats: {
        totalSessions: sessions.length,
        activeSessions,
        avgProductivity: Math.round(avgProductivity * 10) / 10,
        totalInterventions,
      },
    });
  } catch (error) {
    console.error('AI Supervision GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Start new supervision session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workerId, warehouseId, sessionType, taskId } = body;

    if (!workerId || !warehouseId) {
      return NextResponse.json(
        { error: 'Worker ID and warehouse ID are required' },
        { status: 400 }
      );
    }

    // Create supervision session
    const aiSession = await prisma.aISupervisionSession.create({
      data: {
        workerId,
        warehouseId,
        sessionType: sessionType || 'CONTINUOUS',
        taskId,
        status: 'ACTIVE',
        startTime: new Date(),
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        warehouse: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: aiSession,
      message: 'AI supervision session started',
    });
  } catch (error) {
    console.error('AI Supervision POST error:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}

// PATCH - Update session or record metrics
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, action, metrics } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const aiSession = await prisma.aISupervisionSession.findUnique({
      where: { id: sessionId },
    });

    if (!aiSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (action === 'end') {
      // End session
      const updatedSession = await prisma.aISupervisionSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        session: updatedSession,
        message: 'Session ended successfully',
      });
    } else if (action === 'pause') {
      const updatedSession = await prisma.aISupervisionSession.update({
        where: { id: sessionId },
        data: { status: 'PAUSED' },
      });

      return NextResponse.json({
        success: true,
        session: updatedSession,
      });
    } else if (action === 'resume') {
      const updatedSession = await prisma.aISupervisionSession.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({
        success: true,
        session: updatedSession,
      });
    } else if (action === 'updateMetrics' && metrics) {
      // Update session metrics
      const updatedSession = await prisma.aISupervisionSession.update({
        where: { id: sessionId },
        data: {
          productivityScore: metrics.productivityScore,
          accuracyScore: metrics.accuracyScore,
          safetyScore: metrics.safetyScore,
          attentionScore: metrics.attentionScore,
          itemsProcessed: metrics.itemsProcessed,
          errorsDetected: metrics.errorsDetected,
          warningsIssued: metrics.warningsIssued,
        },
      });

      // Record performance metric snapshot
      await prisma.performanceMetric.create({
        data: {
          userId: aiSession.workerId,
          warehouseId: aiSession.warehouseId,
          metricType: 'SUPERVISION_SNAPSHOT',
          value: metrics.productivityScore || 0,
          metadata: metrics,
        },
      });

      return NextResponse.json({
        success: true,
        session: updatedSession,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('AI Supervision PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete session (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Delete session (interventions and metrics will cascade)
    await prisma.aISupervisionSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('AI Supervision DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
