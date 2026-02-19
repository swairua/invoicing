import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/integrations/api';
import { toast } from 'sonner';
import { initializeAuth, clearAuthTokens } from '@/utils/authHelpers';
import { logError, getUserFriendlyErrorMessage, isErrorType } from '@/utils/errorLogger';
import { RoleDefinition, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';
import { normalizePermissions } from '@/utils/permissionChecker';

// Type definitions for authentication
export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  company_id?: string;
  department?: string;
  position?: string;
  role?: string;
  status?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  roleDefinition?: RoleDefinition; // Full role definition with permissions
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading until auth is confirmed
  const [initialized, setInitialized] = useState(false);

  // Use refs to prevent stale closures and unnecessary re-renders
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const forceCompletedRef = useRef(false);

  // Grace period tracking - prevent token validation immediately after login
  const justLoggedInRef = useRef<number | null>(null);
  const GRACE_PERIOD_AFTER_LOGIN = 30000; // 30 seconds grace period

  // Toast spam prevention
  const lastNetworkErrorToast = useRef<number>(0);
  const lastPermissionErrorToast = useRef<number>(0);
  const lastGeneralErrorToast = useRef<number>(0);
  const TOAST_COOLDOWN = 10000; // 10 seconds between similar error toasts

  // Fetch user profile from database with error handling and retry logic
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📋 Fetching profile for user:', userId);

      const { data: profileData, error } = await apiClient.selectOne('profiles', userId);

      if (error) {
        console.warn('⚠️ Profile fetch error:', error.message);
        // Silently return null instead of crashing - profile might not exist
        return null;
      }

      if (!profileData) {
        console.warn('⚠️ No profile data found for user:', userId);
        // Return a basic user profile when full profile doesn't exist
        return {
          id: userId,
          email: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active' // Default to active
        };
      }

      // Fetch the user's role definition with permissions
      if (profileData.role && profileData.company_id) {
        try {
          console.log('📋 Fetching role definition for:', profileData.role);
          const { data: roleData } = await apiClient.selectBy('roles', {
            name: profileData.role,
            company_id: profileData.company_id,
          });

          if (roleData && Array.isArray(roleData) && roleData.length > 0) {
            const role = roleData[0] as RoleDefinition;
            // Normalize permissions to ensure they're always an array
            const normalizedRole = {
              ...role,
              permissions: normalizePermissions(role.permissions)
            };
            console.log('✅ Role definition fetched:', normalizedRole.name, 'with', normalizedRole.permissions?.length || 0, 'permissions');
            profileData.roleDefinition = normalizedRole;
          } else {
            // Fallback to default role permissions if custom role not found
            console.log('⚠️ Custom role not found, using default permissions for:', profileData.role);
            const roleType = profileData.role.toLowerCase() as keyof typeof DEFAULT_ROLE_PERMISSIONS;
            if (roleType && DEFAULT_ROLE_PERMISSIONS[roleType]) {
              profileData.roleDefinition = {
                id: `default-${profileData.role}`,
                name: profileData.role,
                role_type: roleType as any,
                description: `Default ${profileData.role} role`,
                permissions: normalizePermissions(DEFAULT_ROLE_PERMISSIONS[roleType]),
                company_id: profileData.company_id,
                is_default: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            }
          }
        } catch (roleError) {
          console.warn('⚠️ Error fetching role definition:', roleError);
          // Continue without role definition - permissions hook will use default fallback
        }
      }

      console.log('✅ Profile fetched successfully:', profileData);
      return profileData;
    } catch (error) {
      console.warn('⚠️ Exception fetching profile:', error);
      logError('Exception fetching profile:', error, { userId, context: 'fetchProfile' });

      // Return a minimal valid profile instead of null
      // This allows the app to function even if full profile data isn't available
      return {
        id: userId,
        email: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      };
    }
  }, []);

  // Update last login timestamp silently
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      await apiClient.update('profiles', userId, {
        last_login: new Date().toISOString()
      });
    } catch (error) {
      logError('Error updating last login:', error, { userId, context: 'updateLastLogin' });
    }
  }, []);

  // Initialize auth state - simplified to prevent repeated re-renders
  // Uses empty dependency array to run only once on mount
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    mountedRef.current = true;

    // Wait for auth to restore before showing app
    setLoading(true);
    setInitialized(true);
    console.log('🏁 Waiting for auth restoration before showing app...');

    // Try to restore auth session in background
    const restoreAuthInBackground = async () => {
      try {
        console.log('🔍 Attempting to restore auth session...');

        const sessionResult = await apiClient.auth.getSession();
        const quickSession = sessionResult?.session;

        if (quickSession?.user && mountedRef.current) {
          console.log('✅ Auth session restored from localStorage');

          // Session found, restore it
          // Token validation will happen on first API call or during periodic checks
          setSession(quickSession);
          setUser(quickSession.user);

          // Fetch profile silently in background
          try {
            const userProfile = await fetchProfile(quickSession.user.id);
            if (mountedRef.current) {
              setProfile(userProfile);

              // Update last login silently
              if (userProfile) {
                updateLastLogin(quickSession.user.id).catch(err =>
                  logError('Error updating last login:', err, {
                    userId: quickSession.user.id,
                    context: 'backgroundAuth'
                  })
                );
              }
            }
          } catch (profileError) {
            logError('Error fetching profile in background:', profileError, {
              context: 'backgroundProfileFetch'
            });
          }
        } else {
          // No valid session found - user is not authenticated
          console.log('ℹ️ No valid session found, user is unauthenticated');
        }

        // Auth restoration complete - stop showing loading screen
        if (mountedRef.current) {
          setLoading(false);
          console.log('✅ Auth restoration complete, app ready to show');
        }
      } catch (error) {
        console.warn('⚠️ Auth restoration failed:', error);

        // Clear invalid tokens if needed
        if (error instanceof Error) {
          if (error.message.includes('Invalid Refresh Token') ||
              error.message.includes('invalid_token')) {
            console.warn('🧹 Clearing invalid tokens');
            clearAuthTokens();
          }
        }

        // Auth restoration failed - stop showing loading screen
        if (mountedRef.current) {
          setLoading(false);
          console.log('⚠️ Auth restoration failed, showing app without auth');
        }
      }
    };

    // Run background auth restoration after a short delay to let UI render
    const backgroundTimer = setTimeout(restoreAuthInBackground, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(backgroundTimer);
    };
  }, []); // Empty dependency array - run only once on mount

  // Watch for localStorage changes to detect token clearing (e.g., from API adapter on 401)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'med_api_token' && event.newValue === null) {
        // Token was cleared from localStorage
        if (mountedRef.current && user) {
          console.warn('⚠️ Token was cleared from storage');
          toast.error('Your authentication token is invalid. Please log in again.');
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Periodic token validation - check every 5 minutes if token is still valid
  // This catches tokens that become invalid while the app is running (e.g., admin revokes)
  useEffect(() => {
    if (!user) return; // Only validate if user is authenticated

    const validateTokenPeriodically = async () => {
      if (!mountedRef.current) return;

      // Check if we're still within grace period after login
      if (justLoggedInRef.current !== null) {
        const timeSinceLogin = Date.now() - justLoggedInRef.current;
        if (timeSinceLogin < GRACE_PERIOD_AFTER_LOGIN) {
          console.log(`⏳ Within grace period after login (${Math.round(timeSinceLogin / 1000)}s < ${GRACE_PERIOD_AFTER_LOGIN / 1000}s), skipping token validation`);
          return;
        } else {
          // Grace period has expired - clear the flag
          justLoggedInRef.current = null;
          console.log('✅ Grace period after login has ended, resuming normal token validation');
        }
      }

      const token = localStorage.getItem('med_api_token');
      if (!token) {
        // Token was cleared - logout
        if (user) {
          console.warn('⚠️ Token was cleared externally, logging out');
          toast.error('Your session has expired. Please log in again.');
          setUser(null);
          setProfile(null);
          setSession(null);
        }
        return;
      }

      try {
        // Silently check if token is still valid
        const { user: validatedUser, error } = await apiClient.auth.checkAuth();

        if (error || !validatedUser) {
          // Only clear token on actual auth errors, not network errors
          if (error && error.message && (
            error.message.includes('401') ||
            error.message.includes('Unauthorized') ||
            error.message.includes('Not authenticated')
          )) {
            // Token is no longer valid - actual auth failure
            console.warn('⚠️ Token validation failed during periodic check:', error?.message);
            clearAuthTokens();

            if (mountedRef.current && user) {
              setUser(null);
              setProfile(null);
              setSession(null);
              toast.error('Your authentication session is no longer valid. Please log in again.');
              console.log('🔐 User logged out due to invalid token');
            }
          } else if (error) {
            // Network or other error - don't logout
            console.warn('⚠️ Periodic token validation error (network issue):', error?.message);
          }
        }
      } catch (error) {
        console.warn('⚠️ Periodic token validation error:', error);
        // Don't logout on network errors - user might just be offline
      }
    };

    // Run validation every 5 minutes
    const validationInterval = setInterval(validateTokenPeriodically, 5 * 60 * 1000);

    // Also do initial check after short delay, but it will respect the grace period
    const initialCheckTimeout = setTimeout(validateTokenPeriodically, 2000);

    return () => {
      clearInterval(validationInterval);
      clearTimeout(initialCheckTimeout);
    };
  }, [user]); // Re-run when user changes

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Starting sign in process...');

      const result = await apiClient.auth.login(email, password);

      if (result.error) {
        console.error('❌ Login failed:', result.error.message);
        setLoading(false);
        return { error: result.error as AuthError };
      }

      if (!result.token || !result.user) {
        const errorMsg = 'Login failed - no token received';
        console.error('❌', errorMsg);
        setLoading(false);
        return { error: new AuthError(errorMsg) };
      }

      console.log('✅ Login successful, creating session...');

      // Create session object
      const newSession: Session = {
        user: {
          id: result.user.id,
          email: result.user.email || email,
          user_metadata: result.user.user_metadata,
          app_metadata: result.user.app_metadata,
        },
        access_token: result.token,
      };

      // Fetch profile to check status
      console.log('📋 Fetching user profile...');
      const userProfile = await fetchProfile(result.user.id);

      // Allow login even if profile fetch fails - better UX
      console.log('✅ Profile fetch completed, setting session...');

      setSession(newSession);
      setUser(newSession.user);
      setProfile(userProfile);

      // Set grace period to prevent immediate token validation
      justLoggedInRef.current = Date.now();
      console.log('⏰ Grace period started after login - token validation will be skipped for 30 seconds');

      setTimeout(() => toast.success('Signed in successfully'), 0);
      setLoading(false);
      console.log('🎉 Sign in complete!');
      return { error: null };
    } catch (error) {
      setLoading(false);
      const errorMsg = error instanceof Error ? error.message : 'Sign in failed';
      console.error('❌ Sign in exception:', errorMsg);
      const authError = new AuthError(errorMsg);
      return { error: authError };
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);

      // Create user via API
      const result = await apiClient.insert('profiles', {
        email,
        password,
        full_name: fullName,
        status: 'pending'
      });

      if (result.error) {
        setLoading(false);
        return { error: result.error as AuthError };
      }

      setTimeout(() => toast.success('Account created successfully'), 0);
      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      const authError = new AuthError(error instanceof Error ? error.message : 'Sign up failed');
      return { error: authError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Starting sign out process...');
      setLoading(true);

      const result = await apiClient.auth.logout();

      if (result.error) {
        logError('❌ Sign out error:', result.error, { context: 'signOut' });
        setTimeout(() => toast.error('Error signing out'), 0);
      } else {
        console.log('✅ Sign out successful');

        // Clear state immediately
        setUser(null);
        setProfile(null);
        setSession(null);

        // Clear local storage
        clearAuthTokens();

        setTimeout(() => toast.success('Signed out successfully'), 0);
        console.log('🎉 Sign out complete!');

        // Force a reload to ensure the app clears any cached auth state/UI
        try {
          // Use replace so browser history isn't cluttered
          window.location.replace('/login');
          return;
        } catch (reloadErr) {
          console.warn('Could not reload after sign out:', reloadErr);
        }
      }
    } catch (error) {
      logError('❌ Sign out exception:', error, { context: 'signOut' });
      setTimeout(() => toast.error('Error signing out'), 0);
    } finally {
      // Ensure loading is cleared if the component is still mounted
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Call API to reset password
      const result = await apiClient.select('profiles', { email });

      if (result.error || !result.data) {
        return { error: new AuthError('User not found') };
      }

      // In a real app, the backend would send a password reset email
      setTimeout(() => toast.success('Password reset instructions have been sent to your email'), 0);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const result = await apiClient.update('profiles', user.id, updates);

      if (result.error) {
        logError('Error updating profile:', result.error, { context: 'updateProfile', userId: user.id });
        setTimeout(() => toast.error('Failed to update profile'), 0);
        return { error: new Error(result.error.message) };
      }

      // Refresh profile data
      await refreshProfile();
      setTimeout(() => toast.success('Profile updated successfully'), 0);
      return { error: null };
    } catch (error) {
      logError('Error updating profile exception:', error, { context: 'updateProfile', userId: user.id });
      setTimeout(() => toast.error('Failed to update profile'), 0);
      return { error: error as Error };
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    if (userProfile && mountedRef.current) {
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  // Add function to manually clear tokens
  const clearTokens = useCallback(() => {
    clearAuthTokens();
    setUser(null);
    setProfile(null);
    setSession(null);
    toast.info('Authentication tokens cleared. Please sign in again.');
  }, []);

  // Compute derived state
  // Check if user is actually authenticated (has valid user or session)
  const isAuthenticated = !!(user || session);
  // Treat any role containing 'admin' (case-insensitive) as administrator (covers 'admin', 'super_admin', etc.)
  const isAdmin = isAuthenticated && typeof profile?.role === 'string' && profile.role.toLowerCase().includes('admin');

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated,
    isAdmin,
    refreshProfile,
    clearTokens,
    initialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
