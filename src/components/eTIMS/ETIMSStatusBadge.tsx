/**
 * ETIMSStatusBadge.tsx
 * Displays the status of eTIMS submissions with color coding
 */

import React from 'react';

interface ETIMSStatusBadgeProps {
  status: 'PENDING' | 'SUBMITTED' | 'SYNCED' | 'FAILED' | 'RETRYING' | 'ARCHIVED';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  SYNCED: {
    label: 'Synced',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: '✓',
  },
  FAILED: {
    label: 'Failed',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: '✕',
  },
  PENDING: {
    label: 'Pending',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: '⏱',
  },
  RETRYING: {
    label: 'Retrying',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: '↻',
  },
  SUBMITTED: {
    label: 'Submitted',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: '→',
  },
  ARCHIVED: {
    label: 'Archived',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: '📦',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function ETIMSStatusBadge({
  status,
  className = '',
  size = 'md',
}: ETIMSStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClass}
        ${className}
      `}
      title={config.label}
    >
      <span className="inline-block">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
