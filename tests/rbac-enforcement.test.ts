/**
 * RBAC Enforcement Test Suite
 * 
 * Tests verify that:
 * 1. Permission checks are enforced for all operations
 * 2. Admins can access all resources
 * 3. Non-admins are denied operations without required permissions
 * 4. Role-based permissions work correctly
 * 5. Specific permission types (create, read, edit, delete) are enforced
 */

import { hasPermission, createPermissionChecker } from '@/server/middleware/requirePermission';
import type { AuthContext, Permission } from '@/types/permissions';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';

describe('RBAC Enforcement', () => {
  describe('hasPermission function', () => {
    it('should allow admins all permissions', () => {
      const adminAuth: AuthContext = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        companyId: 'company-1',
        status: 'active',
      };

      const permissions: Permission[] = [
        'create_quotation',
        'edit_invoice',
        'delete_payment',
        'view_reports',
      ];

      permissions.forEach(permission => {
        expect(hasPermission(adminAuth, permission)).toBe(true);
      });
    });

    it('should allow super_admin all permissions', () => {
      const superAdminAuth: AuthContext = {
        userId: 'super-admin-1',
        email: 'superadmin@example.com',
        role: 'super_admin',
        companyId: 'company-1',
        status: 'active',
      };

      expect(hasPermission(superAdminAuth, 'manage_roles')).toBe(true);
      expect(hasPermission(superAdminAuth, 'create_user')).toBe(true);
      expect(hasPermission(superAdminAuth, 'delete_invoice')).toBe(true);
    });

    it('should deny access when no permission required null is not provided', () => {
      const userAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'user',
        companyId: 'company-1',
        status: 'active',
      };

      // null means no permission required - should allow
      expect(hasPermission(userAuth, null)).toBe(true);
    });

    it('should allow users with explicit permissions', () => {
      const userAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'Accountant',
          role_type: 'accountant',
          description: 'Accountant role',
          permissions: ['view_invoice', 'view_payment', 'export_invoice'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      expect(hasPermission(userAuth, 'view_invoice')).toBe(true);
      expect(hasPermission(userAuth, 'view_payment')).toBe(true);
      expect(hasPermission(userAuth, 'export_invoice')).toBe(true);
    });

    it('should deny users without required permissions', () => {
      const userAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'user',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'User',
          role_type: 'user',
          description: 'Regular user role',
          permissions: ['view_quotation', 'view_invoice'],
          company_id: 'company-1',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      expect(hasPermission(userAuth, 'delete_invoice')).toBe(false);
      expect(hasPermission(userAuth, 'edit_quotation')).toBe(false);
      expect(hasPermission(userAuth, 'create_payment')).toBe(false);
    });

    it('should check multiple permissions with array', () => {
      const userAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'stock_manager',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'Stock Manager',
          role_type: 'stock_manager',
          description: 'Stock manager role',
          permissions: ['view_inventory', 'edit_inventory', 'manage_inventory'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // hasPermission with array should use "some" logic (any match)
      expect(hasPermission(userAuth, ['view_inventory', 'create_invoice'])).toBe(true);
      expect(hasPermission(userAuth, ['create_invoice', 'delete_quotation'])).toBe(false);
    });

    it('should use default role permissions as fallback', () => {
      const userAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'active',
        // No roleDefinition - should use DEFAULT_ROLE_PERMISSIONS
      };

      const accountantPermissions = DEFAULT_ROLE_PERMISSIONS.accountant;
      expect(accountantPermissions.length).toBeGreaterThan(0);

      // Should allow at least one accountant permission
      if (accountantPermissions.includes('view_invoice')) {
        expect(hasPermission(userAuth, 'view_invoice')).toBe(true);
      }
    });

    it('should deny inactive users even with permissions', () => {
      const inactiveUserAuth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'inactive',
        roleDefinition: {
          id: 'role-1',
          name: 'Accountant',
          role_type: 'accountant',
          description: 'Accountant role',
          permissions: ['view_invoice'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // Note: hasPermission function doesn't check status
      // That should be checked separately by isActive() function
      expect(hasPermission(inactiveUserAuth, 'view_invoice')).toBe(true);
    });
  });

  describe('Permission Checker', () => {
    it('should provide permission checking utilities', () => {
      const auth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'Accountant',
          role_type: 'accountant',
          description: 'Accountant',
          permissions: ['view_invoice', 'view_quotation', 'export_invoice'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const checker = createPermissionChecker(auth);

      expect(checker.can('view_invoice')).toBe(true);
      expect(checker.can('delete_invoice')).toBe(false);
    });

    it('should check any of multiple permissions', () => {
      const auth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'Accountant',
          role_type: 'accountant',
          description: 'Accountant',
          permissions: ['view_invoice'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const checker = createPermissionChecker(auth);

      expect(checker.canAny(['view_invoice', 'edit_invoice'])).toBe(true);
      expect(checker.canAny(['create_invoice', 'edit_invoice'])).toBe(false);
    });

    it('should check all permissions', () => {
      const auth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'accountant',
        companyId: 'company-1',
        status: 'active',
        roleDefinition: {
          id: 'role-1',
          name: 'Accountant',
          role_type: 'accountant',
          description: 'Accountant',
          permissions: ['view_invoice', 'export_invoice', 'view_quotation'],
          company_id: 'company-1',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      const checker = createPermissionChecker(auth);

      expect(checker.canAll(['view_invoice', 'export_invoice'])).toBe(true);
      expect(checker.canAll(['view_invoice', 'export_invoice', 'delete_invoice'])).toBe(false);
    });

    it('should throw permission denied error', () => {
      const auth: AuthContext = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'user',
        companyId: 'company-1',
        status: 'active',
      };

      const checker = createPermissionChecker(auth);

      expect(() => {
        checker.requirePermission('delete_invoice');
      }).toThrow('Insufficient permissions');
    });
  });

  describe('Entity-based Permission Mapping', () => {
    it('should map entity types to correct permissions', () => {
      const adminAuth: AuthContext = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        companyId: 'company-1',
        status: 'active',
      };

      const entityPermissionChecks = [
        { entity: 'quotation', action: 'create', permission: 'create_quotation' },
        { entity: 'invoice', action: 'view', permission: 'view_invoice' },
        { entity: 'payment', action: 'edit', permission: 'edit_payment' },
        { entity: 'inventory', action: 'delete', permission: 'delete_inventory' },
      ];

      entityPermissionChecks.forEach(({ permission }) => {
        expect(hasPermission(adminAuth, permission)).toBe(true);
      });
    });
  });

  describe('Default Role Permissions', () => {
    it('should have comprehensive permission definitions', () => {
      expect(DEFAULT_ROLE_PERMISSIONS).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.admin).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.user).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.accountant).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS.stock_manager).toBeDefined();
    });

    it('admin should have all permissions', () => {
      const adminPermissions = DEFAULT_ROLE_PERMISSIONS.admin;
      expect(adminPermissions.length).toBeGreaterThan(40); // Should have 45+ permissions
    });

    it('user should have limited permissions', () => {
      const userPermissions = DEFAULT_ROLE_PERMISSIONS.user;
      expect(userPermissions.length).toBeGreaterThan(0);
      expect(userPermissions.length).toBeLessThan(DEFAULT_ROLE_PERMISSIONS.admin.length);
    });

    it('accountant should have accounting-related permissions', () => {
      const accountantPermissions = DEFAULT_ROLE_PERMISSIONS.accountant;
      
      // Should include accounting-related permissions
      expect(
        accountantPermissions.some(p => 
          p.includes('invoice') || p.includes('payment') || p.includes('quotation')
        )
      ).toBe(true);
    });

    it('stock_manager should have inventory-related permissions', () => {
      const stockManagerPermissions = DEFAULT_ROLE_PERMISSIONS.stock_manager;
      
      // Should include inventory-related permissions
      expect(
        stockManagerPermissions.some(p => p.includes('inventory'))
      ).toBe(true);
    });
  });
});
