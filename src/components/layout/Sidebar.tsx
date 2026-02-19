import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  FileText,
  Receipt,
  Package,
  DollarSign,
  Truck,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  FileCheck,
  CreditCard,
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Database,
  TrendingUp,
  Banknote,
  TrendingDown,
  Image as ImageIcon,
  LogOut,
  QrCode
} from 'lucide-react';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  shouldShowSidebarItem, 
  shouldShowParentMenu,
  getPermissionKey
} from '@/constants/sidebarPermissions';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/app'
  },
  {
    title: 'Sales',
    icon: Receipt,
    children: [
      { title: 'Quotations', icon: FileText, href: '/app/quotations' },
      { title: 'Proforma Invoices', icon: FileCheck, href: '/app/proforma' },
      { title: 'Invoices', icon: Receipt, href: '/app/invoices' },
      { title: 'Direct Receipts', icon: Banknote, href: '/app/direct-receipts' },
      { title: 'Credit Notes', icon: RotateCcw, href: '/app/credit-notes' }
    ]
  },
  {
    title: 'Payments',
    icon: DollarSign,
    children: [
      { title: 'Payments', icon: DollarSign, href: '/app/payments' },
      { title: 'Remittance Advice', icon: CreditCard, href: '/app/remittance' }
    ]
  },
  {
    title: 'Inventory',
    icon: Package,
    children: [
      { title: 'Inventory', icon: Package, href: '/app/inventory' },
      { title: 'Stock Movements', icon: TrendingUp, href: '/app/stock-movements' }
    ]
  },
  {
    title: 'Delivery Notes',
    icon: Truck,
    children: [
      { title: 'Delivery Notes', icon: Truck, href: '/app/delivery-notes' }
    ]
  },
  {
    title: 'Transport',
    icon: TrendingDown,
    children: [
      { title: 'Drivers', icon: Users, href: '/app/transport/drivers' },
      { title: 'Vehicles', icon: Truck, href: '/app/transport/vehicles' },
      { title: 'Materials', icon: Package, href: '/app/transport/materials' },
      { title: 'Finance', icon: DollarSign, href: '/app/transport/finance' }
    ]
  },
  {
    title: 'Customers',
    icon: Users,
    href: '/app/customers'
  },
  {
    title: 'Purchase Orders',
    icon: ShoppingCart,
    children: [
      { title: 'Local Purchase Orders', icon: ShoppingCart, href: '/app/lpos' },
      { title: 'Suppliers', icon: Building2, href: '/app/suppliers' }
    ]
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      { title: 'Sales Reports', icon: BarChart3, href: '/app/reports/sales' },
      { title: 'Inventory Reports', icon: Package, href: '/app/reports/inventory' },
      { title: 'Customer Statements', icon: FileSpreadsheet, href: '/app/reports/statements' },
      { title: 'Trading P&L', icon: TrendingUp, href: '/app/reports/trading-pl' },
      { title: 'Transport P&L', icon: Truck, href: '/app/reports/transport-pl' },
      { title: 'Consolidated P&L', icon: BarChart3, href: '/app/reports/consolidated-pl' }
    ]
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'Company Settings', icon: Building2, href: '/app/settings/company' },
      { title: 'User Management', icon: Users, href: '/app/settings/users' },
      { title: 'Payment Methods', icon: Banknote, href: '/app/settings/payment-methods' },
      { title: 'Database & Roles', icon: Database, href: '/app/settings/database-roles' }
    ]
  },
  {
    title: 'Admin',
    icon: LogOut,
    children: [
      { title: 'eTIMS Management', icon: QrCode, href: '/app/admin/etims' },
      { title: 'Image Management', icon: ImageIcon, href: '/app/admin/images' },
      { title: 'Audit Logs', icon: FileText, href: '/app/admin/audit-logs' },
      { title: 'Database', icon: Database, href: '/app/admin/database' }
    ]
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile, isAdmin } = useAuth();
  const { currentCompany } = useCurrentCompany();
  const { can, loading: permissionsLoading, role } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Debug logging on component mount and when props change
  console.log('🎨 [Sidebar] Rendering with:', {
    userRole: profile?.role,
    isAdmin: isAdmin,
    permissionsLoading: permissionsLoading,
    roleLoaded: !!role,
    roleId: role?.id,
    roleName: role?.name,
    permissionCount: role?.permissions?.length || 0,
    company: currentCompany?.name
  });

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Check if user has admin role
  const userIsAdmin = isAdmin || (profile?.role &&
    (profile.role.toLowerCase().includes('admin') || profile.role === 'super_admin'));

  const isItemVisible = (item: SidebarItem): boolean => {
    // Don't show items while permissions are still loading
    if (permissionsLoading) {
      console.log(`📋 [Sidebar] Item "${item.title}" hidden because permissions still loading`);
      return false;
    }

    // For child items, check if they are in a collapsed parent
    // We need to ensure we use the correct permission key
    const permissionKey = getPermissionKey(item.title, false);

    // Use permission-based visibility check from constants
    // Pass the original item title but let shouldShowSidebarItem handle the key mapping
    const visible = shouldShowSidebarItem(item.title, can, userIsAdmin);
    console.log(`👁️ [Sidebar] Item visibility check - Title: "${item.title}", Key: "${permissionKey}", Visible: ${visible}, IsAdmin: ${userIsAdmin}`);
    return visible;
  };

  const isItemActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const isParentActive = (children?: SidebarItem[]) => {
    if (!children) return false;
    return children.some(child => isItemActive(child.href));
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isActive = isItemActive(item.href);
    const isChildActive = isParentActive(item.children);

    // Filter children based on visibility
    const visibleChildren = item.children?.filter(isItemVisible) || [];

    // For parent items with children
    if (hasChildren) {
      // Use shouldShowParentMenu to determine if parent should be visible
      const childTitles = item.children.map(child => child.title);
      const parentShouldShow = shouldShowParentMenu(
        item.title,
        childTitles,
        can,
        userIsAdmin
      );

      console.log(`📂 [Sidebar] Parent menu check - Title: "${item.title}", ParentShouldShow: ${parentShouldShow}, VisibleChildren: ${visibleChildren.length}/${childTitles.length}`, {
        childTitles,
        visibleChildren: visibleChildren.map(c => c.title)
      });

      // Don't render parent if it has no visible children
      if (!parentShouldShow || visibleChildren.length === 0) {
        console.log(`❌ [Sidebar] Parent "${item.title}" not shown (no visible children)`);
        return null;
      }

      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              (isChildActive || isExpanded) 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground"
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && visibleChildren.length > 0 && (
            <div className="pl-4 space-y-1">
              {visibleChildren.map(child => (
                <Link
                  key={child.title}
                  to={child.href!}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isItemActive(child.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // For items without children, check visibility
    if (!isItemVisible(item)) {
      console.log(`❌ [Sidebar] Item "${item.title}" not visible to user`);
      return null;
    }

    return (
      <Link
        key={item.title}
        to={item.href!}
        className={cn(
          "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
        {/* Company Logo/Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <BiolegendLogo size="md" showText={true} className="text-sidebar-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 custom-scrollbar overflow-y-auto">
          {sidebarItems.map(item => renderSidebarItem(item)).filter(Boolean)}
        </nav>

        {/* Company Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-sidebar-foreground">
              <Building2 className="h-4 w-4 text-sidebar-primary" />
              <div>
                <div className="font-medium text-sm">{currentCompany?.name || '>> Medical Supplies'}</div>
                <div className="text-xs text-sidebar-foreground/60">{currentCompany?.country || 'Kenya'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-sidebar border-r border-sidebar-border z-40 md:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Logo/Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <BiolegendLogo size="md" showText={true} className="text-sidebar-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4 custom-scrollbar overflow-y-auto">
          {sidebarItems.map(item => renderSidebarItem(item)).filter(Boolean)}
        </nav>

        {/* Company Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-sidebar-foreground">
              <Building2 className="h-4 w-4 text-sidebar-primary" />
              <div>
                <div className="font-medium text-sm">{currentCompany?.name || '>> Medical Supplies'}</div>
                <div className="text-xs text-sidebar-foreground/60">{currentCompany?.country || 'Kenya'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
