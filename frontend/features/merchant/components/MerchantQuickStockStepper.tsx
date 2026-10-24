'use client';

import React from 'react';

export interface MerchantQuickStockStepperProps {
  stock: number;
  onChange: (newStock: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  unitLabel?: string;
  decreaseTitle?: string;
  increaseTitle?: string;
}

export const MerchantQuickStockStepper: React.FC<MerchantQuickStockStepperProps> = ({
  stock,
  onChange,
  min = 0,
  max = 99999,
  disabled = false,
  size = 'md',
  showUnit = true,
  unitLabel = 'ق',
  decreaseTitle = 'إنقاص قطعة واحدة (-1)',
  increaseTitle = 'زيادة قطعة واحدة (+1)',
}) => {
  const currentStock = Math.max(min, Number(stock) || 0);
  const canDecrease = !disabled && currentStock > min;
  const canIncrease = !disabled && currentStock < max;

  const handleDecrease = () => {
    if (canDecrease) {
      onChange(currentStock - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onChange(currentStock + 1);
    }
  };

  // Size variations preserving exact styles:
  // sm: compact for variant rows (w-5 h-5)
  // md: desktop table rows (w-6 h-6)
  // lg: touch-friendly mobile cards (w-8 h-8)
  const containerClasses = {
    sm: 'inline-flex items-center bg-brand-surface rounded-lg p-0.5 border border-brand-border shadow-2xs select-none shrink-0',
    md: 'inline-flex items-center gap-1 bg-brand-surface rounded-xl p-0.5 border border-brand-border shadow-2xs select-none',
    lg: 'inline-flex items-center bg-brand-surface rounded-xl p-1 border border-brand-border select-none',
  }[size];

  const buttonClasses = {
    sm: 'w-5 h-5 rounded-md bg-brand-card text-brand-dark flex items-center justify-center font-bold text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none',
    md: 'w-6 h-6 rounded-lg bg-brand-card text-brand-dark flex items-center justify-center font-black text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs',
    lg: 'w-8 h-8 rounded-lg bg-brand-card text-brand-dark font-bold text-sm flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer disabled:opacity-30 disabled:pointer-events-none',
  }[size];

  const labelClasses = {
    sm: 'px-1.5 text-xs font-black min-w-6 text-center text-brand-dark',
    md: 'px-2 text-xs font-black min-w-9 text-center text-brand-dark flex items-center justify-center gap-0.5',
    lg: 'px-2.5 text-xs font-black min-w-9 text-center text-brand-dark',
  }[size];

  return (
    <div className={containerClasses}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={!canDecrease}
        className={buttonClasses}
        title={decreaseTitle}
        aria-label="إنقاص المخزون"
      >
        -
      </button>

      <div className={labelClasses} title="الكمية المتوفرة">
        <span>{currentStock}</span>
        {showUnit && size === 'md' && (
          <span className="text-[10px] font-medium text-brand-muted">{unitLabel}</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={!canIncrease}
        className={buttonClasses}
        title={increaseTitle}
        aria-label="زيادة المخزون"
      >
        +
      </button>
    </div>
  );
};
