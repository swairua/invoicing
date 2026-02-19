import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { shouldShowSidebarItem } from '@/constants/sidebarPermissions';

interface SidebarItem {
  title: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard' },
  {
    title: 'Sales',
    children: [
      { title: 'Quotations' },
      { title: 'Proforma Invoices' },
      { title: 'Invoices' },
      { title: 'Direct Receipts' },
      { title: 'Credit Notes' }
    ]
  },
  {
    title: 'Payments',
    children: [
      { title: 'Payments' },
      { title: 'Remittance Advice' }
    ]
  },
  {
    title: 'Inventory',
    children: [
      { title: 'Inventory' },
      { title: 'Stock Movements' }
    ]
  },
  {
    title: 'Delivery Notes',
    children: [
      { title: 'Delivery Notes' }
    ]
  },
  {
    title: 'Transport',
    children: [
      { title: 'Drivers' },
      { title: 'Vehicles' },
      { title: 'Materials' },
      { title: 'Finance' }
    ]
  },
  { title: 'Customers' },
  {
    title: 'Purchase Orders',
    children: [
      { title: 'Local Purchase Orders' },
      { title: 'Suppliers' }
    ]
  },
  {
    title: 'Reports',
    children: [
      { title: 'Sales Reports' },
      { title: 'Inventory Reports' },
      { title: 'Customer Statements' },
      { title: 'Trading P&L' },
      { title: 'Transport P&L' },
      { title: 'Consolidated P&L' }
    ]
  },
  {
    title: 'Settings',
    children: [
      { title: 'Company Settings' },
      { title: 'User Management' },
      { title: 'Payment Methods' },
      { title: 'Database & Roles' }
    ]
  },
  {
    title: 'Admin',
    children: [
      { title: 'Image Management' },
      { title: 'Audit Logs' },
      { title: 'Database' }
    ]
  }
];

export function PermissionDebugPanel() {
  const { profile, isAdmin } = useAuth();
  const { role, loading: permissionsLoading, can } = usePermissions();

  // Flatten sidebar items for visibility checking
  const flattenedItems: string[] = [];
  const flattenSidebarItems = (items: SidebarItem[]) => {
    items.forEach(item => {
      flattenedItems.push(item.title);
      if (item.children) {
        flattenSidebarItems(item.children);
      }
    });
  };
  flattenSidebarItems(sidebarItems);

  const visibleItems = flattenedItems.filter(title =>
    shouldShowSidebarItem(title, can, isAdmin)
  );

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50 bg-white rounded-lg shadow-lg border border-gray-200">
      <Card className="border-0">
        <CardHeader className="bg-gray-100 border-b pb-3">
          <CardTitle className="text-sm font-mono">🔍 Permission Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3 text-xs">
          {/* User Info */}
          <div>
            <p className="font-bold text-gray-700">User Info:</p>
            <div className="ml-2 space-y-1 font-mono text-gray-600">
              <p>ID: {profile?.id || 'N/A'}</p>
              <p>Email: {profile?.email || 'N/A'}</p>
              <p>IsAdmin: {isAdmin ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* Role Info */}
          <div>
            <p className="font-bold text-gray-700">Role Information:</p>
            <div className="ml-2 space-y-1 font-mono text-gray-600">
              <p>Role Name: {profile?.role || 'N/A'}</p>
              <p>Role Type: {role?.role_type || 'N/A'}</p>
              <p>Loading: {permissionsLoading ? '⏳ Yes' : '✅ No'}</p>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <p className="font-bold text-gray-700">Assigned Permissions: ({role?.permissions?.length || 0})</p>
            <div className="ml-2 flex flex-wrap gap-1">
              {role?.permissions && role.permissions.length > 0 ? (
                role.permissions.map(perm => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 italic">No permissions</p>
              )}
            </div>
          </div>

          {/* Visible Sidebar Items */}
          <div>
            <p className="font-bold text-gray-700">Visible Sidebar Items: ({visibleItems.length}/{flattenedItems.length})</p>
            <div className="ml-2 space-y-1">
              {visibleItems.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {visibleItems.map(item => (
                    <Badge key={item} variant="default" className="text-xs bg-green-600">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-red-600 italic font-bold">⚠️ No items visible!</p>
              )}
            </div>
          </div>

          {/* Hidden Items */}
          <div>
            <p className="font-bold text-gray-700">Hidden Items: ({flattenedItems.length - visibleItems.length})</p>
            <div className="ml-2">
              {flattenedItems.filter(item => !visibleItems.includes(item)).length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {flattenedItems
                    .filter(item => !visibleItems.includes(item))
                    .map(item => (
                      <Badge key={item} variant="outline" className="text-xs text-gray-500">
                        {item}
                      </Badge>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">All items visible</p>
              )}
            </div>
          </div>

          {/* Debug Info */}
          {permissionsLoading && (
            <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-yellow-800 text-xs">
              ⏳ Permissions still loading... Sidebar may be hidden until load completes.
            </div>
          )}

          {!permissionsLoading && visibleItems.length === 1 && (
            <div className="bg-red-50 border border-red-200 p-2 rounded text-red-800 text-xs">
              ⚠️ Only Dashboard visible! Check: <br/>
              1. User role assigned? <br/>
              2. Role exists in database? <br/>
              3. Role has permissions? <br/>
              4. Permissions match sidebar checks?
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PermissionDebugPanel;
