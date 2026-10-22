import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'discount' | 'trust' | 'neutral' | 'glow' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'neutral', size = 'md', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-bold tracking-tight rounded-full transition-colors';

  const variants = {
    discount: 'bg-brand-primary-soft text-brand-primary border border-brand-primary/20',
    trust: 'bg-brand-trust-soft text-brand-trust border border-brand-trust/30',
    neutral: 'bg-brand-surface text-brand-muted border border-brand-border',
    glow: 'bg-[#F7F1E6] text-[#B08D57] border border-[#B08D57]/30',
    outline: 'bg-transparent text-brand-dark border border-brand-border',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
