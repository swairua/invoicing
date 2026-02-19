/**
 * PermissionGuardedButton Component
 * A Button wrapper that hides the button entirely if user lacks required permissions
 * Provides better UX by not displaying UI elements users cannot use
 */

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Permission, PERMISSION_DESCRIPTIONS } from '@/types/permissions';

interface PermissionGuardedButtonProps extends ButtonProps {
  /** The permission required to display this button */
  permission: Permission;
  /** Whether the user has the required permission */
  hasPermission: boolean;
  /** Optional custom message explaining why button is hidden */
  denialMessage?: string;
  /** Whether to show tooltip when hovering over hidden button area */
  showTooltipOnDenial?: boolean;
  children: React.ReactNode;
}

export const PermissionGuardedButton = React.forwardRef<
  HTMLButtonElement,
  PermissionGuardedButtonProps
>(
  (
    {
      permission,
      hasPermission,
      denialMessage,
      showTooltipOnDenial = false,
      children,
      ...props
    },
    ref
  ) => {
    // If user has permission, render button normally
    if (hasPermission) {
      return (
        <Button ref={ref} {...props}>
          {children}
        </Button>
      );
    }

    // If user lacks permission, render nothing by default
    // Only render hidden button with tooltip if explicitly requested
    if (showTooltipOnDenial) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="opacity-0 pointer-events-none">
                <Button ref={ref} disabled {...props}>
                  {children}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">
                  {denialMessage || 'Permission Denied'}
                </p>
                <p className="text-xs opacity-75">
                  {PERMISSION_DESCRIPTIONS[permission] || 'You do not have permission for this action'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Default: render nothing if user lacks permission
    return null;
  }
);

PermissionGuardedButton.displayName = 'PermissionGuardedButton';

export default PermissionGuardedButton;
