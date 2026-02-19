/**
 * Authorized API Adapter Wrapper
 * Wraps the external API adapter with permission checking
 * Enforces granular role-based access control on all operations
 */

import type { IDatabase } from '@/integrations/database/types';
import {
  hasPermission,
  getRequiredPermission,
  isActive,
  userBelongsToCompany,
  AuthContext,
  PermissionDeniedError,
} from './requirePermission';
import { DEFAULT_ROLE_PERMISSIONS, Permission } from '@/types/permissions';

/**
 * Wraps an IDatabase adapter with permission checking
 * Returns a new adapter that enforces permissions on all operations
 */
export function createAuthorizedAdapter(
  baseAdapter: IDatabase,
  authContext: AuthContext
): IDatabase {
  // Validate auth context
  validateAuthContext(authContext);

  return {
    // ============ Auth Methods ============
    setAuthToken: (token: string) => baseAdapter.setAuthToken(token),
    clearAuthToken: () => baseAdapter.clearAuthToken(),
    validateToken: () => baseAdapter.validateToken(),

    // ============ Query Methods ============
    select: async (table: string, filter?: any) => {
      // Check read permission for this table
      checkPermission(authContext, table, 'read', 'select');

      // Non-admin users only see their company's data
      const filteredQuery = authContext.role?.toLowerCase() === 'admin'
        ? filter
        : {
            ...filter,
            company_id: authContext.companyId,
          };

      return baseAdapter.select(table, filteredQuery);
    },

    selectOne: async (table: string, id: string) => {
      // Check read permission
      checkPermission(authContext, table, 'read', 'selectOne');

      // Get the record and verify company ownership for non-admins
      const result = await baseAdapter.selectOne(table, id);

      if (!result.error && result.data && authContext.role?.toLowerCase() !== 'admin') {
        // Verify user's company matches record's company
        const recordCompanyId = (result.data as any)?.company_id;
        if (recordCompanyId !== authContext.companyId) {
          // User doesn't own this record - deny access
          return { data: null, error: new Error(`Access denied: record does not belong to your company`) };
        }
      }

      return result;
    },

    selectBy: async (table: string, filter: Record<string, any>) => {
      // Check read permission
      checkPermission(authContext, table, 'read', 'selectBy');

      // Non-admin users only see their company's data
      const filteredQuery = authContext.role?.toLowerCase() === 'admin'
        ? filter
        : {
            ...filter,
            company_id: authContext.companyId,
          };

      return baseAdapter.selectBy(table, filteredQuery);
    },

    // ============ Insert Methods ============
    insert: async (table: string, data: any) => {
      // Check create permission
      checkPermission(authContext, table, 'create', 'insert');
      // Automatically add company_id if not present
      const dataWithCompany = {
        ...data,
        company_id: data.company_id || authContext.companyId,
      };
      return baseAdapter.insert(table, dataWithCompany);
    },

    insertMany: async (table: string, data: any[]) => {
      // Check create permission
      checkPermission(authContext, table, 'create', 'insertMany');
      // Add company_id to all records
      const dataWithCompany = data.map(record => ({
        ...record,
        company_id: record.company_id || authContext.companyId,
      }));
      return baseAdapter.insertMany(table, dataWithCompany);
    },

    // ============ Update Methods ============
    update: async (table: string, id: string, data: any) => {
      // Check update permission
      checkPermission(authContext, table, 'update', 'update');
      // Verify user owns this record (company isolation)
      await verifyOwnership(authContext, baseAdapter, table, id);
      return baseAdapter.update(table, id, data);
    },

    updateMany: async (table: string, filter: Record<string, any>, data: any) => {
      // Check update permission
      checkPermission(authContext, table, 'update', 'updateMany');
      // Add company filter to ensure user can only update their company's records
      const filteredData = {
        ...filter,
        company_id: authContext.companyId,
      };
      return baseAdapter.updateMany(table, filteredData, data);
    },

    // ============ Delete Methods ============
    delete: async (table: string, id: string) => {
      // Check delete permission
      checkPermission(authContext, table, 'delete', 'delete');
      // Verify user owns this record
      await verifyOwnership(authContext, baseAdapter, table, id);
      return baseAdapter.delete(table, id);
    },

    deleteMany: async (table: string, filter: Record<string, any>) => {
      // Check delete permission
      checkPermission(authContext, table, 'delete', 'deleteMany');
      // Add company filter to prevent deleting other companies' data
      const filteredData = {
        ...filter,
        company_id: authContext.companyId,
      };
      return baseAdapter.deleteMany(table, filteredData);
    },

    // ============ Auth Methods ============
    login: async (email: string, password: string) => {
      return baseAdapter.login(email, password);
    },

    signup: async (email: string, password: string, fullName?: string) => {
      return baseAdapter.signup(email, password, fullName);
    },

    logout: async () => {
      return baseAdapter.logout();
    },

    checkAuth: async () => {
      return baseAdapter.checkAuth();
    },
  };
}

/**
 * Validate that the auth context is properly configured
 */
function validateAuthContext(auth: AuthContext): void {
  if (!auth.userId) {
    throw new Error('AuthContext missing userId');
  }
  if (!auth.email) {
    throw new Error('AuthContext missing email');
  }
  if (!auth.role) {
    throw new Error('AuthContext missing role');
  }
  if (!auth.companyId) {
    throw new Error('AuthContext missing companyId');
  }
  if (!isActive(auth)) {
    throw new Error('User account is not active');
  }
}

/**
 * Check if user has permission for an operation on a table
 */
function checkPermission(
  auth: AuthContext,
  table: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  action: string
): void {
  // Admins bypass all checks
  if (auth.role?.toLowerCase() === 'admin') {
    return;
  }

  // Get required permission for this table operation
  const requiredPermission = getRequiredPermission(action, table, operation);

  // Check if user has the permission
  if (!hasPermission(auth, requiredPermission)) {
    throw new PermissionDeniedError(
      requiredPermission || 'unknown',
      `${operation} on ${table}`,
      auth.userId
    );
  }
}

/**
 * Verify that the user owns/can access this record
 * Ensures company isolation - users can only access their company's data
 */
async function verifyOwnership(
  auth: AuthContext,
  adapter: IDatabase,
  table: string,
  recordId: string
): Promise<void> {
  // Admins can access any record
  if (auth.role?.toLowerCase() === 'admin') {
    return;
  }

  try {
    // Fetch the record
    const result = await adapter.selectOne(table, recordId);

    if (result.error || !result.data) {
      throw new Error(`Record not found: ${table}:${recordId}`);
    }

    // Check company isolation
    if (!userBelongsToCompany(auth, result.data.company_id)) {
      throw new PermissionDeniedError(
        'cross_company_access',
        `access ${table}:${recordId}`,
        auth.userId
      );
    }
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      throw error;
    }
    throw new Error(`Failed to verify record ownership: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Extract auth context from JWT token
 * This is used to populate the AuthContext from the token
 */
export function extractAuthContextFromToken(token: string): AuthContext | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(paddedPayload));

    return {
      userId: decoded.sub || decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.company_id,
      status: decoded.status,
      permissions: decoded.permissions,
    };
  } catch (error) {
    console.warn('Failed to extract auth context from token:', error);
    return null;
  }
}
