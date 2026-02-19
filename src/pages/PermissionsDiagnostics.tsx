/**
 * Permission Diagnostics Page
 * Helps troubleshoot permission-related issues by showing detailed info
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getDatabase } from '@/integrations/database';

interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error' | 'loading';
  message: string;
  details?: any;
}

export default function PermissionsDiagnostics() {
  const { profile, isAdmin } = useAuth();
  const { role, loading: permissionsLoading, can } = usePermissions();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [scanning, setScanning] = useState(false);

  const runDiagnostics = async () => {
    setScanning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Check user authentication
      if (!profile) {
        results.push({
          category: 'Authentication',
          status: 'error',
          message: 'No authenticated user',
          details: 'User is not logged in'
        });
      } else {
        results.push({
          category: 'Authentication',
          status: 'success',
          message: `User authenticated: ${profile.email}`,
          details: {
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            company_id: profile.company_id,
          }
        });
      }

      // 2. Check role assignment
      if (!profile?.role) {
        results.push({
          category: 'Role Assignment',
          status: 'error',
          message: 'No role assigned to user',
          details: 'User profile has no role property'
        });
      } else {
        results.push({
          category: 'Role Assignment',
          status: 'success',
          message: `User role: ${profile.role}`,
          details: { assignedRole: profile.role }
        });
      }

      // 3. Check role definition from profile
      if (profile?.roleDefinition) {
        results.push({
          category: 'Role Definition (from Profile)',
          status: 'success',
          message: 'Role definition loaded from user profile',
          details: {
            id: profile.roleDefinition.id,
            name: profile.roleDefinition.name,
            role_type: profile.roleDefinition.role_type,
            permissionCount: profile.roleDefinition.permissions?.length || 0,
            permissions: profile.roleDefinition.permissions,
          }
        });
      } else if (profile?.role) {
        results.push({
          category: 'Role Definition (from Profile)',
          status: 'warning',
          message: 'No role definition in user profile - will fetch from database',
          details: null
        });
      }

      // 4. Check role from usePermissions hook
      if (role) {
        results.push({
          category: 'Role Definition (from usePermissions)',
          status: 'success',
          message: 'Role loaded from usePermissions hook',
          details: {
            id: role.id,
            name: role.name,
            role_type: role.role_type,
            permissionCount: role.permissions?.length || 0,
            permissions: role.permissions,
          }
        });
      } else if (!permissionsLoading) {
        results.push({
          category: 'Role Definition (from usePermissions)',
          status: 'warning',
          message: 'usePermissions hook has null role and is not loading',
          details: 'This could indicate role fetch failed'
        });
      }

      // 5. Check if usePermissions is still loading
      if (permissionsLoading) {
        results.push({
          category: 'Permission Hook Status',
          status: 'loading',
          message: 'usePermissions hook is still loading',
          details: 'Permissions might fail temporarily during page load'
        });
      } else {
        results.push({
          category: 'Permission Hook Status',
          status: 'success',
          message: 'usePermissions hook loading complete',
          details: null
        });
      }

      // 6. Check specific invoice permissions
      if (!permissionsLoading) {
        const permissions = [
          { name: 'view_invoice', result: can('view_invoice') },
          { name: 'create_invoice', result: can('create_invoice') },
          { name: 'edit_invoice', result: can('edit_invoice') },
        ];

        const hasAllInvoicePerms = permissions.every(p => p.result);
        const hasAnyInvoicePerms = permissions.some(p => p.result);

        results.push({
          category: 'Invoice Permissions Check',
          status: hasAllInvoicePerms ? 'success' : hasAnyInvoicePerms ? 'warning' : 'error',
          message: hasAllInvoicePerms 
            ? 'Has all required invoice permissions' 
            : hasAnyInvoicePerms 
            ? 'Has some but not all invoice permissions' 
            : 'Missing invoice permissions',
          details: {
            permissions,
            hasAll: hasAllInvoicePerms,
            hasAny: hasAnyInvoicePerms,
          }
        });
      }

      // 7. Try to fetch role directly from database
      if (profile?.role && profile?.company_id) {
        try {
          const db = getDatabase();
          const result = await db.selectBy('roles', {
            name: profile.role,
            company_id: profile.company_id,
          });

          if (result.error) {
            results.push({
              category: 'Database Role Fetch',
              status: 'error',
              message: `Failed to fetch role from database: ${result.error.message}`,
              details: { error: result.error.message }
            });
          } else if (!result.data || result.data.length === 0) {
            results.push({
              category: 'Database Role Fetch',
              status: 'error',
              message: 'Role not found in database',
              details: {
                searchedFor: { name: profile.role, company_id: profile.company_id },
                resultCount: 0
              }
            });
          } else {
            const dbRole = result.data[0];
            const permissions = dbRole.permissions;
            const permissionsArray = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
            
            results.push({
              category: 'Database Role Fetch',
              status: 'success',
              message: 'Role successfully fetched from database',
              details: {
                id: dbRole.id,
                name: dbRole.name,
                role_type: dbRole.role_type,
                permissionsType: typeof permissions,
                permissionCount: Array.isArray(permissionsArray) ? permissionsArray.length : 0,
                permissions: permissionsArray,
              }
            });
          }
        } catch (err) {
          results.push({
            category: 'Database Role Fetch',
            status: 'error',
            message: `Exception fetching role: ${err instanceof Error ? err.message : 'Unknown error'}`,
            details: { error: err }
          });
        }
      }

      // 8. Check if user is admin
      results.push({
        category: 'Admin Status',
        status: 'success',
        message: `User admin status: ${isAdmin ? 'Yes' : 'No'}`,
        details: { isAdmin }
      });

      setDiagnostics(results);
    } catch (error) {
      results.push({
        category: 'Diagnostics',
        status: 'error',
        message: `Error running diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
      setDiagnostics(results);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [profile, role, permissionsLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'loading': return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Permission Diagnostics</h1>
        <p className="text-muted-foreground">Detailed troubleshooting information for permission issues</p>
      </div>

      <Button onClick={runDiagnostics} disabled={scanning} className="mb-4">
        {scanning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          'Run Diagnostics Again'
        )}
      </Button>

      <div className="grid gap-4">
        {diagnostics.map((result, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <CardTitle className="text-lg">{result.category}</CardTitle>
                  <CardDescription>{result.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {result.details && (
              <CardContent>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {diagnostics.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>Diagnostics complete.</strong> Check the details above to understand permission issues.
            {diagnostics.some(d => d.status === 'error') && (
              <>
                <br />
                <span className="text-red-600">
                  ⚠️ Found {diagnostics.filter(d => d.status === 'error').length} error(s) that need attention
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
