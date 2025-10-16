/**
 * Audit Logging System
 * Tracks all important system events and user actions
 */

import prisma from '@/lib/prisma';

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',

  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',

  // Inventory events
  INVENTORY_CREATED = 'INVENTORY_CREATED',
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  INVENTORY_DELETED = 'INVENTORY_DELETED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',
  STOCK_TRANSFERRED = 'STOCK_TRANSFERRED',
  REORDER_POINT_CHANGED = 'REORDER_POINT_CHANGED',

  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',

  // Warehouse events
  WAREHOUSE_CREATED = 'WAREHOUSE_CREATED',
  WAREHOUSE_UPDATED = 'WAREHOUSE_UPDATED',
  LOCATION_CREATED = 'LOCATION_CREATED',
  LOCATION_UPDATED = 'LOCATION_UPDATED',
  WAVE_CREATED = 'WAVE_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',

  // Security events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // System events
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  INTEGRATION_CONFIGURED = 'INTEGRATION_CONFIGURED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: entry.eventType,
        severity: entry.severity || AuditSeverity.INFO,
        userId: entry.userId,
        userName: entry.userName,
        userEmail: entry.userEmail,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        resource: entry.resource,
        resourceId: entry.resourceId,
        action: entry.action,
        changes: entry.changes as any,
        metadata: entry.metadata as any,
        success: entry.success,
        errorMessage: entry.errorMessage,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - logging failure shouldn't break the application
  }
}

/**
 * Helper function to extract request metadata
 */
export function extractRequestMetadata(req: Request) {
  return {
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}

/**
 * Log user authentication event
 */
export async function logAuthEvent(
  eventType: AuditEventType,
  userId: string | undefined,
  email: string,
  success: boolean,
  req: Request,
  errorMessage?: string
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(req);

  await logAuditEvent({
    eventType,
    severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    userId,
    userEmail: email,
    ipAddress,
    userAgent,
    success,
    errorMessage,
  });
}

/**
 * Log user management event
 */
export async function logUserManagementEvent(
  eventType: AuditEventType,
  performedBy: { id: string; name: string; email: string },
  targetUser: { id?: string; email: string },
  changes?: Record<string, any>,
  req?: Request
): Promise<void> {
  const metadata = req ? extractRequestMetadata(req) : {};

  await logAuditEvent({
    eventType,
    severity: AuditSeverity.INFO,
    userId: performedBy.id,
    userName: performedBy.name,
    userEmail: performedBy.email,
    resource: 'user',
    resourceId: targetUser.id,
    changes,
    metadata: {
      ...metadata,
      targetEmail: targetUser.email,
    },
    success: true,
  });
}

/**
 * Log inventory event
 */
export async function logInventoryEvent(
  eventType: AuditEventType,
  user: { id: string; name: string; email: string },
  inventoryItemId: string,
  changes?: Record<string, any>,
  req?: Request
): Promise<void> {
  const metadata = req ? extractRequestMetadata(req) : {};

  await logAuditEvent({
    eventType,
    severity: AuditSeverity.INFO,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    resource: 'inventory',
    resourceId: inventoryItemId,
    changes,
    ...metadata,
    success: true,
  });
}

/**
 * Log order event
 */
export async function logOrderEvent(
  eventType: AuditEventType,
  user: { id: string; name: string; email: string },
  orderId: string,
  orderNumber: string,
  changes?: Record<string, any>,
  req?: Request
): Promise<void> {
  const metadata = req ? extractRequestMetadata(req) : {};

  await logAuditEvent({
    eventType,
    severity: AuditSeverity.INFO,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    resource: 'order',
    resourceId: orderId,
    changes,
    metadata: {
      ...metadata,
      orderNumber,
    },
    success: true,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: AuditEventType,
  userId: string | undefined,
  details: {
    resource?: string;
    resourceId?: string;
    action?: string;
    errorMessage?: string;
  },
  req: Request
): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMetadata(req);

  await logAuditEvent({
    eventType,
    severity: AuditSeverity.WARNING,
    userId,
    ipAddress,
    userAgent,
    resource: details.resource,
    resourceId: details.resourceId,
    action: details.action,
    success: false,
    errorMessage: details.errorMessage,
  });
}

/**
 * Log data export event
 */
export async function logDataExportEvent(
  user: { id: string; name: string; email: string },
  exportType: string,
  recordCount: number,
  req?: Request
): Promise<void> {
  const metadata = req ? extractRequestMetadata(req) : {};

  await logAuditEvent({
    eventType: AuditEventType.DATA_EXPORTED,
    severity: AuditSeverity.INFO,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    metadata: {
      ...metadata,
      exportType,
      recordCount,
    },
    success: true,
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.severity) where.severity = filters.severity;
  if (filters.resource) where.resource = filters.resource;

  if (filters.dateFrom || filters.dateTo) {
    where.timestamp = {};
    if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
    if (filters.dateTo) where.timestamp.lte = filters.dateTo;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(period: 'day' | 'week' | 'month') {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: { gte: startDate },
    },
    select: {
      eventType: true,
      severity: true,
      success: true,
    },
  });

  const stats = {
    total: logs.length,
    byEventType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    successRate: 0,
  };

  logs.forEach((log) => {
    stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
  });

  const successCount = logs.filter((log) => log.success).length;
  stats.successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

  return stats;
}
