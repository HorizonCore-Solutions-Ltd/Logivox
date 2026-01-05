/**
 * IoT Alerts API
 * Manage IoT-generated alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/iot/alerts
 * Retrieve IoT alerts with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity'); // LOW, MEDIUM, HIGH, CRITICAL
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      organizationId: session.user.organizationId
    };

    if (severity) {
      where.severity = severity;
    }

    if (resolved !== undefined) {
      where.resolved = resolved;
    }

    const alerts = await prisma.ioTAlert.findMany({
      where,
      include: {
        device: true,
        product: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Statistics
    const bySeverity = alerts.reduce((acc: any, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {});

    const unresolved = alerts.filter(a => !a.resolved).length;
    const critical = alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length;

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        statistics: {
          total: alerts.length,
          unresolved,
          critical,
          bySeverity
        }
      }
    });

  } catch (error: any) {
    console.error('Alerts retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve alerts', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/inventory/iot/alerts/[alertId]
 * Resolve or update alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { alertId } = params;
    const body = await request.json();
    const { resolved, notes } = body;

    const alert = await prisma.ioTAlert.update({
      where: {
        id: alertId,
        organizationId: session.user.organizationId
      },
      data: {
        resolved: resolved ?? undefined,
        resolvedAt: resolved ? new Date() : undefined,
        resolvedBy: resolved ? session.user.id : undefined,
        notes: notes || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
      data: { alert }
    });

  } catch (error: any) {
    console.error('Alert update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert', message: error.message },
      { status: 500 }
    );
  }
}
