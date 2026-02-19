/**
 * Route Permission Mappings
 * Maps application routes to required permissions for access
 * 
 * If a route has multiple permissions, user must have ANY of them to access (OR logic)
 * If a route requires admin role, it will be restricted to admins regardless of permissions
 */

import { Permission } from '@/types/permissions';

export interface RoutePermissionConfig {
  requiredPermissions?: Permission[];
  requiresAdminRole?: boolean;
  description?: string;
}

export type RoutePermissionMap = Record<string, RoutePermissionConfig>;

export const routePermissionMap: RoutePermissionMap = {
  // Dashboard - accessible to all authenticated users
  '/app': {
    requiredPermissions: [],
    description: 'Main dashboard'
  },

  // Sales Routes
  '/app/quotations': {
    requiredPermissions: ['view_quotation', 'create_quotation', 'edit_quotation'],
    description: 'Quotations list and management'
  },
  '/app/quotations/new': {
    requiredPermissions: ['create_quotation'],
    description: 'Create new quotation'
  },

  '/app/proforma': {
    requiredPermissions: ['view_proforma', 'create_proforma', 'edit_proforma'],
    description: 'Proforma invoices'
  },

  '/app/invoices': {
    requiredPermissions: ['view_invoice', 'create_invoice', 'edit_invoice'],
    description: 'Invoices list and management'
  },
  '/app/invoices/new': {
    requiredPermissions: ['create_invoice'],
    description: 'Create new invoice'
  },

  '/app/direct-receipts': {
    requiredPermissions: ['view_payment', 'create_payment'],
    description: 'Direct receipts'
  },

  '/app/credit-notes': {
    requiredPermissions: ['view_credit_note', 'create_credit_note', 'edit_credit_note'],
    description: 'Credit notes'
  },

  // Payment Routes
  '/app/payments': {
    requiredPermissions: ['view_payment', 'create_payment', 'edit_payment'],
    description: 'Payments management'
  },

  '/app/remittance': {
    requiredPermissions: ['view_remittance', 'create_remittance', 'edit_remittance'],
    description: 'Remittance advice'
  },

  // Inventory Routes
  '/app/inventory': {
    requiredPermissions: ['view_inventory', 'create_inventory', 'edit_inventory'],
    description: 'Inventory management'
  },

  '/app/stock-movements': {
    requiredPermissions: ['view_inventory'],
    description: 'Stock movements tracking'
  },

  // Delivery Notes
  '/app/delivery-notes': {
    requiredPermissions: ['view_delivery_note', 'create_delivery_note', 'edit_delivery_note'],
    description: 'Delivery notes'
  },

  // Transport Routes
  '/app/transport/drivers': {
    requiredPermissions: ['manage_transport'],
    description: 'Transport drivers management'
  },
  '/app/transport/vehicles': {
    requiredPermissions: ['manage_transport'],
    description: 'Transport vehicles management'
  },
  '/app/transport/materials': {
    requiredPermissions: ['manage_transport'],
    description: 'Transport materials management'
  },
  '/app/transport/finance': {
    requiredPermissions: ['manage_transport'],
    description: 'Transport finance'
  },

  // Customers
  '/app/customers': {
    requiredPermissions: ['view_customer', 'create_customer', 'edit_customer'],
    description: 'Customers management'
  },
  '/app/customers/new': {
    requiredPermissions: ['create_customer'],
    description: 'Create new customer'
  },

  // Purchase Orders
  '/app/lpos': {
    requiredPermissions: ['view_lpo', 'create_lpo', 'edit_lpo'],
    description: 'Local purchase orders'
  },

  '/app/suppliers': {
    requiredPermissions: ['view_supplier', 'create_supplier', 'edit_supplier'],
    description: 'Suppliers management'
  },

  // Reports
  '/app/reports/sales': {
    requiredPermissions: ['view_reports'],
    description: 'Sales reports'
  },
  '/app/reports/inventory': {
    requiredPermissions: ['view_reports'],
    description: 'Inventory reports'
  },
  '/app/reports/statements': {
    requiredPermissions: ['view_reports'],
    description: 'Customer statements'
  },
  '/app/reports/trading-pl': {
    requiredPermissions: ['view_reports'],
    description: 'Trading P&L report'
  },
  '/app/reports/transport-pl': {
    requiredPermissions: ['view_reports'],
    description: 'Transport P&L report'
  },
  '/app/reports/consolidated-pl': {
    requiredPermissions: ['view_reports'],
    description: 'Consolidated P&L report'
  },

  // Settings (Admin only)
  '/app/settings/company': {
    requiresAdminRole: true,
    description: 'Company settings'
  },
  '/app/settings/users': {
    requiresAdminRole: true,
    description: 'User management'
  },
  '/app/settings/payment-methods': {
    requiresAdminRole: true,
    description: 'Payment methods configuration'
  },
  '/app/settings/database-roles': {
    requiresAdminRole: true,
    description: 'Database and roles management'
  },

  // Admin (Admin only)
  '/app/admin/images': {
    requiresAdminRole: true,
    description: 'Image management'
  },
  '/app/admin/etims': {
    requiresAdminRole: true,
    description: 'eTIMS integration management'
  },
  '/app/admin/audit-logs': {
    requiredPermissions: ['view_audit_logs'],
    description: 'Audit logs'
  },
  '/app/admin/database': {
    requiresAdminRole: true,
    description: 'Database management'
  }
};

/**
 * Get required permissions for a specific route
 * 
 * @param route - The route path
 * @returns Route permission configuration or null if not defined
 */
export function getRoutePermissionConfig(route: string): RoutePermissionConfig | null {
  return routePermissionMap[route] || null;
}

/**
 * Check if a user can access a specific route based on permissions
 * 
 * @param route - The route path
 * @param canPermission - Function to check if user has a specific permission
 * @param isAdmin - Whether the user is an admin
 * @returns true if user can access the route, false otherwise
 */
export function canAccessRoute(
  route: string,
  canPermission: (permission: string) => boolean,
  isAdmin: boolean
): boolean {
  const config = getRoutePermissionConfig(route);

  if (!config) {
    // Route not defined, allow access (or could default to deny)
    return true;
  }

  // Check if admin role is required
  if (config.requiresAdminRole && !isAdmin) {
    return false;
  }

  // If no required permissions, access is allowed (who passed admin check)
  if (!config.requiredPermissions || config.requiredPermissions.length === 0) {
    return true;
  }

  // User must have ANY of the required permissions
  return config.requiredPermissions.some(permission => canPermission(permission));
}
