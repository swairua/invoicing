# Permission Diagnostics Guide

## Overview

I've set up comprehensive diagnostics to troubleshoot your permission issue where the accountant user is denied access to `/app/invoices` despite having all required permissions.

## Quick Start

### Step 1: Access the Diagnostics Page

1. **While logged in as the accountant user**, go to:
   ```
   http://your-app/debug/permissions
   ```

2. The page will automatically run diagnostics and display detailed information about:
   - User authentication status
   - Role assignment
   - Role definitions (from profile and from database)
   - Permission loading status
   - Specific invoice permission checks
   - Database role fetch results

### Step 2: Try to Access Invoices Page

1. Navigate to: `http://your-app/app/invoices`
2. **Open your browser Developer Console** (F12 or Right-click → Inspect → Console tab)
3. You'll see detailed logs showing:
   - Permission check initiation
   - Permission check results
   - Exact permissions available vs required

### Step 3: Collect Diagnostic Information

**Copy the following from the Diagnostics page:**
1. User authentication section
2. Role assignment section
3. All role definition sections
4. Invoice permissions check results

**Copy the following from the browser console:**
Look for logs with these prefixes:
- `🔐 [ProtectedRoute]` - Permission check logs
- `🔐 [hasAnyPermission]` - Permission matching logs
- `🔐 [usePermissions]` - Role loading logs
- `🔐 [hasPermission]` - Individual permission check logs

## What to Look For

### Scenario 1: Role Definition Missing
**Diagnostic Signs:**
- Permission Hook Status shows "not loading" but role is null
- Database Role Fetch shows "Role not found in database"

**Fix:**
```sql
-- Verify the accountant role exists
SELECT * FROM roles 
WHERE name = 'accountant' 
AND company_id = YOUR_COMPANY_ID;
```

If it doesn't exist, you need to create it via the UI or database.

### Scenario 2: Permissions Not Properly Stored
**Diagnostic Signs:**
- Role Definition loads successfully
- But permissionCount is 0
- Or Invoice Permissions Check shows "Missing invoice permissions"

**Check:**
```sql
-- Check what permissions are stored
SELECT 
  id, 
  name, 
  permissions,
  JSON_TYPE(permissions) as permissions_type
FROM roles 
WHERE name = 'accountant';
```

The permissions column should contain a valid JSON array:
```json
["create_invoice","view_invoice","edit_invoice",...]
```

**Fix if permissions are NULL:**
```sql
UPDATE roles 
SET permissions = JSON_ARRAY(
  'create_invoice', 'view_invoice', 'edit_invoice', 'export_invoice',
  'create_payment', 'view_payment', 'edit_payment',
  'create_credit_note', 'view_credit_note', 'edit_credit_note', 'export_credit_note',
  'view_proforma', 'export_proforma',
  'view_quotation', 'export_quotation',
  'view_customer',
  'create_remittance', 'view_remittance', 'edit_remittance',
  'view_lpo',
  'view_reports', 'export_reports', 'view_customer_reports', 'view_sales_reports',
  'view_delivery_note',
  'view_audit_logs'
)
WHERE name = 'accountant' AND company_id = YOUR_COMPANY_ID;
```

### Scenario 3: JSON Parsing Issue
**Diagnostic Signs:**
- Database Role Fetch shows permissionsType: "string"
- Permissions loads but appears as a JSON string instead of array

**Fix:**
The code now handles this, but you can verify permissions are stored as JSON:

```sql
UPDATE roles 
SET permissions = JSON_ARRAY(
  'create_invoice', 'view_invoice', 'edit_invoice',
  -- ... all other permissions ...
)
WHERE name = 'accountant' 
AND JSON_TYPE(permissions) != 'ARRAY';
```

### Scenario 4: Role Not Assigned to User
**Diagnostic Signs:**
- Role Assignment section shows "No role assigned to user"
- Or role is assigned but doesn't match database records

**Check:**
```sql
-- Check user's assigned role
SELECT 
  p.id, 
  p.email, 
  p.role, 
  p.company_id,
  r.id as role_id,
  r.permissions
FROM profiles p
LEFT JOIN roles r ON (r.name = p.role AND r.company_id = p.company_id)
WHERE p.email = 'accountant@yourcompany.com';
```

