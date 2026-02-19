/**
 * PermissionButton Component
 * A Button wrapper that shows tooltips when user lacks required permissions
 * Provides better UX by explaining why actions are disabled
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

interface PermissionButtonProps extends ButtonProps {
  requiredPermission?: Permission;
  hasPermission?: boolean;
  permissionDeniedReason?: string;
  children: React.ReactNode;
}

export const PermissionButton = React.forwardRef<
  HTMLButtonElement,
  PermissionButtonProps
>(
  (
    {
      requiredPermission,
      hasPermission = true,
      permissionDeniedReason,
      children,
      disabled,
      title,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || !hasPermission;
    const tooltipText = permissionDeniedReason ||
      (requiredPermission
        ? `Requires: ${PERMISSION_DESCRIPTIONS[requiredPermission]}`
        : title);

    if (!hasPermission && requiredPermission) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={ref}
                disabled={true}
                {...props}
              >
                {children}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{`You don't have permission for this action`}</p>
              <p className="text-xs opacity-75">
                {PERMISSION_DESCRIPTIONS[requiredPermission]}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        title={tooltipText}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PermissionButton.displayName = 'PermissionButton';

export default PermissionButton;
