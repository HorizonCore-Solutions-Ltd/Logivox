/**
 * Authorization Middleware
 * Role-based access control (RBAC) and permission checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/prisma';

/**
 * User roles
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
  INVENTORY_CONTROLLER = 'INVENTORY_CONTROLLER',
  SALES_MANAGER = 'SALES_MANAGER',
  PURCHASING_MANAGER = 'PURCHASING_MANAGER',
  VIEWER = 'VIEWER',
}

/**
 * System permissions
 */
export enum Permission {
  // Inventory permissions
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_EDIT = 'inventory.edit',
  INVENTORY_DELETE = 'inventory.delete',
  INVENTORY_ADJUST = 'inventory.adjust',

  // Order permissions
  ORDERS_VIEW = 'orders.view',
  ORDERS_CREATE = 'orders.create',
  ORDERS_EDIT = 'orders.edit',
  ORDERS_DELETE = 'orders.delete',
  ORDERS_APPROVE = 'orders.approve',
  ORDERS_CANCEL = 'orders.cancel',

  // Warehouse permissions
  WAREHOUSE_VIEW = 'warehouse.view',
  WAREHOUSE_MANAGE = 'warehouse.manage',
  LOCATION_MANAGE = 'location.manage',
  WAVE_CREATE = 'wave.create',
  TASK_ASSIGN = 'task.assign',

  // User permissions
  USERS_VIEW = 'users.view',
  USERS_MANAGE = 'users.manage',
  ROLES_MANAGE = 'roles.manage',

  // Report permissions
  REPORTS_VIEW = 'reports.view',
  REPORTS_EXPORT = 'reports.export',
  ANALYTICS_VIEW = 'analytics.view',

  // System permissions
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_MANAGE = 'settings.manage',
  AUDIT_VIEW = 'audit.view',
}

/**
 * Role-permission mapping
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],

  [UserRole.WAREHOUSE_MANAGER]: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_ADJUST,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_CANCEL,
    Permission.WAREHOUSE_VIEW,
    Permission.WAREHOUSE_MANAGE,
    Permission.LOCATION_MANAGE,
    Permission.WAVE_CREATE,
    Permission.TASK_ASSIGN,
    Permission.USERS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  [UserRole.WAREHOUSE_OPERATOR]: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_ADJUST,
    Permission.ORDERS_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.REPORTS_VIEW,
  ],

  [UserRole.INVENTORY_CONTROLLER]: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_ADJUST,
    Permission.ORDERS_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.LOCATION_MANAGE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
  ],

  [UserRole.SALES_MANAGER]: [
    Permission.INVENTORY_VIEW,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_APPROVE,
    Permission.WAREHOUSE_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.ANALYTICS_VIEW,
  ],

  [UserRole.PURCHASING_MANAGER]: [
    Permission.INVENTORY_VIEW,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_CREATE,
    Permission.ORDERS_EDIT,
    Permission.ORDERS_APPROVE,
    Permission.WAREHOUSE_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
  ],

  [UserRole.VIEWER]: [
    Permission.INVENTORY_VIEW,
    Permission.ORDERS_VIEW,
    Permission.WAREHOUSE_VIEW,
    Permission.REPORTS_VIEW,
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const rolePermissions = RolePermissions[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Check if user has all permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Authorization middleware configuration
 */
export interface AuthorizationConfig {
  /**
   * Required role(s)
   */
  roles?: UserRole | UserRole[];

  /**
   * Required permission(s)
   */
  permissions?: Permission | Permission[];

  /**
   * Require all permissions (default: false - any permission is sufficient)
   */
  requireAllPermissions?: boolean;

  /**
   * Custom authorization function
   */
  authorize?: (user: any, req: NextRequest) => Promise<boolean> | boolean;

  /**
   * Error message for unauthorized access
   */
  message?: string;
}

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  // Get full user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      warehouses: true,
    },
  });

  return user;
}

/**
 * Authorization middleware
 */
export async function authorize(
  req: NextRequest,
  config: AuthorizationConfig
): Promise<NextResponse | null> {
  // Get authenticated user
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  // Check role requirement
  if (config.roles) {
    const requiredRoles = Array.isArray(config.roles)
      ? config.roles
      : [config.roles];

    if (!requiredRoles.includes(user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }

  // Check permission requirement
  if (config.permissions) {
    const requiredPermissions = Array.isArray(config.permissions)
      ? config.permissions
      : [config.permissions];

    const hasAccess = config.requireAllPermissions
      ? hasAllPermissions(user.role as UserRole, requiredPermissions)
      : hasAnyPermission(user.role as UserRole, requiredPermissions);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }

  // Custom authorization check
  if (config.authorize) {
    const authorized = await config.authorize(user, req);
    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Access denied',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }

  // Authorization passed
  return null;
}

/**
 * Check if user can access warehouse
 */
export function canAccessWarehouse(
  user: any,
  warehouseId: string
): boolean {
  // Admin can access all warehouses
  if (user.role === UserRole.ADMIN) return true;

  // Check if user is assigned to warehouse
  return user.warehouses?.some((wh: any) => wh.id === warehouseId) || false;
}

/**
 * Check if user owns resource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'order':
        const order = await prisma.salesOrder.findUnique({
          where: { id: resourceId },
          select: { createdById: true },
        });
        return order?.createdById === userId;

      case 'task':
        const task = await prisma.pickingTask.findUnique({
          where: { id: resourceId },
          select: { assignedToId: true },
        });
        return task?.assignedToId === userId;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Create authorization middleware with config
 */
export function requireAuth(config: AuthorizationConfig = {}) {
  return async (req: NextRequest) => authorize(req, config);
}

/**
 * Require admin role
 */
export const requireAdmin = () =>
  requireAuth({ roles: UserRole.ADMIN, message: 'Admin access required' });

/**
 * Require warehouse manager or admin
 */
export const requireManager = () =>
  requireAuth({
    roles: [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER],
    message: 'Manager access required',
  });

/**
 * Require inventory permissions
 */
export const requireInventoryAccess = () =>
  requireAuth({
    permissions: Permission.INVENTORY_VIEW,
    message: 'Inventory access required',
  });

/**
 * Require order management permissions
 */
export const requireOrderAccess = () =>
  requireAuth({
    permissions: Permission.ORDERS_VIEW,
    message: 'Order access required',
  });
