/**
 * usePermissionActions Hook
 * Provides utilities for checking permissions and managing permission-based UI actions
 */

import { useCallback } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/permissions';
import { toast } from 'sonner';

interface ActionConfig {
  permission: Permission;
  entityType?: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment';
  actionType?: 'view' | 'create' | 'edit' | 'delete';
  showToast?: boolean;
  toastMessage?: string;
}

interface ActionResult {
  allowed: boolean;
  message?: string;
}

export function usePermissionActions() {
  const {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    role,
    loading,
  } = usePermissions();

  /**
   * Check if an action is allowed and optionally show a toast if denied
   */
  const checkAction = useCallback(
    (config: ActionConfig): ActionResult => {
      let allowed = false;

      // Check specific permission
      if (config.permission) {
        allowed = can(config.permission);
      }

      // If no explicit permission but have entity type and action type
      if (!allowed && config.entityType && config.actionType) {
        switch (config.actionType) {
          case 'view':
            allowed = canView(config.entityType);
            break;
          case 'create':
            allowed = canCreate(config.entityType);
            break;
          case 'edit':
            allowed = canEdit(config.entityType);
            break;
          case 'delete':
            allowed = canDelete(config.entityType);
            break;
        }
      }

      if (!allowed && config.showToast !== false) {
        const message = config.toastMessage ||
          `You don't have permission to ${config.actionType || 'perform'} this action`;
        toast.error(message);
      }

      return {
        allowed,
        message: allowed ? undefined : 'Permission denied',
      };
    },
    [can, canView, canCreate, canEdit, canDelete]
  );

  /**
   * Create an action handler that enforces permissions
   */
  const createProtectedAction = useCallback(
    (config: ActionConfig, handler: () => void | Promise<void>) => {
      return async () => {
        const result = checkAction(config);
        if (result.allowed) {
          try {
            await Promise.resolve(handler());
          } catch (error) {
            console.error('Action error:', error);
            toast.error('Action failed');
          }
        }
      };
    },
    [checkAction]
  );

  /**
   * Check if user can perform multiple permissions (all required)
   */
  const canPerformAll = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every(p => can(p));
    },
    [can]
  );

  /**
   * Check if user can perform any of the permissions
   */
  const canPerformAny = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some(p => can(p));
    },
    [can]
  );

  /**
   * Get user's role information
   */
  const getRoleInfo = useCallback(() => {
    return {
      name: role?.name || 'unknown',
      type: role?.role_type || 'user',
      permissions: role?.permissions || [],
      isDefault: role?.is_default || false,
    };
  }, [role]);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return role?.role_type === 'admin' || role?.name?.toLowerCase() === 'admin';
  }, [role]);

  return {
    checkAction,
    createProtectedAction,
    canPerformAll,
    canPerformAny,
    getRoleInfo,
    isAdmin,
    // Re-export individual checks for convenience
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    role,
    loading,
  };
}

export default usePermissionActions;