The JOIN should succeed and show role details. If it doesn't, the role name doesn't match or company_id is misaligned.

## Console Log Guide

### Permission Check Logs

```
🔐 [ProtectedRoute] Checking permissions: {
  requiredPermissions: ["view_invoice", "create_invoice", "edit_invoice"],
  requireAllPermissions: false,
  userRole: "accountant",
  permissionsLoading: false
}
```
✅ Good sign - permissions are being checked and loading is done.

```
🔐 [hasAnyPermission] User has at least one required permission: {
  roleName: "accountant",
  foundPermissions: ["view_invoice", "create_invoice", "edit_invoice"],
  requiredPermissions: ["view_invoice", "create_invoice", "edit_invoice"]
}
```
✅ Perfect - user has all required permissions!

```
❌ [ProtectedRoute] Access denied: {
  requiredPermissions: ["view_invoice", "create_invoice", "edit_invoice"],
  userRole: "accountant"
}
```
❌ Access denied - despite having the role assigned.

### Role Loading Logs

```
✅ [usePermissions] Using role definition from profile: {
  name: "accountant",
  role_type: "accountant",
  permissionCount: 25,
  permissions: [...]
}
```
✅ Great - role loaded from user profile cache.

```
✅ [usePermissions] Role fetched successfully from database: {
  id: 5,
  name: "accountant",
  role_type: "accountant",
  permissionCount: 25,
  permissions: [...]
}
```
✅ Good - role loaded from database.

```
⚠️ [usePermissions] Custom role not found, using default permissions for: accountant
```
⚠️ Warning - role not in database, using DEFAULT_ROLE_PERMISSIONS.

## Testing Steps

### Test 1: Verify Admin Can Access Invoices
1. Log out
2. Log in as admin
3. Go to `/app/invoices`
4. Should work without issues
5. Check console - should see permission checks pass

### Test 2: Verify Accountant Role Configuration
1. Go to Settings → User Management
2. Find the accountant user
3. Verify role is set to "accountant"
4. Check if there's any warning icon or message

### Test 3: Check Database Directly
Run these SQL queries:

```sql
-- 1. Check if accountant role exists for your company
SELECT COUNT(*) as role_count FROM roles 
WHERE name = 'accountant' AND company_id = YOUR_COMPANY_ID;

-- 2. Check role permissions
SELECT permissions FROM roles 
WHERE name = 'accountant' AND company_id = YOUR_COMPANY_ID;

-- 3. Check if accountant user is assigned to the role
SELECT id, email, role, company_id FROM profiles 
WHERE email = 'accountant@yourcompany.com';

-- 4. Verify the role has invoice permissions
SELECT JSON_EXTRACT(permissions, '$[*]') as perms FROM roles 
WHERE name = 'accountant' AND company_id = YOUR_COMPANY_ID;
```

## Files Modified for Diagnostics

1. **`src/pages/PermissionsDiagnostics.tsx`** - New diagnostics page with detailed checks
2. **`src/utils/permissionChecker.ts`** - Enhanced logging in permission check functions
3. **`src/components/auth/ProtectedRoute.tsx`** - Enhanced logging in route protection
4. **`src/App.tsx`** - Added `/debug/permissions` route

## Next Steps

1. **Access the diagnostics page** while logged in as the accountant
2. **Check the detailed results** - they will pinpoint the exact issue
3. **Share the diagnostic results** with your support team
4. **Check the browser console logs** for additional details
5. **Run the suggested SQL queries** to verify database state

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Role Definition not found in database" | Create the accountant role in Settings → Roles or via SQL |
| "Permissions are null" | Update the role's permissions via Settings → Roles or SQL |
| "Role loads but permissions empty" | Check if permissions JSON is malformed in database |
| "Loading stuck on usePermissions" | Check browser console for API errors or network issues |
| "Admin works but accountant doesn't" | Verify accountant role exists and is assigned to user |

## Contacting Support

When contacting support, provide:
1. Screenshot of the Diagnostics page results
2. Full browser console output (F12 → Console → copy all text)
3. The SQL query results from your database
4. Your company name and accountant user email address
