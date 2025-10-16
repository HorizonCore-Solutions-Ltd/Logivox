/**
 * Utility Tests - Permission Checking
 */

import {
  checkPermission,
  hasRole,
  canAccessWarehouse,
  canManageInventory,
  canManageOrders,
  canManageUsers,
  canViewReports,
} from '@/lib/utils/permissions';

// Mock user contexts
const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  permissions: ['*'],
  warehouses: [],
};

const managerUser = {
  id: 'manager-1',
  email: 'manager@example.com',
  role: 'WAREHOUSE_MANAGER',
  permissions: ['inventory.manage', 'orders.manage', 'reports.view'],
  warehouses: ['wh-1', 'wh-2'],
};

const operatorUser = {
  id: 'operator-1',
  email: 'operator@example.com',
  role: 'WAREHOUSE_OPERATOR',
  permissions: ['inventory.view', 'orders.view'],
  warehouses: ['wh-1'],
};

describe('Permission Utilities', () => {
  describe('checkPermission', () => {
    it('should allow admin all permissions', () => {
      expect(checkPermission(adminUser, 'inventory.manage')).toBe(true);
      expect(checkPermission(adminUser, 'users.delete')).toBe(true);
      expect(checkPermission(adminUser, 'any.permission')).toBe(true);
    });

    it('should allow specific permissions', () => {
      expect(checkPermission(managerUser, 'inventory.manage')).toBe(true);
      expect(checkPermission(managerUser, 'orders.manage')).toBe(true);
    });

    it('should deny missing permissions', () => {
      expect(checkPermission(operatorUser, 'inventory.manage')).toBe(false);
      expect(checkPermission(operatorUser, 'users.manage')).toBe(false);
    });

    it('should handle wildcard permissions', () => {
      const wildcardUser = {
        ...operatorUser,
        permissions: ['inventory.*'],
      };

      expect(checkPermission(wildcardUser, 'inventory.view')).toBe(true);
      expect(checkPermission(wildcardUser, 'inventory.manage')).toBe(true);
      expect(checkPermission(wildcardUser, 'orders.view')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should check exact role', () => {
      expect(hasRole(adminUser, 'ADMIN')).toBe(true);
      expect(hasRole(adminUser, 'WAREHOUSE_MANAGER')).toBe(false);
    });

    it('should check multiple roles', () => {
      expect(hasRole(managerUser, ['ADMIN', 'WAREHOUSE_MANAGER'])).toBe(true);
      expect(hasRole(operatorUser, ['ADMIN', 'WAREHOUSE_MANAGER'])).toBe(false);
    });
  });

  describe('canAccessWarehouse', () => {
    it('should allow admin access to any warehouse', () => {
      expect(canAccessWarehouse(adminUser, 'wh-1')).toBe(true);
      expect(canAccessWarehouse(adminUser, 'wh-999')).toBe(true);
    });

    it('should allow access to assigned warehouses', () => {
      expect(canAccessWarehouse(managerUser, 'wh-1')).toBe(true);
      expect(canAccessWarehouse(managerUser, 'wh-2')).toBe(true);
    });

    it('should deny access to unassigned warehouses', () => {
      expect(canAccessWarehouse(operatorUser, 'wh-2')).toBe(false);
      expect(canAccessWarehouse(operatorUser, 'wh-3')).toBe(false);
    });

    it('should handle users with no warehouses', () => {
      const userWithNoWarehouses = {
        ...operatorUser,
        warehouses: [],
      };

      expect(canAccessWarehouse(userWithNoWarehouses, 'wh-1')).toBe(false);
    });
  });

  describe('canManageInventory', () => {
    it('should allow admin to manage inventory', () => {
      expect(canManageInventory(adminUser)).toBe(true);
    });

    it('should allow users with inventory.manage permission', () => {
      expect(canManageInventory(managerUser)).toBe(true);
    });

    it('should deny users without permission', () => {
      expect(canManageInventory(operatorUser)).toBe(false);
    });
  });

  describe('canManageOrders', () => {
    it('should allow admin to manage orders', () => {
      expect(canManageOrders(adminUser)).toBe(true);
    });

    it('should allow users with orders.manage permission', () => {
      expect(canManageOrders(managerUser)).toBe(true);
    });

    it('should deny users without permission', () => {
      expect(canManageOrders(operatorUser)).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should allow admin to manage users', () => {
      expect(canManageUsers(adminUser)).toBe(true);
    });

    it('should deny non-admin users', () => {
      expect(canManageUsers(managerUser)).toBe(false);
      expect(canManageUsers(operatorUser)).toBe(false);
    });

    it('should allow users with users.manage permission', () => {
      const userManager = {
        ...managerUser,
        permissions: [...managerUser.permissions, 'users.manage'],
      };

      expect(canManageUsers(userManager)).toBe(true);
    });
  });

  describe('canViewReports', () => {
    it('should allow admin to view reports', () => {
      expect(canViewReports(adminUser)).toBe(true);
    });

    it('should allow users with reports.view permission', () => {
      expect(canViewReports(managerUser)).toBe(true);
    });

    it('should deny users without permission', () => {
      expect(canViewReports(operatorUser)).toBe(false);
    });
  });
});
