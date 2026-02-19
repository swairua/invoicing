import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Permission } from '@/types/permissions';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, user must have ANY (default: false)
}

export function ProtectedRoute({
  children,
  fallback,
  requireAuth = false,
  requiredRole,
  requiredPermissions = [],
  requireAllPermissions = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, profile, isAdmin } = useAuth();
  const { can, canAll, canAny, loading: permissionsLoading } = usePermissions();

  // Show loading state while auth or permissions are being confirmed
  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication - if requireAuth is true and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access control - if requiredRole is specified, user must have that role
  if (requiredRole && (!profile?.role || !profile.role.toLowerCase().includes(requiredRole.toLowerCase()))) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You do not have the required role ({requiredRole}) to access this page.
            </p>
            <Button onClick={() => window.location.href = '/app'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permission-based access control
  if (requiredPermissions && requiredPermissions.length > 0) {
    console.log('🔐 [ProtectedRoute] Checking permissions:', {
      requiredPermissions,
      requireAllPermissions,
      userRole: profile?.role,
      permissionsLoading,
    });

    const hasPermission = requireAllPermissions
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);

    console.log('🔐 [ProtectedRoute] Permission check result:', {
      requiredPermissions,
      hasPermission,
      userRole: profile?.role,
    });

    if (!hasPermission) {
      // Show error toast
      console.error('❌ [ProtectedRoute] Access denied:', {
        requiredPermissions,
        userRole: profile?.role,
        message: `You do not have permission to access this page. Required: ${requiredPermissions.join(', ')}`
      });
      toast.error(`You do not have permission to access this page. Required: ${requiredPermissions.join(', ')}`);

      return fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Permission Denied</h3>
              <p className="text-muted-foreground mb-4">
                You do not have the required permissions to access this page.
              </p>
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded">
                Required: {requiredPermissions.join(', ')}
              </div>
              <Button onClick={() => window.location.href = '/app'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  protection: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protection}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
