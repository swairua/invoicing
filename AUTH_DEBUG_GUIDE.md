# Authentication Error Debug & Fix Guide

## Problem Summary
You were experiencing a 401 (Unauthorized) error when trying to read companies data, followed by an emergency token refresh that failed, resulting in the user being logged out.

## Root Causes Identified
1. **Token Format Issues**: Token might be corrupted or in an invalid format
2. **Token Expiration**: Token might have expired before the request
3. **API Validation Failures**: Backend rejecting valid-looking tokens
4. **Token Storage Issues**: Token not being stored or retrieved correctly from localStorage
5. **Missing Refresh Mechanism**: Token refresh endpoint may not exist on the backend

## Fixes Implemented

### 1. Enhanced Token Validation (src/integrations/database/external-api-adapter.ts)

#### A. Token Format Verification During Login
- Validates that returned token has valid JWT format (3 parts: header.payload.signature)
- Verifies token was actually stored in localStorage
- Provides detailed error messages if token format is invalid

```javascript
// Token is now validated before being stored
const tokenParts = result.token.split('.');
if (tokenParts.length === 3) {
  // Valid JWT - store it
  this.setAuthToken(result.token);
}
```

#### B. Token Format Check Before Sending
- Checks token format every time before sending it in Authorization header
- Clears corrupted tokens instead of sending them (which causes 401)
- Logs token validation details

```javascript
// Validate token format before sending
const tokenParts = currentToken.split('.');
if (tokenParts.length === 3) {
  headers['Authorization'] = `Bearer ${currentToken}`;
} else {
  console.warn('Token has invalid format - clearing it');
  this.clearAuthToken();
}
```

### 2. Improved 401 Error Handling

#### A. Better Token Refresh Logic
- **Primary**: Tries `refresh_token` action
- **Fallback 1**: Checks if token is actually valid using `check_auth`
- **Fallback 2**: Only clears token if both checks fail
- Only retries request once with refreshed token

```javascript
// Two-step fallback approach
await this.attemptTokenRefresh(); // Try refresh
const checkAuth = await fetch(checkAuthEndpoint); // Verify
// Clear only if both fail
```

#### B. Detailed 401 Debug Logging
When a 401 error occurs, the system now logs:
- Whether token is present
- Token format (valid/invalid/missing)
- Token length and preview
- Token expiration status
- User ID presence
- Full token diagnostics

### 3. Token Diagnostics Utility (src/utils/tokenDiagnostics.ts)

New comprehensive utility that checks:
- Token presence in localStorage
- Token format validity (JWT structure)
- Token expiration status
- User ID and email presence
- localStorage accessibility
- Lists specific issues found
- Provides recommendations for each issue

**Usage in code:**
```javascript
import { runTokenDiagnostics, logTokenDiagnostics } from '@/utils/tokenDiagnostics';

// Run diagnostics
const diagnostics = runTokenDiagnostics();

// Log to console with nice formatting
logTokenDiagnostics();
```

### 4. Token Diagnostics Page (src/pages/TokenDiagnosticsPage.tsx)

New debug page accessible at `/debug/token` that displays:
- Overall token status (Valid/Invalid)
- Token information (present, format, length)
- Expiration details
- User information
- Storage status
- Issues found and recommendations
- Quick action buttons

**Access it at:** `http://localhost:8080/debug/token`

### 5. Better Error Messages

Enhanced error messages now show:
- Whether token was present
- Possible causes (expired, revoked, rejected by server)
- Suggested next steps
- Detailed debugging information

### 6. Auth Context Improvements (src/contexts/AuthContext.tsx)

- Added localStorage change listener to detect token clearing
- Improved periodic token validation (every 5 minutes)
- User-friendly toast notifications on auth failures
- Automatic logout on invalid token detection

## How to Debug 401 Errors

### Step 1: Check Token Status
Go to **`/debug/token`** - This will show you:
- Is token present in localStorage?
- Is token in valid JWT format?
- Is token expired?
- Are user ID and email stored?

