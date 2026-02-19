# RBAC Testing & Validation Guide

This guide provides comprehensive testing scenarios to validate that the Role-Based Access Control implementation is working correctly.

## Test Overview

The RBAC implementation includes:
1. ✅ Frontend permission enforcement (usePermissions hook)
2. ✅ Role definitions with granular permissions
3. ✅ Component-level access control
4. ✅ Server-side permission middleware (ready to be integrated)
5. ✅ Role management UI for admins

## Testing Methodology

### Test Environment Setup

1. **Create test user accounts** for each role:
   - Admin user
   - Accountant user  
   - Stock Manager user
   - Basic User
   - Custom role user

2. **Ensure roles are configured** with proper permissions in Database > Role Management

## Test Scenarios

### Scenario 1: Admin User Access

**Setup:**
- Login as admin user
- Navigate to various pages

**Expected Results:**
- ✅ Can view all pages (Inventory, Invoices, Quotations, Reports, etc.)
- ✅ "Create" buttons are enabled on all pages
- ✅ "Edit" buttons are enabled for all items
- ✅ "Delete" buttons are enabled for all items
- ✅ Can access Settings > Role Management
- ✅ Can create, edit, delete custom roles
- ✅ Can assign roles to users

**Test Steps:**
1. Login as admin
2. Navigate to `/dashboard/inventory`
   - Verify "Add Item" button is enabled
3. Navigate to `/dashboard/invoices`
   - Verify "Create Invoice" button is enabled
4. Navigate to `/dashboard/quotations`
   - Verify "Create Quotation" button is enabled
5. Navigate to `/settings/roles`
   - Verify role management panel is visible
   - Verify can create new role

### Scenario 2: Accountant User Access

**Setup:**
- Login as accountant user
- Accountant should have: create_invoice, view_invoice, edit_invoice, create_quotation, view_quotation, edit_quotation, view_reports, etc.

**Expected Results:**
- ✅ Can view Invoices page
- ✅ Can create invoices
- ✅ Can edit invoices
- ✅ Cannot delete invoices (disabled button)
- ✅ Can view Quotations page
- ✅ Can create quotations
- ✅ Cannot access Inventory page (access denied)
- ✅ Cannot access Role Management (access denied)

**Test Steps:**
1. Login as accountant
2. Navigate to `/dashboard/invoices`
   - Verify "Create Invoice" button is enabled
   - Click on an invoice's "Edit" button
   - Verify edit modal opens
   - Try to delete an invoice
   - Verify "Delete" button is disabled (hover to see tooltip)
3. Navigate to `/dashboard/inventory`
   - Verify "Access Denied" message appears
   - Cannot see inventory list
4. Navigate to `/settings/roles`
   - Verify access denied (redirected to settings or denied message)

### Scenario 3: Stock Manager User Access

**Setup:**
- Login as stock manager user
- Stock Manager should have: view_inventory, edit_inventory, create_inventory, manage_inventory, create_delivery_note, view_delivery_note, edit_delivery_note

**Expected Results:**
- ✅ Can view Inventory page
- ✅ Can create inventory items
- ✅ Can edit inventory items
- ✅ Cannot delete inventory items
- ✅ Can create delivery notes
- ✅ Cannot access Invoices > Delete (disabled)
- ✅ Cannot create invoices (page access restricted)

**Test Steps:**
1. Login as stock manager
2. Navigate to `/dashboard/inventory`
   - Verify "Add Item" button is enabled
   - Verify inventory list is visible
3. Try to create new inventory item
   - Verify "Add Item" modal opens successfully
4. Navigate to `/dashboard/invoices`
   - Verify page loads and shows invoices
   - Verify "Create Invoice" button is disabled (no permission)
5. Navigate to `/dashboard/delivery-notes`
   - Verify "Create Delivery Note" button is enabled

### Scenario 4: Basic User Access

**Setup:**
- Login as basic user
- Basic User should have view-only permissions: view_quotation, view_invoice, view_inventory, view_reports

**Expected Results:**
- ✅ Can view Quotations, Invoices, Inventory pages (read-only)
- ✅ All "Create" buttons are disabled
- ✅ All "Edit" buttons are disabled
- ✅ All "Delete" buttons are disabled
- ✅ Can view summary cards and data
- ✅ Restricted from creating/editing anything

**Test Steps:**
1. Login as basic user
2. Navigate to `/dashboard/inventory`
   - Verify "Add Item" button is disabled
   - Hover over disabled button to see tooltip
   - Verify inventory list is visible (read-only)
3. Navigate to `/dashboard/invoices`
   - Verify "Create Invoice" button is disabled
   - Verify invoice list is visible but no edit/delete options
4. Navigate to `/dashboard/quotations`
   - Verify "Create Quotation" button is disabled
5. Try to access `/settings/roles`
   - Verify access denied

### Scenario 5: Custom Role User Access

**Setup:**
1. Create custom role "Limited Sales" with ONLY:
   - view_quotation
   - create_quotation
   - view_customer
