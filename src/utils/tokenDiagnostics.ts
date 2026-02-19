/**
 * Token Diagnostics Utility
 * Helps diagnose authentication and token-related issues
 */

export interface TokenDiagnostics {
  timestamp: string;
  tokenPresent: boolean;
  tokenFormat: 'valid_jwt' | 'invalid_format' | 'missing';
  tokenLength: number;
  tokenPreview: string;
  tokenExpiration: {
    hasExp: boolean;
    isExpired: boolean;
    expiresAt?: string;
    timeRemaining?: string;
  };
  userIdPresent: boolean;
  userEmailPresent: boolean;
  storageAccessible: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Decode JWT payload without verification (for diagnostics only)
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired by examining exp claim
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false; // No expiration set

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() > expirationTime;
}

/**
 * Get token expiration time from exp claim
 */
function getTokenExpiration(token: string): {
  expiresAt: Date | null;
  timeRemaining: number | null;
} {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return { expiresAt: null, timeRemaining: null };

  const expiresAt = new Date(payload.exp * 1000);
  const timeRemaining = expiresAt.getTime() - Date.now();

  return {
    expiresAt,
    timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
  };
}

/**
 * Run comprehensive token diagnostics
 */
export function runTokenDiagnostics(): TokenDiagnostics {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check token presence and format
    const token = localStorage.getItem('med_api_token');
    let tokenFormat: 'valid_jwt' | 'invalid_format' | 'missing' = 'missing';
    let tokenExpiration: TokenDiagnostics['tokenExpiration'] = {
      hasExp: false,
      isExpired: false,
    };

    if (!token) {
      issues.push('No authentication token found in localStorage');
      recommendations.push('Please log in to obtain a valid token');
    } else {
      const parts = token.split('.');
      if (parts.length === 3) {
        tokenFormat = 'valid_jwt';

        // Check expiration
        try {
          const isExpired = isTokenExpired(token);
          const expInfo = getTokenExpiration(token);

          tokenExpiration = {
            hasExp: !!expInfo.expiresAt,
            isExpired,
            expiresAt: expInfo.expiresAt?.toISOString(),
            timeRemaining: expInfo.timeRemaining
              ? formatTimeRemaining(expInfo.timeRemaining)
              : undefined,
          };

          if (isExpired) {
            issues.push('Token has expired');
            recommendations.push('Please log in again to refresh your token');
          } else if (expInfo.timeRemaining && expInfo.timeRemaining < 5 * 60 * 1000) {
            issues.push('Token will expire soon (less than 5 minutes)');
            recommendations.push('Consider logging out and logging back in to refresh your session');
          }
        } catch (error) {
          console.warn('Error checking token expiration:', error);
        }
      } else {
        tokenFormat = 'invalid_format';
        issues.push(`Token format is invalid (has ${parts.length} parts, expected 3)`);
        recommendations.push('Token may be corrupted. Please clear cache and log in again');
      }
    }

    // Check localStorage access
    let storageAccessible = true;
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      storageAccessible = false;
      issues.push('Cannot access localStorage');
      recommendations.push('Check browser privacy settings and clear storage if needed');
    }

    // Check user info
    const userId = localStorage.getItem('med_api_user_id');
    const userEmail = localStorage.getItem('med_api_user_email');

    if (!userId) {
      issues.push('No user ID stored');
      recommendations.push('User information may be missing. Try logging in again');
    }

    if (!userEmail) {
      issues.push('No user email stored');
    }

    // Overall summary
    if (issues.length === 0 && tokenFormat === 'valid_jwt') {
      recommendations.push('✓ Token appears to be in good condition');
    }

    return {
      timestamp: new Date().toISOString(),
      tokenPresent: !!token,
      tokenFormat,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 40) + '...' : '(none)',
      tokenExpiration,
      userIdPresent: !!userId,
      userEmailPresent: !!userEmail,
      storageAccessible,
      issues,
      recommendations,
    };
  } catch (error) {
    console.error('Error running token diagnostics:', error);
    return {
      timestamp: new Date().toISOString(),
      tokenPresent: false,
      tokenFormat: 'missing',
      tokenLength: 0,
      tokenPreview: '(error)',
      tokenExpiration: { hasExp: false, isExpired: false },
      userIdPresent: false,
      userEmailPresent: false,
      storageAccessible: false,
      issues: [`Error running diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Check browser console for errors and try refreshing the page'],
    };
  }
}

/**
 * Format time remaining in human-readable format
 */
function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Log diagnostic info to console
 */
export function logTokenDiagnostics(): void {
  const diagnostics = runTokenDiagnostics();

  console.group('🔍 Token Diagnostics Report');
  console.log('Timestamp:', diagnostics.timestamp);
  console.log('Token Status:', diagnostics.tokenFormat);
  console.log('Token Length:', diagnostics.tokenLength);

  if (diagnostics.tokenPresent) {
    console.log('Token Preview:', diagnostics.tokenPreview);
    console.log('Expiration:', {
      hasExp: diagnostics.tokenExpiration.hasExp,
      isExpired: diagnostics.tokenExpiration.isExpired,
      expiresAt: diagnostics.tokenExpiration.expiresAt,
      timeRemaining: diagnostics.tokenExpiration.timeRemaining,
    });
  }

  console.log('Storage Accessible:', diagnostics.storageAccessible);
  console.log('User ID Present:', diagnostics.userIdPresent);
  console.log('User Email Present:', diagnostics.userEmailPresent);

  if (diagnostics.issues.length > 0) {
    console.warn('Issues Found:', diagnostics.issues);
  }

  console.log('Recommendations:', diagnostics.recommendations);
  console.groupEnd();
}

/**
 * Create a summary string for display
 */
export function getTokenDiagnosticsSummary(): string {
  const diagnostics = runTokenDiagnostics();

  let summary = 'Token Diagnostics:\n';
  summary += `Status: ${diagnostics.tokenFormat}\n`;

  if (diagnostics.issues.length > 0) {
    summary += `Issues: ${diagnostics.issues.join(', ')}\n`;
  }

  if (diagnostics.recommendations.length > 0) {
    summary += `Recommendations: ${diagnostics.recommendations.join(', ')}\n`;
  }

  return summary;
}
