/**
 * Admin Audit Logs Export API
 * Export audit logs to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// GET /api/admin/audit-logs/export - Export audit logs as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'audit:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build where clause
    const where: any = {};

    if (action && action !== 'all') {
      where.action = action;
    }

    if (resource && resource !== 'all') {
      where.resource = resource;
    }

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    // Fetch all matching logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limit to prevent memory issues
    });

    // Generate CSV
    const csvHeaders = [
      'Timestamp',
      'User Name',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Details',
    ];

    const csvRows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.user.name,
      log.user.email,
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress,
      log.userAgent,
      JSON.stringify(log.details),
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
