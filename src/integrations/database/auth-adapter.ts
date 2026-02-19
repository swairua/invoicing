/**
 * Database-Agnostic Authentication Adapter
 * Provides unified authentication interface
 */

import type { IAuth, AuthContext } from './types';
import { getSharedExternalAdapter } from './shared-adapter';

/**
 * External API Authentication Implementation
 * Uses the med.wayrus.co.ke/api.php backend for all auth operations
 */
class SupabaseAuthAdapter implements IAuth {
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const adapter = getSharedExternalAdapter();
      const result = await (adapter as any).login(email, password);

      if (result.error) {
        return { user: null, error: result.error as Error };
      }

      // Store auth info in localStorage
      if (result.user?.id) {
        localStorage.setItem('med_api_user_id', result.user.id);
        localStorage.setItem('med_api_user_email', email);
        localStorage.setItem('med_api_token', result.token || '');
      }

      // Fetch profile information
      const profileResult = await adapter.selectOne('profiles', result.user?.id);

      if (profileResult.data) {
        return {
          user: {
            userId: profileResult.data.id,
            email: profileResult.data.email || email,
            role: profileResult.data.role,
            companyId: profileResult.data.company_id,
            status: profileResult.data.status,
          },
          error: null,
        };
      }

      return { user: null, error: new Error('Profile not found') };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const adapter = getSharedExternalAdapter();
      const result = await (adapter as any).signup(email, password, fullName);

      if (result.error) {
        return { user: null, error: result.error as Error };
      }

      // Store auth info in localStorage
      if (result.user?.id) {
        localStorage.setItem('med_api_user_id', result.user.id);
        localStorage.setItem('med_api_user_email', email);
        localStorage.setItem('med_api_token', result.token || '');
      }

      // Create profile
      const profileResult = await adapter.insert('profiles', {
        id: result.user?.id,
        email,
        full_name: fullName,
        status: 'pending',
      });

      if (profileResult.error) {
        return { user: null, error: profileResult.error as Error };
      }

      return {
        user: {
          userId: result.user?.id || '',
          email,
          role: 'user',
          companyId: null,
          status: 'pending',
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const adapter = getSharedExternalAdapter();
      const result = await (adapter as any).logout();

      // Clear localStorage
      localStorage.removeItem('med_api_token');
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      return { error: result.error || null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSession(): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      // Get user from localStorage (external API auth method)
      const userId = localStorage.getItem('med_api_user_id');
      const email = localStorage.getItem('med_api_user_email');
      const token = localStorage.getItem('med_api_token');

      if (!userId || !token) {
        return { user: null, error: null };
      }

      // Fetch profile
      const adapter = getSharedExternalAdapter();
      const profileResult = await adapter.selectOne('profiles', userId);

      if (profileResult.data) {
        return {
          user: {
            userId: profileResult.data.id,
            email: profileResult.data.email || email,
            role: profileResult.data.role,
            companyId: profileResult.data.company_id,
            status: profileResult.data.status,
          },
          error: null,
        };
      }

      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      // Password reset would be handled by the backend API
      // For now, return an error indicating this functionality
      return {
        error: new Error('Password reset not implemented'),
      };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      // Password update would be handled by the backend API
      return {
        error: new Error('Password update not implemented via client SDK'),
      };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async createUser(
    email: string,
    password: string,
    role: string,
    companyId: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      return {
        user: null,
        error: new Error('User creation should be done via server-side admin API'),
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: AuthContext | null) => void): () => void {
    // Check initial auth state
    this.getSession().then(({ user }) => callback(user));

    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'med_api_token' || e.key === 'med_api_user_id') {
        this.getSession().then(({ user }) => callback(user));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

/**
 * MySQL Authentication Implementation (client-side stub)
 * For MySQL, authentication would typically be handled server-side via API
 */
class MySQLAuthAdapter implements IAuth {
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      // This would call a backend API endpoint
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('Sign in failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('Sign up failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (!response.ok) {
        return { error: new Error('Sign out failed') };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSession(): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return { user: null, error: null };
      }
      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return { error: new Error('Password reset failed') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      if (!response.ok) {
        return { error: new Error('Password update failed') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async createUser(
    email: string,
    password: string,
    role: string,
    companyId: string
  ): Promise<{ user: AuthContext | null; error: Error | null }> {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, companyId }),
      });

      if (!response.ok) {
        return { user: null, error: new Error('User creation failed') };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (user: AuthContext | null) => void): () => void {
    // This would typically use server-sent events or polling
    // For now, just check session on mount
    this.getSession().then(({ user }) => callback(user));
    
    // Return unsubscribe function (no-op for now)
    return () => {};
  }
}

export { SupabaseAuthAdapter, MySQLAuthAdapter };
