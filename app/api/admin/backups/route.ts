/**
 * Admin Backups API Routes
 * Manage database backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit-logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// GET /api/admin/backups - List all backups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'backup:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const backupDir = process.env.BACKUP_DIR || '/var/backups/logivox';

    // List local backups
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter((f) => f.endsWith('.sql.gz'));

    const backups = await Promise.all(
      backupFiles.map(async (filename) => {
        const filePath = path.join(backupDir, filename);
        const stats = await fs.stat(filePath);
        
        // Parse backup type from filename
        let type: 'manual' | 'scheduled' | 'automatic' = 'manual';
        if (filename.includes('scheduled')) type = 'scheduled';
        if (filename.includes('auto')) type = 'automatic';

        return {
          id: filename,
          filename,
          size: stats.size,
          type,
          status: 'completed' as const,
          createdAt: stats.birthtime.toISOString(),
          location: 'local' as const,
        };
      })
    );

    // Sort by creation date (newest first)
    backups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

// POST /api/admin/backups - Create new backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'backup:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type = 'manual' } = body;

    const backupDir = process.env.BACKUP_DIR || '/var/backups/logivox';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${timestamp}.sql.gz`;
    const filePath = path.join(backupDir, filename);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Run pg_dump
    const dbUrl = process.env.DATABASE_URL;
    const command = `pg_dump "${dbUrl}" | gzip > "${filePath}"`;

    await execAsync(command);

    // Verify backup was created
    const stats = await fs.stat(filePath);

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'backup_created',
      resource: 'database_backup',
      resourceId: filename,
      details: {
        filename,
        size: stats.size,
        type,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      backup: {
        id: filename,
        filename,
        size: stats.size,
        type,
        status: 'completed',
        createdAt: stats.birthtime.toISOString(),
        location: 'local',
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
