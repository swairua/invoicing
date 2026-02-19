import { apiClient } from '@/integrations/api';
import { getAPIBaseURL } from '@/utils/environment-detection';

interface HealthCheckResult {
  isHealthy: boolean;
  issues: string[];
  canCreateUsers: boolean;
  rateLimited: boolean;
}

/**
 * Check external API health and configuration
 */
export const checkSupabaseHealth = async (): Promise<HealthCheckResult> => {
  const issues: string[] = [];
  let isHealthy = true;
  let canCreateUsers = false;
  let rateLimited = false;

  try {
    // Test basic connection to API
    const apiUrl = getAPIBaseURL();

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' }),
      });

      if (!response.ok) {
        issues.push(`API connection failed: HTTP ${response.status}`);
        isHealthy = false;
      } else {
        const data = await response.json();
        if (data.status !== 'success') {
          issues.push(`API health check failed: ${data.message || 'Unknown error'}`);
          isHealthy = false;
        }
      }
    } catch (error) {
      issues.push(`API connection error: ${error}`);
      isHealthy = false;
    }

    // Test auth service
    try {
      const { error: authError } = await apiClient.auth.checkAuth();

      if (authError) {
        // Not authenticated is okay for health check
        canCreateUsers = true;
      } else {
        canCreateUsers = true;
      }
    } catch (authError) {
      issues.push(`Auth service error: ${authError}`);
      isHealthy = false;
    }

  } catch (error) {
    issues.push(`General connection error: ${error}`);
    isHealthy = false;
  }

  return {
    isHealthy,
    issues,
    canCreateUsers,
    rateLimited
  };
};

/**
 * Wait for rate limiting to clear
 */
export const waitForRateLimit = async (maxWaitTime: number = 30000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const health = await checkSupabaseHealth();

    if (!health.rateLimited) {
      return true;
    }

    console.log('Still rate limited, waiting...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  }

  return false; // Timeout reached
};

/**
 * Smart retry with rate limit handling
 */
export const retryWithRateLimit = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 5000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('seconds');
      const isLastAttempt = attempt === maxRetries;

      if (isRateLimit && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error; // Re-throw if not rate limit or last attempt
    }
  }

  throw new Error('Max retries exceeded');
};
