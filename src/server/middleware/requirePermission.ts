/**
 * Permission Checking Middleware
 * Validates that API requests have the required permissions
 * 
 * This middleware should be applied to all API operations to enforce
 * granular role-based access control at the adapter level
 */

import { Permission, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import { RoleDefinition } from '@/types/permissions';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  status?: 'active' | 'inactive';
  permissions?: Permission[];
  roleDefinition?: RoleDefinition;
}

/**
 * Mapping of API actions to required permissions
 * Used to determine what permission is needed for each operation
 */
const ACTION_PERMISSION_MAP: Record<string, Permission | Permission[]> = {
  // Quotation operations
  'create_quotation': 'create_quotation',
  'view_quotation': 'view_quotation',
  'edit_quotation': 'edit_quotation',
  'delete_quotation': 'delete_quotation',
  'export_quotation': 'export_quotation',

  // Invoice operations
  'create_invoice': 'create_invoice',
  'view_invoice': 'view_invoice',
  'edit_invoice': 'edit_invoice',
  'delete_invoice': 'delete_invoice',
  'export_invoice': 'export_invoice',

  // Credit Note operations
  'create_credit_note': 'create_credit_note',
  'view_credit_note': 'view_credit_note',
  'edit_credit_note': 'edit_credit_note',
  'delete_credit_note': 'delete_credit_note',
  'export_credit_note': 'export_credit_note',

  // Proforma operations
  'create_proforma': 'create_proforma',
  'view_proforma': 'view_proforma',
  'edit_proforma': 'edit_proforma',
  'delete_proforma': 'delete_proforma',
  'export_proforma': 'export_proforma',

  // Payment operations
  'create_payment': 'create_payment',
  'view_payment': 'view_payment',
  'edit_payment': 'edit_payment',
  'delete_payment': 'delete_payment',

  // Inventory operations
  'create_inventory': 'create_inventory',
  'view_inventory': 'view_inventory',
  'edit_inventory': 'edit_inventory',
  'delete_inventory': 'delete_inventory',
  'manage_inventory': 'manage_inventory',

  // Customer operations
  'create_customer': 'create_customer',
  'view_customer': 'view_customer',
  'edit_customer': 'edit_customer',
  'delete_customer': 'delete_customer',

  // Delivery Note operations
  'create_delivery_note': 'create_delivery_note',
  'view_delivery_note': 'view_delivery_note',
  'edit_delivery_note': 'edit_delivery_note',
  'delete_delivery_note': 'delete_delivery_note',

  // LPO operations
  'create_lpo': 'create_lpo',
  'view_lpo': 'view_lpo',
  'edit_lpo': 'edit_lpo',
  'delete_lpo': 'delete_lpo',

  // Remittance operations
  'create_remittance': 'create_remittance',
  'view_remittance': 'view_remittance',
  'edit_remittance': 'edit_remittance',
  'delete_remittance': 'delete_remittance',

  // Report operations
  'view_reports': 'view_reports',
  'export_reports': 'export_reports',

  // User management operations
  'create_user': 'create_user',
  'edit_user': 'edit_user',
  'delete_user': 'delete_user',
  'manage_users': 'manage_users',

  // Role and permission operations (admin only)
  'manage_roles': 'manage_roles',
  'manage_permissions': 'manage_permissions',
};

/**
 * Table-based permission mapping
 * Maps table names to their CRUD permissions
 */
const TABLE_PERMISSION_MAP: Record<string, Record<'create' | 'read' | 'update' | 'delete', Permission>> = {
  'quotations': {
    'create': 'create_quotation',
    'read': 'view_quotation',
    'update': 'edit_quotation',
    'delete': 'delete_quotation',
  },
  'invoices': {
    'create': 'create_invoice',
    'read': 'view_invoice',
    'update': 'edit_invoice',
    'delete': 'delete_invoice',
  },
  'credit_notes': {
    'create': 'create_credit_note',
    'read': 'view_credit_note',
    'update': 'edit_credit_note',
    'delete': 'delete_credit_note',
  },
  'proformas': {
    'create': 'create_proforma',
    'read': 'view_proforma',
    'update': 'edit_proforma',
    'delete': 'delete_proforma',
  },
  'payments': {
    'create': 'create_payment',
    'read': 'view_payment',
    'update': 'edit_payment',
    'delete': 'delete_payment',
  },
  'inventory': {
    'create': 'create_inventory',
    'read': 'view_inventory',
    'update': 'edit_inventory',
    'delete': 'delete_inventory',
  },
  'customers': {
    'create': 'create_customer',
    'read': 'view_customer',
    'update': 'edit_customer',
    'delete': 'delete_customer',
  },
  'delivery_notes': {
    'create': 'create_delivery_note',
    'read': 'view_delivery_note',
    'update': 'edit_delivery_note',
    'delete': 'delete_delivery_note',
  },
  'lpos': {
    'create': 'create_lpo',
    'read': 'view_lpo',
    'update': 'edit_lpo',
    'delete': 'delete_lpo',
  },
  'remittance_advice': {
    'create': 'create_remittance',
    'read': 'view_remittance',
    'update': 'edit_remittance',
    'delete': 'delete_remittance',
  },
};