### Step 2: Check Browser Console
The error logs will show:
```
📊 401 Debug Info:
   - Has Token: true/false
   - Has User ID: true/false
   - Token Format: xxxx...
   - Token Length: 1234
🔍 Running full token diagnostics...
```

Then a detailed diagnostic report will appear.

### Step 3: Check API Server
Verify that:
1. API server is running (`https://med.wayrus.co.ke/api.php`)
2. API server is accessible from your network
3. API server is properly validating tokens
4. Token refresh endpoint exists (or fallback to check_auth)

### Step 4: Clear and Re-login
If issues persist:
1. Go to `/debug/token` page
2. Click "Clear localStorage"
3. Go to `/login` and sign in again
4. Return to `/debug/token` to verify new token

## Common Issues and Solutions

### Issue: "Token has invalid format"
**Cause:** Server returned malformed token or it got corrupted in transit/storage
**Solution:**
1. Check API server is returning valid JWT
2. Clear localStorage and re-login
3. Check for network proxy/firewall intercepting responses

### Issue: "Token is expired"
**Cause:** Your session has expired
**Solution:**
1. Log out and log in again
2. Check if server clock is synchronized with client

### Issue: "No authentication token found"
**Cause:** Token was never stored or was cleared
**Solution:**
1. Check login succeeded
2. Verify localStorage is accessible (`localStorage.clear()` in console)
3. Try incognito/private browsing mode

### Issue: "Still failed after token refresh"
**Cause:** Token refresh endpoint doesn't exist or backend has other issues
**Solution:**
1. Check API server has token refresh endpoint
2. Verify backend can validate tokens
3. Check user still exists in backend database
4. Verify user's role is configured

## Files Changed

### Core API & Auth:
- `src/integrations/database/external-api-adapter.ts` - Token validation, 401 handling, refresh logic
- `src/contexts/AuthContext.tsx` - Storage listener, token validation intervals
- `src/utils/authFailureHandler.ts` - Centralized auth failure handling

### New Files:
- `src/utils/tokenDiagnostics.ts` - Token diagnostics utility
- `src/pages/TokenDiagnosticsPage.tsx` - Debug page for token inspection
- `AUTH_DEBUG_GUIDE.md` - This guide

### Updated:
- `src/App.tsx` - Added `/debug/token` route

## Testing the Fix

### Test 1: Normal Login Flow
1. Go to `/login`
2. Log in with valid credentials
3. Go to `/debug/token`
4. Verify token is "Valid" and not expired

### Test 2: Expired Token Handling
1. Log in successfully
2. Go to browser DevTools
3. Run: `localStorage.removeItem('med_api_token')`
4. Try to access a protected page
5. Should show auth error and redirect to login
6. Go to `/debug/token` and verify token is missing

### Test 3: Invalid Token Format
1. Log in successfully
2. Go to browser DevTools
3. Run: `localStorage.setItem('med_api_token', 'invalid.token')`
4. Try to access a protected page
5. Should detect invalid format and clear it
6. Check console for format validation warnings

### Test 4: Companies Read with Valid Token
1. Log in successfully
2. Go to a page that reads companies (e.g., company switcher)
3. Verify no 401 error occurs
4. Check `/debug/token` to see token is valid

## Long-term Improvements

Consider implementing:
1. **Token Refresh Interval**: Automatically refresh token before expiration
2. **Refresh Token Support**: Store both access and refresh tokens
3. **Token Retry Logic**: Automatically retry failed requests with new token
4. **Session Persistence**: Save session across browser restarts
5. **Multi-tab Sync**: Sync auth state across browser tabs
6. **Secure Token Storage**: Use httpOnly cookies instead of localStorage

## Support

If issues persist after these fixes:
1. Check `/debug/token` for detailed diagnostics
2. Check browser console for detailed error messages
3. Verify API server is running and accessible
4. Check API server logs for token validation errors
5. Verify JWT secret is consistent between server and client
