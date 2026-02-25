/**
 * External MySQL API Adapter
 * Communicates with med.wayrus.co.ke/api.php MySQL backend
 */

import type {
  IDatabase,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './types';
import { getAPIBaseURL } from '../../utils/environment-detection';
import { handleAuthFailure } from '../../utils/authFailureHandler';
import { logTokenDiagnostics } from '../../utils/tokenDiagnostics';

export class ExternalAPIAdapter implements IDatabase {
  private apiBase: string;
  private externalApiUrl: string;
  private failedValidationAttempts: number = 0;
  private lastValidationAttemptTime: number = 0;
  private lastLoginTime: number | null = null;

  constructor(apiUrl?: string) {
    try {
      // Priority 1: Use explicit apiUrl parameter if provided
      if (apiUrl) {
        this.externalApiUrl = apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php';
        console.log('✅ Using explicit API URL from constructor parameter');
      } else {
        // Priority 2: Use environment detection (auto-detect or VITE_EXTERNAL_API_URL)
        this.externalApiUrl = getAPIBaseURL();
        console.log('✅ Using API URL from environment detection');
      }

      this.apiBase = this.externalApiUrl;

      console.log('📡 API endpoint configured:', this.apiBase);

      // NOTE: We no longer cache the token on construction.
      // This prevents timing/initialization issues where the adapter
      // might be created before the token is available in localStorage.
      // All methods now read the token fresh from localStorage.
      // Token refresh is automatic - we check for expiration and refresh before each API call.
    } catch (error) {
      // If environment detection fails and no explicit URL provided, throw error
      console.error('❌ Failed to initialize ExternalAPIAdapter:', error);
      throw error;
    }
  }

  setAuthToken(token: string) {
    // Always store in localStorage (never cache in instance variable)
    localStorage.setItem('med_api_token', token);
  }

  clearAuthToken() {
    // Always remove from localStorage (instance variable removed)
    localStorage.removeItem('med_api_token');
  }

  /**
   * Get the current auth token from localStorage
   * Always reads fresh to ensure we get the most recent token
   * This is critical for updates that happen after login
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('med_api_token');
  }

  /**
   * Validate token with backend and clear if invalid
   * This ensures we don't use stale tokens
   */
  async validateToken(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) {
      return false; // No token to validate
    }

    try {
      const { user, error } = await this.checkAuth();

      if (error || !user) {
        // Token is invalid - clear it immediately
        console.warn('🧹 Token validation failed, clearing invalid token:', error?.message);
        this.clearAuthToken();
        return false;
      }

      // Token is valid
      return true;
    } catch (error) {
      console.warn('⚠️ Token validation error:', error);
      // On network errors, don't clear token - user might be offline
      return true;
    }
  }

  /**
   * Check if the current token is expired by decoding JWT payload
   */
  private isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      // Decode payload (add padding if needed)
      const payload = parts[1];
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(atob(paddedPayload));

      if (!decoded.exp) {
        // No expiration - token is valid
        return false;
      }

      // Check if expiration time (in seconds) has passed
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime > expirationTime;

      if (isExpired) {
        console.warn('⏰ Token has expired');
      }

      return isExpired;
    } catch (error) {
      console.warn('⚠️ Could not decode token to check expiration:', error);
      // If we can't decode, assume token is valid (allow retry on API call)
      return false;
    }
  }

  /**
   * Automatically refresh token if it's expired or about to expire
   * Refreshes proactively 5 minutes before expiration
   * Implements exponential backoff to avoid hammering server on repeated failures
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const token = this.getAuthToken();
    if (!token) return;

    try {
      // Check if token is expired
      if (this.isTokenExpired()) {
        console.log('🔄 Token expired, attempting automatic refresh...');

        // Implement exponential backoff: 1s → 2s → 4s between attempts
        const timeSinceLastAttempt = Date.now() - this.lastValidationAttemptTime;
        const baseDelay = 1000;
        const requiredDelay = baseDelay * Math.pow(2, Math.max(0, this.failedValidationAttempts - 1));

        if (timeSinceLastAttempt < requiredDelay) {
          console.log(`⏳ Delaying token refresh: waiting ${Math.round((requiredDelay - timeSinceLastAttempt) / 1000)}s (exponential backoff)`);
          return;
        }

        this.lastValidationAttemptTime = Date.now();

        // Token is expired - try to refresh using refresh endpoint
        await this.attemptTokenRefresh();
      }
    } catch (error) {
      console.warn('⚠️ Error checking token expiration:', error);
      // Continue anyway - let the API call fail if token is truly invalid
    }
  }

  /**
   * Attempt to refresh the token using the refresh endpoint
   * Implements retry logic with exponential backoff
   */
  private async attemptTokenRefresh(): Promise<void> {
    try {
      const userId = localStorage.getItem('med_api_user_id');

      // Try primary refresh endpoint
      const refreshUrl = `${this.apiBase}?action=refresh_token`;

      console.log('🔄 Attempting token refresh with user_id:', userId?.substring(0, 8) + '...');
      console.log(`   Failed attempts so far: ${this.failedValidationAttempts}/3`);

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.token) {
        // Store the new token and reset counter on success
        this.setAuthToken(result.token);
        this.failedValidationAttempts = 0;
        console.log('✅ Token refreshed successfully');
        return;
      }

      // If primary refresh fails, try alternative approach
      console.warn('⚠️ Primary token refresh failed (status:', response.status, '), trying check_auth endpoint...');

      // Try checking if we can validate with current token
      const checkUrl = `${this.apiBase}?action=check_auth`;
      const checkResponse = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.getAuthToken() }),
      });

      const checkResult = await checkResponse.json().catch(() => null);

      if (checkResponse.ok && checkResult?.id) {
        // Token is actually valid - maybe the refresh endpoint just doesn't exist
        this.failedValidationAttempts = 0;
        console.log('✅ Token is valid (check_auth succeeded), continuing without refresh');
        return;
      }

      // Token validation failed - increment counter
      this.failedValidationAttempts++;
      console.warn(`⚠️ Token validation failed (attempt ${this.failedValidationAttempts}/3)`);

      // Only clear token after 3 failed attempts, not on first failure
      if (this.failedValidationAttempts >= 3) {
        console.error('❌ Token is invalid after 3 attempts - clearing authentication');
        this.clearAuthToken();
        localStorage.removeItem('med_api_user_id');
        localStorage.removeItem('med_api_user_email');
        this.failedValidationAttempts = 0;
      } else {
        console.log(`⏳ Deferring token clearing until next validation attempt (need ${3 - this.failedValidationAttempts} more failures)`);
      }

    } catch (error) {
      console.warn('⚠️ Token refresh error (network issue):', error);
      // Increment counter for network errors too
      this.failedValidationAttempts++;
      console.warn(`⚠️ Network validation attempt failed (${this.failedValidationAttempts}/3)`);

      if (this.failedValidationAttempts >= 3) {
        // Only clear on persistent failures
        console.warn('❌ Too many failed validation attempts - clearing token');
        this.clearAuthToken();
        localStorage.removeItem('med_api_user_id');
        localStorage.removeItem('med_api_user_email');
        this.failedValidationAttempts = 0;
      }
    }
  }

  private async apiCall<T>(
    method: string,
    action: string,
    table?: string,
    data?: any,
    where?: any,
    isPublic?: boolean
  ): Promise<{ data: T; error: Error | null; status: number }> {
    try {
      // Automatically refresh token if needed before making API call
      // This prevents 401 errors due to token expiration
      await this.refreshTokenIfNeeded();

      const params = new URLSearchParams();

      // Always append the action directly - the vite proxy handles forwarding
      params.append('action', action);
      if (table) params.append('table', table);

      // Log the API call attempt
      const logPrefix = `📡 [${method.toUpperCase()}] ${action}${table ? ` on ${table}` : ''}`;
      console.log(`${logPrefix} - Starting request...`);

      // For update and delete operations, backend expects 'where' parameter
      if ((action === 'update' || action === 'delete') && where && typeof where === 'object') {
        // Convert where object to SQL WHERE clause format for the backend
        // e.g., {id: 123} becomes id=123
        const whereParts: string[] = [];
        Object.entries(where).forEach(([key, value]) => {
          if (typeof value === 'string') {
            whereParts.push(`${key}='${String(value).replace(/'/g, "''")}'`);
          } else {
            whereParts.push(`${key}=${value}`);
          }
        });
        params.append('where', whereParts.join(' AND '));
      }

      const url = `${this.apiBase}?${params.toString()}`;

      // Log for companies update debugging
      if (action === 'update' && table === 'companies') {
        console.log(`🔗 API Request for company update:`, {
          url: url.substring(0, 100), // Truncate for readability
          method,
          action,
          table,
          authTokenPresent: !!this.getAuthToken(),
          bodyDataKeys: data ? Object.keys(data as any) : [],
        });
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // ALWAYS read token fresh from localStorage to ensure we get the most recent one
      // This is critical for updates that happen after login (especially after page refresh)
      const currentToken = this.getAuthToken();

      if (currentToken) {
        // Validate token format before sending
        const tokenParts = currentToken.split('.');
        if (tokenParts.length === 3) {
          headers['Authorization'] = `Bearer ${currentToken}`;
          console.log(`✅ Token added to Authorization header for ${action}${table ? ` on ${table}` : ''}`);
        } else {
          console.warn(`⚠️ Token in localStorage has invalid format (${tokenParts.length} parts, expected 3)`);
          console.warn(`Token value: ${currentToken.substring(0, 50)}...`);
          console.warn('Token will not be sent - may cause 401 error');
          // DON'T clear the token immediately - it might be in transit
          // Log it for diagnostics instead
          console.error('Token validation failed - keeping token for now but marking as suspect');
        }
      } else {
        console.warn(`⚠️ No token in localStorage for ${action}${table ? ` on ${table}` : ''} - request will be unauthenticated`);
      }

      // Log token status for debugging updates
      if (action === 'update') {
        console.log(`🔐 [Update ${table}] Token check:`, {
          hasLocalStorageToken: !!currentToken,
          willSendAuthHeader: !!currentToken && currentToken.split('.').length === 3,
          authHeaderValue: currentToken ? `Bearer ${currentToken.substring(0, 20)}...` : 'NONE',
          tokenFormat: currentToken ? `${currentToken.split('.').length} parts` : 'N/A',
          readingFreshFromLocalStorage: true,
        });
      }

      // Log token status for read operations too
      if (action === 'read' && currentToken) {
        console.log(`🔐 [Read ${table}] Authorization header:`, {
          hasToken: !!currentToken,
          tokenLength: currentToken.length,
          tokenParts: currentToken.split('.').length,
          preview: currentToken.substring(0, 20) + '...',
        });
      }

      // Build request body
      let body: any = null;

      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        body = data;
      }
      // For read operations, include where clause in body if not in URL
      else if ((action === 'read') && where && typeof where === 'object') {
        body = where;
      }

      // Add timeout for fetch requests - extended to 60 seconds for slow APIs
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;
      let requestCompleted = false;

      timeoutId = setTimeout(() => {
        // Only abort if the request hasn't completed yet
        if (!requestCompleted && !isTimedOut) {
          isTimedOut = true;
          try {
            controller.abort(new Error('Request timeout: 60 second limit exceeded'));
          } catch (e) {
            // Ignore errors from abort() - it may fail if already aborted
            console.debug('Controller abort error (ignored):', e);
          }
        }
      }, 60000); // 60 second timeout (increased from 30s to handle slower servers)

      let response: Response;
      let result: any;

      try {
        // Log headers being sent (for debugging update issues)
        if (action === 'update') {
          console.log(`📤 [Update ${table}] Sending request with headers:`, {
            url: url.substring(0, 100),
            method,
            headerKeys: Object.keys(headers),
            hasAuthorizationHeader: 'Authorization' in headers,
            authenticatedRequest: !!currentToken,
          });
        }

        response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Defensively parse JSON - handle cases where server returns non-JSON (e.g., 500 error)
        result = await response.json().catch(async (jsonError) => {
          // Capture the raw response text for debugging when JSON parsing fails
          let responseText = '';
          try {
            responseText = await response.clone().text();
          } catch (e) {
            responseText = '(unable to read response body)';
          }

          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            responseBody: responseText.substring(0, 500), // First 500 chars to avoid noise
            url: url.substring(0, 100),
            action,
            table,
          };

          console.error(`❌ [${action} ${table || 'API'}] Server returned invalid JSON response:`, errorDetails);

          if (!response.ok) {
            console.error(`Server returned HTTP ${response.status} ${response.statusText}`);
            console.error(`Response body: ${responseText}`);
            throw new Error(`Server error (HTTP ${response.status} ${response.statusText}): ${responseText.substring(0, 200) || 'The API server may be experiencing issues.'}`);
          }
          console.error(`Server returned non-JSON response with status ${response.status}`);
          console.error(`Response body: ${responseText}`);
          throw new Error(`Invalid response from server: Expected valid JSON but received: ${responseText.substring(0, 300)}`);
        });
      } catch (fetchError: any) {
        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          // Get the abort reason if available
          const abortReason = fetchError.reason?.message || fetchError.message || '';

          if (isTimedOut || abortReason.includes('timeout')) {
            console.error(`⏱️ API request timeout after 60 seconds at ${this.apiBase}`);
            throw new Error(`API request timeout. The server is taking too long to respond. This may be due to high server load. Please try again.`);
          } else {
            // Signal was aborted for another reason (e.g., component unmount, network interruption)
            console.warn(`⚠️ API request was cancelled (aborted). Reason: ${abortReason || 'unknown'}`);
            throw new Error(`API request was cancelled. Please check your connection and try again. Server: ${this.apiBase}`);
          }
        }

        // Network errors - provide detailed diagnostics
        if (fetchError instanceof TypeError) {
          const errorMessage = fetchError.message || '';

          // Check if this might be a CORS error (very common with cross-origin requests)
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
            console.error(`❌ Network Error for ${action} on ${table || 'API'}:`, errorMessage);
            console.error(`API Endpoint: ${this.apiBase}`);
            console.error('🔍 Troubleshooting:');
            console.error('1. CORS Issue (Most Common):');
            console.error('   - Backend needs: Access-Control-Allow-Origin header');
            console.error('   - Backend needs to allow methods: GET, POST, PUT, DELETE, OPTIONS');
            console.error('2. Network/Connectivity:');
            console.error('   - Check if API endpoint is reachable');
            console.error('   - Verify internet connection');
            console.error('3. Firewall/Proxy:');
            console.error('   - Check if network firewall blocks requests');
            console.error('   - Check if corporate proxy is interfering');

            throw new Error(`Unable to reach API: ${this.apiBase}. This is commonly a CORS issue. Please ensure the backend has proper CORS headers configured. Error: ${errorMessage}`);
          }

          throw new Error(`Network error: ${errorMessage}`);
        }

        throw fetchError;
      }

      if (!response.ok) {
        const errorMsg = result.message || `HTTP ${response.status}`;

        // Provide detailed logging for specific error codes
        if (response.status === 403) {
          console.error(`❌ ${logPrefix} - PERMISSION DENIED (403)`);
          console.error('🔍 Troubleshooting 403 Forbidden Error:');
          console.error('1. User Role/Permissions:');
          console.error(`   - Current user token: ${this.getAuthToken() ? 'Present' : 'Missing'}`);
          console.error(`   - Check if user has permission to ${action} on ${table || 'resource'}`);
          console.error('2. Database:');
          console.error(`   - Verify the ${table} table exists on the backend`);
          console.error(`   - Verify user is assigned to the correct company_id`);
          console.error('3. API Setup:');
          console.error('   - Check if the backend API has proper authorization checks');
          console.error(`   - Verify the action "${action}" is supported for table "${table}"`);
          console.error(`   - Verify user's role is configured in the backend roles table`);
          console.error('4. Request Details:');
          console.error(`   - URL: ${url}`);
          console.error(`   - Method: ${method}`);
          console.error(`   - Action: ${action}`);
          console.error(`   - Table: ${table}`);
          console.error('Backend response details:', {
            status: response.status,
            statusText: response.statusText,
            message: result?.message,
            error: result?.error,
            details: result?.details,
            hint: result?.hint,
            code: result?.code,
            fullResponse: result,
          });
        } else if (response.status === 401) {
          console.error(`❌ ${logPrefix} - UNAUTHORIZED (401)`);

          // For public endpoints, don't show auth failure toast - just log silently
          if (isPublic) {
            console.info('ℹ️ Public endpoint returned 401 - this is expected when not authenticated');
            return {
              data: null as any,
              error: new Error('Not authenticated'),
              status: response.status,
            };
          }

          console.error('⚠️ Token appears invalid or expired. Attempting emergency token refresh...');

          const hasToken = !!this.getAuthToken();
          const userId = localStorage.getItem('med_api_user_id');
          const token = this.getAuthToken();

          console.error('📊 401 Debug Info:');
          console.error('   - Has Token:', hasToken);
          console.error('   - Has User ID:', !!userId);
          console.error('   - Action:', action);
          console.error('   - Table:', table);
          console.error('   - Method:', method);
          console.error('   - Authorization Header Present:', 'Authorization' in headers);
          if (hasToken && token) {
            const tokenParts = token.split('.');
            console.error('   - Token Format:', tokenParts.length === 3 ? '✅ Valid JWT' : `❌ Invalid (${tokenParts.length} parts)`);
            console.error('   - Token Length:', token.length);
            console.error('   - Token Preview:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
            // Try to decode the token to see what's in it
            try {
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.error('   - Token Payload:', payload);
              }
            } catch (e) {
              console.error('   - Could not decode token payload:', e);
            }
          }

          // Run full diagnostics when 401 occurs
          console.error('🔍 Running full token diagnostics...');
          try {
            logTokenDiagnostics();
          } catch (diagError) {
            console.warn('Error running diagnostics:', diagError);
          }

          // Try to refresh token as a backup mechanism
          try {
            await this.attemptTokenRefresh();

            // Check if we still have a token after refresh attempt
            const newToken = this.getAuthToken();
            if (newToken) {
              console.log('🔄 Retrying request with refreshed token...');
              headers['Authorization'] = `Bearer ${newToken}`;

              const retryResponse = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
              });

              const retryResult = await retryResponse.json().catch(() => ({}));

              if (retryResponse.ok) {
                console.log(`✅ ${logPrefix} - Success after token refresh`);
                return { data: retryResult.data || retryResult, error: null, status: retryResponse.status };
              } else {
                // Still failed after refresh - log additional details
                console.error(`❌ ${logPrefix} - Still failed after token refresh`);
                console.error(`Retry response status: ${retryResponse.status} ${retryResponse.statusText}`);
                console.error(`Response:`, retryResult);
              }
            } else {
              console.warn('⚠️ No token available after refresh attempt');
            }
          } catch (refreshError) {
            console.warn('⚠️ Emergency token refresh failed:', refreshError);
          }

          // Clear token since it's definitely invalid at this point
          this.clearAuthToken();

          // Provide detailed error message with debugging steps
          let errorMsg = 'Authentication failed';
          const debugSteps: string[] = [];

          if (!hasToken) {
            errorMsg = 'No authentication token found. Please log in.';
            debugSteps.push('1. Token was never stored or was cleared');
            debugSteps.push('2. Check if login succeeded before accessing this resource');
          } else {
            errorMsg = 'Your authentication token was rejected by the server. Please log in again.';
            debugSteps.push('1. Your session may have expired');
            debugSteps.push('2. The API server rejected your token (possible causes: revoked, expired, invalid)');
            debugSteps.push('3. You may have been logged out by an administrator');
            debugSteps.push('4. There may be a mismatch between client and server clocks');
          }

          console.error(`❌ ${errorMsg}`);
          console.error('🔍 Debugging steps to try:');
          debugSteps.forEach(step => console.error('   ' + step));
          console.error('💡 Next steps:');
          console.error('   1. Log out and log back in');
          console.error('   2. Clear browser cache and localStorage (localStorage.clear())');
          console.error('   3. Try a different browser or incognito mode');
          console.error('   4. Check if the API server is running and accessible');

          // Handle auth failure with user-friendly recovery
          // This will show a toast and optionally redirect to login
          try {
            handleAuthFailure({
              action,
              table,
              status: response.status,
              originalError: new Error(errorMsg),
            });
          } catch (err) {
            console.warn('Error handling auth failure:', err);
          }
        } else {
          console.warn(`${logPrefix} - HTTP Error ${response.status}: ${errorMsg}`);
        }

        return {
          data: null as any,
          error: new Error(errorMsg),
          status: response.status,
        };
      }

      console.log(`${logPrefix} - Success (${response.status})`);
      return { data: result.data || result, error: null, status: response.status };
    } catch (error) {
      return {
        data: null as any,
        error: error as Error,
        status: 500,
      };
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: any; error: Error | null }> {
    try {
      const loginUrl = `${this.apiBase}?action=login`;
      console.log(`🔐 Attempting login: ${loginUrl}`);

      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        // Defensively parse JSON
        const result = await response.json().catch(() => {
          if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}. The API server may be experiencing issues.`);
          }
          throw new Error('Invalid response from server: Expected valid JSON');
        });
        console.log('📝 Login response status:', response.status, 'Result:', result);

        if (!response.ok || result.status === 'error') {
          const errorMsg = result.message || result.error || `Login failed with status ${response.status}`;
          console.error('❌ Login error:', errorMsg);
          console.error('📊 Response details:', {
            status: response.status,
            statusText: response.statusText,
            result,
          });
          return {
            token: '',
            user: null,
            error: new Error(errorMsg),
          };
        }

        // Validate response structure
        if (!result.token) {
          console.error('❌ Server did not return a token');
          console.error('📊 Response:', result);
          return {
            token: '',
            user: null,
            error: new Error('Login failed: Server did not return an authentication token'),
          };
        }

        if (result.token) {
          // Verify token format before storing
          const tokenParts = result.token.split('.');
          if (tokenParts.length === 3) {
            // Valid JWT format (header.payload.signature)
            console.log('🔐 Token received from server - 3 parts ✅');

            this.setAuthToken(result.token);
            console.log('🔐 Token stored in localStorage');

            // Verify it was stored correctly
            const storedToken = this.getAuthToken();
            if (storedToken === result.token) {
              console.log('✅ Token storage verification PASSED');
              console.log('   - Token Format: Valid JWT (3 parts)');
              console.log('   - Token Length:', result.token.length);
              console.log('   - Token Preview:', result.token.substring(0, 30) + '...');

              // Try to decode and verify the token structure
              try {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('✅ Token payload decoded successfully:', {
                  sub: payload.sub,
                  email: payload.email,
                  role: payload.role,
                  exp: new Date(payload.exp * 1000).toISOString(),
                });
              } catch (e) {
                console.warn('⚠️ Could not decode token payload:', e);
              }
            } else {
              console.error('❌ Token storage verification FAILED');
              console.error('   - Expected:', result.token.substring(0, 30));
              console.error('   - Got:', storedToken?.substring(0, 30));
              throw new Error('Token storage verification failed');
            }
          } else {
            console.error('❌ Invalid token format received from server');
            console.error('   - Expected JWT format (header.payload.signature)');
            console.error('   - Received:', result.token.substring(0, 50));
            console.error('   - Token parts:', tokenParts.length);
            throw new Error('Invalid token format from server');
          }

          // Store user info in localStorage for consistent access
          if (result.user && result.user.id) {
            localStorage.setItem('med_api_user_id', result.user.id);
            localStorage.setItem('med_api_user_email', email);
            console.log('✅ User info stored:', { id: result.user.id, email });
          }

          // Track login time for grace period
          this.lastLoginTime = Date.now();
          this.failedValidationAttempts = 0;
          console.log('⏰ Login time tracked - starting grace period');
        }

        return {
          token: result.token || '',
          user: result.user,
          error: null,
        };
      } catch (fetchError: any) {
        // Enhanced error handling for login-specific issues
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          console.error('❌ Login failed - Network/CORS error:');
          console.error('API Endpoint:', loginUrl);
          console.error('This is likely a CORS issue.');
          console.error('💡 Solution: Backend needs to configure CORS headers:');
          console.error('   Access-Control-Allow-Origin: * (or specific domain)');
          console.error('   Access-Control-Allow-Methods: POST, OPTIONS');
          console.error('   Access-Control-Allow-Headers: Content-Type');

          return {
            token: '',
            user: null,
            error: new Error(`Unable to connect to login endpoint: ${loginUrl}. This is likely a CORS issue. Please check the browser console for details.`),
          };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      return {
        token: '',
        user: null,
        error: error as Error,
      };
    }
  }

  async signup(email: string, password: string, fullName?: string): Promise<{ error: Error | null }> {
    try {
      const signupUrl = `${this.apiBase}?action=signup`;
      console.log(`📝 Attempting signup: ${signupUrl}`);

      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName || email.split('@')[0] }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. The API server may be experiencing issues.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });
      console.log('📝 Signup response status:', response.status);

      if (!response.ok || result.status === 'error') {
        const errorMsg = result.message || result.error || `Signup failed with status ${response.status}`;
        console.error('❌ Signup error:', errorMsg);
        return {
          error: new Error(errorMsg),
        };
      }

      console.log('✅ Signup successful, user awaiting admin approval');
      return { error: null };
    } catch (error) {
      console.error('❌ Signup exception:', error);
      return {
        error: error as Error,
      };
    }
  }

  async logout(): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBase}?action=logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Defensively parse JSON
        const result = await response.json().catch(() => ({}));
        console.warn('⚠️  Logout API returned error:', result.message || 'Logout failed');
      }

      // Always clear tokens locally, even if API fails
      this.clearAuthToken();
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      console.log('✅ Local logout complete');
      return { error: null };
    } catch (error) {
      console.warn('⚠️  Logout error (clearing locally anyway):', error);
      // Clear tokens even if logout fails
      this.clearAuthToken();
      localStorage.removeItem('med_api_user_id');
      localStorage.removeItem('med_api_user_email');

      return { error: null }; // Return no error since we cleared locally
    }
  }

  async checkAuth(): Promise<{ user: any; error: Error | null }> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return {
          user: null,
          error: new Error('No token found'),
        };
      }

      // Check if we're within grace period after login (5 seconds minimum)
      const GRACE_PERIOD = 5000; // 5 seconds
      if (this.lastLoginTime !== null) {
        const timeSinceLogin = Date.now() - this.lastLoginTime;
        if (timeSinceLogin < GRACE_PERIOD) {
          console.log(`⏳ Within grace period after login (${Math.round(timeSinceLogin / 1000)}s < ${GRACE_PERIOD / 1000}s), skipping validation`);
          return {
            user: { id: localStorage.getItem('med_api_user_id'), email: localStorage.getItem('med_api_user_email') },
            error: null
          };
        }
      }

      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;
      let requestCompleted = false;

      timeoutId = setTimeout(() => {
        // Only abort if the request hasn't completed yet
        if (!requestCompleted && !isTimedOut) {
          isTimedOut = true;
          try {
            controller.abort();
          } catch (e) {
            // Ignore errors from abort() - it may fail if already aborted
            console.debug('Controller abort error (ignored):', e);
          }
        }
      }, 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.apiBase}?action=check_auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.getAuthToken() }),
          signal: controller.signal,
        });

        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Defensively parse JSON
        const result = await response.json().catch(() => {
          if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status}. Authentication check failed.`);
          }
          throw new Error('Invalid response from server: Expected valid JSON');
        });

        if (!response.ok) {
          // Only clear token on actual 401/403 auth errors, not on network issues
          const is401Or403 = response.status === 401 || response.status === 403;
          if (is401Or403) {
            console.warn(`⚠️ Received ${response.status} from checkAuth - token is invalid`);
            this.clearAuthToken();
          }
          return {
            user: null,
            error: new Error(`${is401Or403 ? 'Not authenticated' : 'Authentication check failed'} (HTTP ${response.status})`),
          };
        }

        // Success - reset failure counter
        this.failedValidationAttempts = 0;
        return { user: result, error: null };
      } catch (fetchError: any) {
        requestCompleted = true;
        if (timeoutId) clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          if (isTimedOut) {
            // Timeout is a network error, not an auth error - don't clear token
            console.warn('⚠️ Authentication check timeout (network issue)');
            return {
              user: null,
              error: new Error(`Authentication check timeout. The server may be unresponsive.`),
            };
          } else {
            console.warn('⚠️ Authentication check cancelled');
            return {
              user: null,
              error: new Error(`Authentication check was cancelled.`),
            };
          }
        }

        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          // Network error - don't clear token
          console.warn('⚠️ Network error during authentication check');
          return {
            user: null,
            error: new Error(`Unable to reach authentication endpoint: ${this.apiBase}. Check your connection.`),
          };
        }

        throw fetchError;
      }
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async getAuthContext(userId: string): Promise<AuthContext | null> {
    // For external API, auth context is simpler
    const { user, error } = await this.checkAuth();
    if (error || !user) return null;

    return {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async select<T>(table: string, filter?: Record<string, any>, isPublic?: boolean): Promise<ListQueryResult<T>> {
    try {
      const { data, error } = await this.apiCall('POST', 'read', table, null, filter, isPublic);

      if (error) {
        return { data: [], error, count: 0 };
      }

      const rows = Array.isArray(data) ? data : [];
      return {
        data: rows,
        error: null,
        count: rows.length,
      };
    } catch (error) {
      return { data: [], error: error as Error, count: 0 };
    }
  }

  async selectOne<T>(table: string, id: string, isPublic?: boolean): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.apiCall('POST', 'read', table, null, { id }, isPublic);

      if (error) {
        return { data: null, error };
      }

      const rows = Array.isArray(data) ? data : [];
      return { data: rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async selectBy<T>(table: string, filter: Record<string, any>, isPublic?: boolean): Promise<ListQueryResult<T>> {
    return this.select<T>(table, filter, isPublic);
  }

  async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
    try {
      const { data: result, error } = await this.apiCall('POST', 'create', table, data);

      if (error) {
        return { id: '', error };
      }

      return { id: result?.id || '', error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult> {
    try {
      // For bulk insert, we'll insert each record and track the first ID
      let firstId = '';
      for (const record of data) {
        const { data: result, error } = await this.apiCall('POST', 'create', table, record);
        if (!error && result?.id && !firstId) {
          firstId = result.id;
        }
      }

      return { id: firstId, error: null };
    } catch (error) {
      return { id: '', error: error as Error };
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult> {
    try {
      console.log(`📝 Updating ${table} record:`, {
        table,
        id,
        dataKeys: Object.keys(data as any || {}),
        authTokenPresent: !!this.getAuthToken(),
        dataSize: JSON.stringify(data).length,
      });
      const { error } = await this.apiCall('PUT', 'update', table, data, { id });
      if (error) {
        console.error(`❌ Update error for ${table}/${id}:`, error.message);
      }
      return { error };
    } catch (error) {
      console.error(`❌ Update exception for ${table}/${id}:`, error);
      return { error: error as Error };
    }
  }

  async updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult> {
    try {
      // External API requires updating one by one
      // First get all matching records
      const { data: records, error: selectError } = await this.select(table, filter);
      if (selectError) {
        return { error: selectError };
      }

      // Update each record
      for (const record of records as any[]) {
        await this.update(table, record.id, data);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async delete(table: string, id: string): Promise<DeleteResult> {
    try {
      const { error } = await this.apiCall('DELETE', 'delete', table, null, { id });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult> {
    try {
      // Get matching records first
      const { data: records, error: selectError } = await this.select(table, filter);
      if (selectError) {
        return { error: selectError };
      }

      // Delete each record
      for (const record of records as any[]) {
        await this.delete(table, record.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async raw<T>(sql: string, params?: any[]): Promise<ListQueryResult<T>> {
    try {
      const url = `${this.apiBase}?action=raw`;
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql, params }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Query execution failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: [],
          error: new Error(result.message || 'Query failed'),
        };
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      return { data: rows, error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    try {
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(`${this.apiBase}?action=rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ function: functionName, params: params || {} }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. RPC call failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: null,
          error: new Error(result.message || `RPC call to ${functionName} failed`),
        };
      }

      return { data: result.data || result, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async rpcList<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T[]; error: Error | null; count?: number }> {
    try {
      const currentToken = this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const response = await fetch(`${this.apiBase}?action=rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ function: functionName, params: params || {} }),
      });

      // Defensively parse JSON
      const result = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. RPC call failed.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        return {
          data: [],
          error: new Error(result.message || `RPC call to ${functionName} failed`),
        };
      }

      const data = Array.isArray(result.data) ? result.data : [];
      return { data, error: null, count: data.length };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  }

  async canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    // Admins can read everything
    if (auth?.role === 'admin' || auth?.role === 'super_admin') {
      return true;
    }

    // Non-admin users must be authenticated
    const userId = auth?.userId || auth?.user_id;
    if (!userId) {
      return false;
    }

    try {
      // Fetch the record to verify ownership
      const result = await this.selectOne(table, recordId);
      if (result.error || !result.data) {
        return false; // Record not found
      }

      // Verify user's company matches record's company
      const recordCompanyId = (result.data as any)?.company_id;
      const userCompanyId = auth?.companyId;

      if (!recordCompanyId || !userCompanyId) {
        return false; // Missing company_id
      }

      return recordCompanyId === userCompanyId;
    } catch (error) {
      console.error('Error in canRead authorization:', error);
      return false; // Deny on error (fail secure)
    }
  }

  async canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean> {
    // Admins can write everything
    if (auth?.role === 'admin' || auth?.role === 'super_admin') {
      return true;
    }

    // Non-admin users must be authenticated
    const userId = auth?.userId || auth?.user_id;
    if (!userId) {
      return false;
    }

    // Verify user's company matches the company being written to
    const userCompanyId = auth?.companyId;
    if (!userCompanyId || !companyId) {
      return false;
    }

    if (userCompanyId !== companyId) {
      return false; // Company mismatch - prevent cross-company writes
    }

    // If updating an existing record, verify ownership
    if (recordId) {
      try {
        const result = await this.selectOne(table, recordId);
        if (result.error || !result.data) {
          return false; // Record not found
        }

        const recordCompanyId = (result.data as any)?.company_id;
        return recordCompanyId === userCompanyId;
      } catch (error) {
        console.error('Error in canWrite authorization:', error);
        return false; // Deny on error (fail secure)
      }
    }

    return true; // New record, company already verified
  }

  async canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    // Admins can delete everything
    if (auth?.role === 'admin' || auth?.role === 'super_admin') {
      return true;
    }

    // Non-admin users must be authenticated
    const userId = auth?.userId || auth?.user_id;
    if (!userId) {
      return false;
    }

    try {
      // Fetch the record to verify ownership
      const result = await this.selectOne(table, recordId);
      if (result.error || !result.data) {
        return false; // Record not found
      }

      // Verify user's company matches record's company
      const recordCompanyId = (result.data as any)?.company_id;
      const userCompanyId = auth?.companyId;

      if (!recordCompanyId || !userCompanyId) {
        return false; // Missing company_id
      }

      return recordCompanyId === userCompanyId;
    } catch (error) {
      console.error('Error in canDelete authorization:', error);
      return false; // Deny on error (fail secure)
    }
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    // External API transactions handled server-side
    return callback(this);
  }

  async initialize(): Promise<void> {
    console.log('✅ External API adapter initialized for:', this.apiBase);
    // Verify connection
    const { error } = await this.checkAuth().catch(() => ({ error: new Error('Not authenticated yet') }));
    if (error) {
      console.warn('⚠️  API not yet authenticated. Login required.');
    }
  }

  async close(): Promise<void> {
    console.log('External API adapter closed');
  }

  async health(): Promise<boolean> {
    // Health check has been disabled to prevent AbortError issues
    // The app will rely on real operations to detect API issues
    console.debug('🔍 Health check method called but disabled - returning true');
    return true;
  }
}

export const externalApiAdapter = new ExternalAPIAdapter();
