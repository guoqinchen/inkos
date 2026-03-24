import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  className = '',
}) => {
  return (
    <span className={`status-badge status-badge--${variant} ${className}`}>
      {label}
    </span>
  );
};
