import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'trust' | 'secondary' | 'outline' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-bold tracking-tight rounded-[8px] transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

    const variants = {
      primary:
        'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary/50 shadow-sm shadow-brand-primary/20',
      trust:
        'bg-brand-trust text-white hover:bg-[#1E402E] focus-visible:ring-brand-trust/50 shadow-sm shadow-brand-trust/20',
      secondary:
        'bg-brand-surface text-brand-dark hover:bg-black/5 border border-brand-border focus-visible:ring-brand-dark/20',
      outline:
        'bg-transparent text-brand-dark hover:bg-brand-surface border border-brand-border hover:border-brand-dark/30 focus-visible:ring-brand-dark/20',
      ghost:
        'bg-transparent text-brand-dark hover:bg-brand-surface/80 focus-visible:ring-brand-dark/20',
      glow:
        'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md shadow-brand-primary/30 ring-1 ring-white/20',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-13 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>جارٍ التنفيذ...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