/**
 * Get the required permission for an API action and table
 */
export function getRequiredPermission(
  action: string,
  table?: string,
  operation?: 'create' | 'read' | 'update' | 'delete'
): Permission | Permission[] | null {
  // First check the action-specific map
  if (ACTION_PERMISSION_MAP[action]) {
    return ACTION_PERMISSION_MAP[action];
  }

  // Then check table-based permissions
  if (table && operation && TABLE_PERMISSION_MAP[table]) {
    return TABLE_PERMISSION_MAP[table][operation];
  }

  // Default: no permission required (allow all)
  // This is fail-open - unrecognized actions are allowed
  // Change to return null and enforce deny-by-default if preferred
  return null;
}

/**
 * Check if a user has permission for an action
 */
export function hasPermission(
  auth: AuthContext,
  requiredPermission: Permission | Permission[] | null
): boolean {
  // If no permission is required, allow the action
  if (requiredPermission === null) {
    return true;
  }

  // Admins bypass permission checks
  if (auth.role?.toLowerCase() === 'admin') {
    return true;
  }

  // Use role definition if available
  if (auth.roleDefinition?.permissions) {
    const permissions = auth.roleDefinition.permissions;
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(p => permissions.includes(p));
    }
    return permissions.includes(requiredPermission);
  }

  // Fall back to explicit permissions array
  if (auth.permissions) {
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(p => auth.permissions?.includes(p));
    }
    return auth.permissions.includes(requiredPermission);
  }

  // Fall back to default role permissions
  const roleType = auth.role?.toLowerCase() as keyof typeof DEFAULT_ROLE_PERMISSIONS;
  if (roleType && DEFAULT_ROLE_PERMISSIONS[roleType]) {
    const permissions = DEFAULT_ROLE_PERMISSIONS[roleType];
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(p => permissions.includes(p));
    }
    return permissions.includes(requiredPermission);
  }

  // Deny by default
  return false;
}

/**
 * Validate user is active (not deleted/suspended)
 */
export function isActive(auth: AuthContext): boolean {
  return auth.status === 'active' || !auth.status; // Default to active if not specified
}

/**
 * Validate user belongs to the specified company
 */
export function userBelongsToCompany(auth: AuthContext, companyId: string): boolean {
  return auth.companyId === companyId;
}

/**
 * Create a permission checker function for use with API adapters
 */
export function createPermissionChecker(auth: AuthContext) {
  return {
    can: (permission: Permission): boolean => {
      return hasPermission(auth, permission);
    },

    canAny: (permissions: Permission[]): boolean => {
      return hasPermission(auth, permissions);
    },

    canAll: (permissions: Permission[]): boolean => {
      const rolePermissions = auth.roleDefinition?.permissions || 
                            auth.permissions || 
                            DEFAULT_ROLE_PERMISSIONS[auth.role?.toLowerCase() as any] || 
                            [];
      return permissions.every(p => rolePermissions.includes(p));
    },

    requirePermission: (permission: Permission): void => {
      if (!this.can(permission)) {
        throw new Error(`Insufficient permissions: requires ${permission}`);
      }
    },

    requireAny: (permissions: Permission[]): void => {
      if (!this.canAny(permissions)) {
        throw new Error(`Insufficient permissions: requires any of ${permissions.join(', ')}`);
      }
    },

    requireAll: (permissions: Permission[]): void => {
      if (!this.canAll(permissions)) {
        throw new Error(`Insufficient permissions: requires all of ${permissions.join(', ')}`);
      }
    },
  };
}

/**
 * Error class for permission violations
 */
export class PermissionDeniedError extends Error {
  constructor(
    public permission: Permission | Permission[],
    public action: string,
    public userId: string
  ) {
    const permStr = Array.isArray(permission) ? permission.join(', ') : permission;
    super(`User ${userId} denied access: requires ${permStr} for action ${action}`);
    this.name = 'PermissionDeniedError';
  }
}