2. Create user with this custom role

**Expected Results:**
- ✅ Can only view Quotations page
- ✅ Can create quotations
- ✅ Cannot edit quotations
- ✅ Cannot delete quotations
- ✅ Cannot access Invoices, Inventory, or other pages
- ✅ Can view Customers (read-only)

**Test Steps:**
1. Admin navigates to Settings > Role Management
2. Create new role "Limited Sales"
3. Select ONLY permissions: view_quotation, create_quotation, view_customer
4. Save role
5. Create new user or edit existing user to assign "Limited Sales" role
6. Logout and login as that user
7. Verify navigation shows only Quotations and Customers
8. Verify cannot access other pages (get access denied)

## Permission Verification Checklist

### Frontend Permission Checks

- [ ] `usePermissions()` hook returns correct role with permissions
- [ ] `can(permission)` returns true/false correctly
- [ ] `canView(entity)` works for all entity types
- [ ] `canCreate(entity)` returns false for restricted roles
- [ ] `canEdit(entity)` returns false for restricted roles
- [ ] `canDelete(entity)` returns false for non-admin roles
- [ ] Buttons disable when user lacks permission
- [ ] Permission error messages display on interaction

### Component-Level Checks

- [ ] Inventory page shows/hides buttons based on permissions
- [ ] Invoices page shows/hides buttons based on permissions
- [ ] Quotations page shows/hides buttons based on permissions
- [ ] Reports page shows/hides export buttons based on permissions
- [ ] User Management page is admin-only
- [ ] Role Management page is admin-only

### Server-Side Checks (When Integrated)

- [ ] API endpoints validate user permissions
- [ ] 403 Forbidden returned for insufficient permissions
- [ ] Company isolation enforced (users can't access other companies' data)
- [ ] Audit logs track permission denials

### UI/UX Checks

- [ ] Disabled buttons have visual feedback (gray out)
- [ ] Tooltips explain why buttons are disabled
- [ ] Error toasts explain permission denials
- [ ] "Access Denied" page shows when accessing restricted pages
- [ ] Navigation doesn't show restricted pages for restricted users

## Browser DevTools Verification

Open browser Developer Tools (F12) and check:

1. **Network Tab:**
   - API calls include Authorization header with JWT token
   - Responses show user's role and permissions in payload

2. **Console:**
   - Check logs for "🔐 Inventory access check: {hasAccess, userRole, permissions}"
   - Verify role name and permissions list

3. **Local Storage:**
   - `med_api_token` - JWT token containing user role
   - `med_api_user_id` - User ID
   - `med_api_user_email` - User email

## Troubleshooting Failed Tests

### Button remains enabled for restricted user:

1. Check browser console for permission check logs
2. Verify user is assigned correct role in database
3. Clear localStorage and reload page
4. Check that role definition exists in `roles` table
5. Verify role has correct permissions array

### "Access Denied" appears for admin user:

1. Verify user role is "admin" (case-insensitive)
2. Check AuthContext logs in console
3. Verify profile.role field is populated
4. Ensure user.status is 'active'

### Permission changes don't take effect immediately:

1. Refresh page to reload role definition
2. Clear browser cache
3. Check that role update was successful in Role Management
4. Verify role is associated with correct company

## Test Results Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [Development/Staging/Production]

=== Test Summary ===
- [ ] Admin user access: PASS / FAIL
- [ ] Accountant user access: PASS / FAIL
- [ ] Stock Manager user access: PASS / FAIL
- [ ] Basic user access: PASS / FAIL
- [ ] Custom role access: PASS / FAIL

=== Issues Found ===
1. [Issue description]
2. [Issue description]

=== Notes ===
[Any additional notes or observations]
```

## Automated Test Ideas (Future)

For comprehensive test coverage, consider implementing:

1. **Unit Tests:**
   - Test `usePermissions()` hook returns correct boolean values
   - Test permission checking utility functions
   - Test role permission mapping logic

2. **Integration Tests:**
   - Login with different role users
   - Verify API endpoints reject insufficient permissions
   - Verify database isolation by company

3. **E2E Tests (Cypress/Playwright):**
   - Login flow and role assignment
   - Navigation restrictions
   - Button enable/disable states
   - Permission-based access to pages
   - Form submission with insufficient permissions

## Success Criteria

The RBAC implementation is working correctly when:

✅ Users can only access features permitted by their role  
✅ Buttons are disabled for operations user can't perform  
✅ Error messages explain permission requirements  
✅ Each role type has appropriate restrictions  
✅ Custom roles can be created with flexible permissions  
✅ Role changes take effect immediately after refresh  
✅ Company data is isolated by company_id  
✅ Admin users can manage all roles  
✅ No permission bypass is possible (no hardcoded "all" permissions)  

## Next Steps

After validation:

1. Document any issues found
2. Fix bugs discovered during testing
3. Update role definitions as needed
4. Train users on their role capabilities
5. Monitor audit logs for permission denials
6. Periodically review and audit role assignments
