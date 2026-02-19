import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { RoleDefinition, Permission, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import { logRoleChange } from '@/utils/auditLogger';
import { apiClient } from '@/integrations/api';

interface CreateRoleData {
  name: string;
  description?: string;
  permissions: Permission[];
  company_id?: string;
}

interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

export const useRoleManagement = () => {
  const { profile: currentUser, isAdmin } = useAuth();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all roles for the current company
   * Uses the external API to ensure roles are synced with authorization checks
   */
  const fetchRoles = useCallback(async () => {
    if (!isAdmin || !currentUser?.company_id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch roles from the external API (MySQL backend)
      // This ensures authorization checks use the same role data
      const result = await apiClient.adapter.selectBy('roles', {
        company_id: currentUser.company_id,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter and sort the roles
      const roleList = (Array.isArray(result.data) ? result.data : []) as RoleDefinition[];
      const sortedRoles = roleList.sort((a, b) => {
        // Default roles first
        if (a.is_default !== b.is_default) {
          return (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0);
        }
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });

      setRoles(sortedRoles);
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'fetching roles');
      console.error('Error fetching roles:', err);
      setError(errorMessage);
      toast.error(`Error fetching roles: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser?.company_id]);

  /**
   * Create a new custom role
   */
  const createRole = async (data: CreateRoleData): Promise<{ success: boolean; role?: RoleDefinition; error?: string }> => {
    if (!isAdmin || !currentUser?.company_id) {
      toast.error('You are not authorized or no company is selected');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const companyIdToUse = data.company_id || currentUser.company_id;
      const roleData = {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        company_id: companyIdToUse,
        role_type: 'custom',
        is_default: false,
      };

      // Insert via the external API
      const result = await apiClient.adapter.insert('roles', roleData);

      if (result.error) {
        throw new Error(result.error);
      }

      const newRole = result.data as RoleDefinition;

      // Log the role creation
      try {
        await logRoleChange('create', newRole.id, data.name, companyIdToUse, {
          permissions: data.permissions,
        });
      } catch (auditError) {
        console.error('Failed to log role creation:', auditError);
      }

      toast.success('Role created successfully');
      await fetchRoles();
      return { success: true, role: newRole };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'role creation');
      console.error('Error creating role:', err);
      toast.error(`Failed to create role: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing role
   */
  const updateRole = async (
    roleId: string,
    data: UpdateRoleData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      toast.error('You are not authorized to update roles');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      // Get the current role to check if it's default
      const currentRole = roles.find(r => r.id === roleId);
      if (currentRole?.is_default && !isAdmin) {
        return { success: false, error: 'Cannot modify default roles' };
      }

      // Update via the external API
      const result = await apiClient.adapter.update('roles', roleId, data);

      if (result.error) {
        throw new Error(result.error);
      }

      // Log the role update with detailed permission changes
      try {
        const roleName = data.name || currentRole?.name || 'Unknown';
        const auditDetails: any = {
          changes: data,
        };

        // Track permission changes in detail
        if (data.permissions && currentRole?.permissions) {
          const oldPermissions = new Set(currentRole.permissions);
          const newPermissions = new Set(data.permissions);

          const addedPermissions = Array.from(newPermissions).filter(p => !oldPermissions.has(p));
          const removedPermissions = Array.from(oldPermissions).filter(p => !newPermissions.has(p));

          if (addedPermissions.length > 0 || removedPermissions.length > 0) {
            auditDetails.permission_changes = {
              added: addedPermissions,
              removed: removedPermissions,
              total_permissions: data.permissions.length,
            };
          }
        }

        await logRoleChange('update', roleId, roleName, currentUser?.company_id || '', auditDetails);
      } catch (auditError) {
        console.error('Failed to log role update:', auditError);
      }

      toast.success('Role updated successfully');
      await fetchRoles();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'role update');
      console.error('Error updating role:', err);
      toast.error(`Failed to update role: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a custom role
   */
  const deleteRole = async (roleId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      toast.error('You are not authorized to delete roles');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const currentRole = roles.find(r => r.id === roleId);

      if (currentRole?.is_default) {
        return { success: false, error: 'Cannot delete default roles' };
      }

      // Check if any users have this role
      const usersResult = await apiClient.adapter.selectBy('profiles', {
        role: currentRole?.name,
      });

      const usersWithRole = Array.isArray(usersResult.data) ? usersResult.data : [];
      if (usersWithRole.length > 0) {
        return {
          success: false,
          error: 'Cannot delete role with assigned users. Please reassign users first.',
        };
      }

      // Delete via the external API
      const result = await apiClient.adapter.delete('roles', roleId);

      if (result.error) {
        throw new Error(result.error);
      }

      // Log the role deletion
      try {
        await logRoleChange('delete', roleId, currentRole?.name || 'Unknown', currentUser?.company_id || '', {
          deleted_at: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error('Failed to log role deletion:', auditError);
      }

      toast.success('Role deleted successfully');
      await fetchRoles();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'role deletion');
      console.error('Error deleting role:', err);
      toast.error(`Failed to delete role: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update permissions for a role
   */
  const updateRolePermissions = async (
    roleId: string,
    permissions: Permission[]
  ): Promise<{ success: boolean; error?: string }> => {
    return updateRole(roleId, { permissions });
  };

  /**
   * Get default permissions for a role type
   */
  const getDefaultPermissions = (roleType: string): Permission[] => {
    const key = roleType as keyof typeof DEFAULT_ROLE_PERMISSIONS;
    return DEFAULT_ROLE_PERMISSIONS[key] || [];
  };

  /**
   * Initialize default roles for a company (if not already done)
   */
  const initializeDefaultRoles = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || !currentUser?.company_id) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Check if default roles already exist
      const existingResult = await apiClient.adapter.selectBy('roles', {
        company_id: currentUser.company_id,
        is_default: true,
      });

      const existingRoles = Array.isArray(existingResult.data) ? existingResult.data : [];
      if (existingRoles.length > 0) {
        return { success: true }; // Already initialized
      }

      // Create default roles
      const defaultRoles = [
        {
          name: 'admin',
          description: 'Administrator with full system access',
          permissions: DEFAULT_ROLE_PERMISSIONS.admin,
          company_id: currentUser.company_id,
          role_type: 'admin',
          is_default: true,
        },
        {
          name: 'accountant',
          description: 'Accountant with financial access',
          permissions: DEFAULT_ROLE_PERMISSIONS.accountant,
          company_id: currentUser.company_id,
          role_type: 'accountant',
          is_default: true,
        },
        {
          name: 'stock_manager',
          description: 'Stock Manager with inventory management access',
          permissions: DEFAULT_ROLE_PERMISSIONS.stock_manager,
          company_id: currentUser.company_id,
          role_type: 'stock_manager',
          is_default: true,
        },
        {
          name: 'user',
          description: 'Basic user with limited access',
          permissions: DEFAULT_ROLE_PERMISSIONS.user,
          company_id: currentUser.company_id,
          role_type: 'user',
          is_default: true,
        },
      ];

      // Insert each default role via the external API
      for (const roleData of defaultRoles) {
        const result = await apiClient.adapter.insert('roles', roleData);
        if (result.error) {
          throw new Error(`Failed to create ${roleData.name} role: ${result.error}`);
        }
      }

      await fetchRoles();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'initializing default roles');
      console.error('Error initializing default roles:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Fetch roles on mount
  useEffect(() => {
    if (isAdmin) {
      fetchRoles();
      initializeDefaultRoles();
    }
  }, [isAdmin, currentUser?.company_id]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    updateRolePermissions,
    getDefaultPermissions,
    initializeDefaultRoles,
  };
};

export default useRoleManagement;
