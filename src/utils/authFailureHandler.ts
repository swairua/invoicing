/**
 * Authentication Failure Handler
 * Handles 401 errors and provides user-friendly recovery mechanisms
 */

import { clearAuthTokens } from './authHelpers';
import { toast } from 'sonner';

export interface AuthFailureContext {
  action?: string;
  table?: string;
  originalError?: Error;
  status?: number;
}

/**
 * Handle authentication failure with user-friendly notifications
 */
export function handleAuthFailure(context?: AuthFailureContext) {
  try {
    // Clear tokens
    clearAuthTokens();

    // Show user-friendly error message
    const message = context?.action 
      ? `Authentication failed while ${context.action}. Please log in again.`
      : 'Your session has expired. Please log in again.';

    console.warn(`🔐 Auth failure handled:`, {
      message,
      action: context?.action,
      table: context?.table,
      status: context?.status,
    });

    // Show toast notification
    toast.error(message);

    // Schedule redirect to login
    // Use setTimeout to allow current operation to complete and state to update
    const redirectTimer = setTimeout(() => {
      // Redirect to login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login?reason=session_expired';
      }
    }, 1500);

    // Return cleanup function
    return () => clearTimeout(redirectTimer);

  } catch (error) {
    console.error('Error handling auth failure:', error);
    // Still try to redirect even if notification fails
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  }
}

/**
 * Check if an error is an authentication error (401)
 */
export function isAuthError(error: Error | null): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  return (
    message.includes('401') ||
    message.includes('UNAUTHORIZED') ||
    message.includes('invalid token') ||
    message.includes('Token') ||
    message.includes('authentication')
  );
}

/**
 * Get user-friendly error message for auth failures
 */
export function getAuthErrorMessage(error: Error | null): string {
  if (!error) return 'Authentication failed. Please log in again.';

  const message = error.message || '';

  if (message.includes('expired')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('invalid token')) {
    return 'Your authentication token is invalid. Please log in again.';
  }
  if (message.includes('refresh')) {
    return 'Unable to refresh your session. Please log in again.';
  }
  if (message.includes('401')) {
    return 'You are not authorized. Please log in again.';
  }

  return 'Authentication failed. Please log in again.';
}
