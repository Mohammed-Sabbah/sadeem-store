'use client';

import React from 'react';
import { PAYMENT_RAILS_LIST, PaymentRailId } from '../constants/paymentRails';

interface PaymentRailSelectorProps {
  selectedRail: PaymentRailId;
  onSelect: (id: PaymentRailId) => void;
  label?: string;
}

export const PaymentRailSelector: React.FC<PaymentRailSelectorProps> = ({
  selectedRail,
  onSelect,
  label = 'اختر وسيلة أو قناة التحويل المالي:',
}) => {
  return (
    <div className="space-y-2.5 font-almarai text-right">
      {label && (
        <label className="block text-xs font-black text-brand-dark">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PAYMENT_RAILS_LIST.map((rail) => {
          const isSelected = selectedRail === rail.id;
          const { theme } = rail;

          return (
            <button
              key={rail.id}
              type="button"
              onClick={() => onSelect(rail.id)}
              style={
                isSelected
                  ? {
                      borderColor: theme.borderActive,
                      backgroundColor: theme.bgSoft,
                      boxShadow: `0 3px 10px -2px ${theme.primary}25`,
                    }
                  : undefined
              }
              className={`p-2.5 rounded-[10px] border text-right transition-all cursor-pointer active:scale-[0.98] relative flex flex-col justify-between min-h-[68px] group ${
                isSelected
                  ? 'border-2 text-brand-dark'
                  : 'border-brand-border bg-brand-surface text-brand-muted hover:border-brand-border/80 hover:bg-brand-card hover:text-brand-dark shadow-2xs'
              }`}
            >
              {/* Top: Brand Monogram Badge & Selection Indicator */}
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  style={{
                    backgroundColor: isSelected ? theme.primary : theme.badgeBg,
                    color: isSelected ? '#FFFFFF' : theme.badgeText,
                    borderColor: isSelected ? theme.primary : theme.borderSoft,
                  }}
                  className="text-[10px] font-black px-1.5 py-0.2 rounded-[5px] border tracking-wider font-mono transition-colors shadow-2xs"
                >
                  {theme.monogram}
                </span>

                <span
                  style={isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : undefined}
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-transparent text-white shadow-2xs'
                      : 'border-stone-300 bg-white group-hover:border-stone-400'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2 h-2 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Bank Name */}
              <strong
                style={isSelected ? { color: theme.primary } : undefined}
                className={`block text-xs font-black leading-tight transition-colors ${
                  isSelected ? '' : 'text-brand-dark'
                }`}
              >
                {rail.shortName}
              </strong>
            </button>
          );
        })}
      </div>
    </div>
  );
};
