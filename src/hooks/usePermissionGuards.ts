import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/permissions';
import { toast } from 'sonner';

/**
 * Hook to guard operations with permission checks
 * Enforces RBAC by checking user permissions before allowing operations
 */
export const usePermissionGuards = () => {
  const { isAdmin } = useAuth();
  const { can, canView, canDelete, canEdit, canCreate } = usePermissions();

  /**
   * Check if user has permission and show error toast if not
   * Enforces permission validation with user-friendly error messages
   */
  const checkPermission = (permission: Permission, actionName: string): boolean => {
    // Check if user has the required permission
    if (!can(permission)) {
      // Show error message to user
      toast.error(
        `Permission Denied: You do not have permission to ${actionName}. Required permission: ${permission}`,
        {
          duration: 4000,
          description: 'Contact your administrator if you believe this is an error.',
        }
      );
      return false;
    }
    return true;
  };

  /**
   * Check if user can delete an entity type
   * Enforces delete_* permissions based on entity type
   * Shows error toast if permission denied
   */
  const checkCanDelete = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Admin users can delete anything (with logging in auditAdapter)
    if (isAdmin) {
      return true;
    }

    // Check if user has delete permission for this entity type
    if (!canDelete(entityType)) {
      const displayName = entityName ? ` "${entityName}"` : ` this ${entityType}`;
      toast.error(
        `Permission Denied: You do not have permission to delete${displayName}`,
        {
          duration: 4000,
          description: 'Contact your administrator if you believe this is an error.',
        }
      );
      return false;
    }
    return true;
  };

  /**
   * Check if user can delete an entity type (UI-only, no toast)
   * Used for conditionally rendering delete buttons in the UI
   * Does not show any error messages
   */
  const canDeleteUI = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'
  ): boolean => {
    // Admin users can delete anything
    if (isAdmin) {
      return true;
    }

    // Check if user has delete permission for this entity type
    return canDelete(entityType);
  };

  /**
   * Check if user can create an entity type
   * Enforces create_* permissions based on entity type
   * Shows error toast if permission denied
   */
  const checkCanCreate = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Admin users can create anything (with logging in auditAdapter)
    if (isAdmin) {
      return true;
    }

    // Check if user has create permission for this entity type
    if (!canCreate(entityType)) {
      const displayName = entityName ? ` "${entityName}"` : ` a new ${entityType}`;
      toast.error(
        `Permission Denied: You do not have permission to create${displayName}`,
        {
          duration: 4000,
          description: 'Contact your administrator if you believe this is an error.',
        }
      );
      return false;
    }
    return true;
  };

  /**
   * Check if user can create an entity type (UI-only, no toast)
   * Used for conditionally rendering create buttons in the UI
   * Does not show any error messages
   */
  const canCreateUI = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'
  ): boolean => {
    // Admin users can create anything
    if (isAdmin) {
      return true;
    }

    // Check if user has create permission for this entity type
    return canCreate(entityType);
  };

  /**
   * Check if user can edit an entity type
   * Enforces edit_* permissions based on entity type
   * Shows error toast if permission denied
   */
  const checkCanEdit = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment',
    entityName?: string
  ): boolean => {
    // Admin users can edit anything (with logging in auditAdapter)
    if (isAdmin) {
      return true;
    }

    // Check if user has edit permission for this entity type
    if (!canEdit(entityType)) {
      const displayName = entityName ? ` "${entityName}"` : ` this ${entityType}`;
      toast.error(
        `Permission Denied: You do not have permission to edit${displayName}`,
        {
          duration: 4000,
          description: 'Contact your administrator if you believe this is an error.',
        }
      );
      return false;
    }
    return true;
  };

  /**
   * Check if user can edit an entity type (UI-only, no toast)
   * Used for conditionally rendering edit buttons in the UI
   * Does not show any error messages
   */
  const canEditUI = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment'
  ): boolean => {
    // Admin users can edit anything
    if (isAdmin) {
      return true;
    }

    // Check if user has edit permission for this entity type
    return canEdit(entityType);
  };

  /**
   * Check if user can view an entity type
   * Enforces view_* permissions based on entity type
   * Shows error toast if permission denied
   */
  const checkCanView = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment' | 'reports',
    entityName?: string
  ): boolean => {
    // Admin users can view anything (with logging in auditAdapter)
    if (isAdmin) {
      return true;
    }

    // Check if user has view permission for this entity type
    if (!canView(entityType)) {
      const displayName = entityName ? ` "${entityName}"` : ` ${entityType}s`;
      toast.error(
        `Permission Denied: You do not have permission to view${displayName}`,
        {
          duration: 4000,
          description: 'Contact your administrator if you believe this is an error.',
        }
      );
      return false;
    }
    return true;
  };

  /**
   * Check if user can view an entity type (UI-only, no toast)
   * Used for conditionally rendering view elements in the UI
   * Does not show any error messages
   */
  const canViewUI = (
    entityType: 'quotation' | 'invoice' | 'credit_note' | 'proforma' | 'customer' | 'inventory' | 'delivery_note' | 'lpo' | 'remittance' | 'payment' | 'reports'
  ): boolean => {
    // Admin users can view anything
    if (isAdmin) {
      return true;
    }

    // Check if user has view permission for this entity type
    return canView(entityType);
  };

  return {
    isAdmin,
    checkPermission,
    checkCanDelete,
    checkCanCreate,
    checkCanEdit,
    checkCanView,
    canDeleteUI,
    canCreateUI,
    canEditUI,
    canViewUI,
  };
};

export default usePermissionGuards;
