import React from 'react';
import { cn } from '@/lib/util';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-masar-surface-hover/50 text-masar-text-muted',
  success: 'bg-masar-success/10 text-masar-success border border-masar-success/20',
  warning: 'bg-masar-warning/10 text-masar-warning border border-masar-warning/20',
  error: 'bg-masar-error/10 text-masar-error border border-masar-error/20',
  accent: 'bg-masar-cyan/10 text-masar-cyan border border-masar-cyan/20',
};

const sizes: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', className }) => {
  return (
    <span className={cn('inline-flex items-center rounded-lg font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export default Badge;
