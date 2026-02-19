import { Permission, RoleDefinition } from '@/types/permissions';

/**
 * Normalize permissions to ensure they're always an array
 * Handles cases where permissions come back as JSON strings from the API
 *
 * @param permissions - Permissions that might be an array, JSON string, or null
 * @returns Normalized permissions array
 */
export function normalizePermissions(permissions: any): Permission[] {
  if (!permissions) {
    console.warn('🔐 [normalizePermissions] Permissions is null/undefined');
    return [];
  }

  // If already an array, return it
  if (Array.isArray(permissions)) {
    console.log('✅ [normalizePermissions] Permissions already an array:', permissions.length, 'items');
    return permissions as Permission[];
  }

  // If it's a JSON string, parse it
  if (typeof permissions === 'string') {
    try {
      console.log('🔄 [normalizePermissions] Parsing permissions JSON string...');
      const parsed = JSON.parse(permissions);
      if (Array.isArray(parsed)) {
        console.log('✅ [normalizePermissions] Successfully parsed JSON array:', parsed.length, 'items');
        return parsed as Permission[];
      } else {
        console.warn('⚠️ [normalizePermissions] Parsed JSON is not an array:', parsed);
        return [];
      }
    } catch (error) {
      console.error('❌ [normalizePermissions] Failed to parse permissions JSON:', error, 'Raw value:', permissions);
      return [];
    }
  }

  console.warn('⚠️ [normalizePermissions] Unknown permissions type:', typeof permissions, permissions);
  return [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: RoleDefinition | null | undefined,
  permission: Permission
): boolean {
  if (!role) {
    console.warn(`🔐 [hasPermission] Role is null/undefined, permission check FAILED for: ${permission}`);
    return false;
  }

  if (!role.permissions) {
    console.warn(`🔐 [hasPermission] Role ${role.name} has no permissions array, permission check FAILED for: ${permission}`);
    return false;
  }

  const hasIt = role.permissions.includes(permission);
  if (!hasIt) {
    console.warn(`🔐 [hasPermission] User missing permission: ${permission}`, {
      roleName: role.name,
      roleType: role.role_type,
      userPermissions: role.permissions,
      requiredPermission: permission,
    });
  }

  return hasIt;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: RoleDefinition | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) {
    console.warn(`🔐 [hasAnyPermission] Role is null/undefined, checking permissions: ${permissions.join(', ')}`);
    return false;
  }

  if (!role.permissions) {
    console.warn(`🔐 [hasAnyPermission] Role ${role.name} has no permissions array`);
    return false;
  }

  const hasAny = permissions.some(permission => role.permissions.includes(permission));

  if (!hasAny) {
    console.warn(`🔐 [hasAnyPermission] User has NONE of the required permissions`, {
      roleName: role.name,
      roleType: role.role_type,
      userPermissions: role.permissions,
      requiredPermissions: permissions,
      missingAll: permissions,
    });
  } else {
    console.log(`✅ [hasAnyPermission] User has at least one required permission`, {
      roleName: role.name,
      foundPermissions: permissions.filter(p => role.permissions.includes(p)),
      requiredPermissions: permissions,
    });
  }

  return hasAny;
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(
  role: RoleDefinition | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role || !role.permissions) {
    return false;
  }
  return permissions.every(permission => role.permissions.includes(permission));
}

/**
 * Get the count of permissions a role has
 */
export function getPermissionCount(role: RoleDefinition | null | undefined): number {
  if (!role || !role.permissions) {
    return 0;
  }
  return role.permissions.length;
}

/**
 * Filter a list of permissions based on what a role can do
 */
export function filterPermissionsByRole(
  allPermissions: Permission[],
  role: RoleDefinition | null | undefined
): Permission[] {
  if (!role || !role.permissions) {
    return [];
  }
  return allPermissions.filter(permission => role.permissions.includes(permission));
}

/**
 * Get permissions missing from a role
 */
export function getMissingPermissions(
  role: RoleDefinition | null | undefined,
  requiredPermissions: Permission[]
): Permission[] {
  if (!role || !role.permissions) {
    return requiredPermissions;
  }
  return requiredPermissions.filter(permission => !role.permissions.includes(permission));
}
