'use client';

import React from 'react';
import { PAYMENT_RAILS, PaymentRailId } from '../constants/paymentRails';

export interface WithdrawalFormFields {
  accountNumber: string;
  accountName: string;
  bankBranch?: string;
  notes?: string;
}

interface WithdrawalChannelFieldsProps {
  railId: PaymentRailId;
  fields: WithdrawalFormFields;
  onChange: (updated: Partial<WithdrawalFormFields>) => void;
  disabled?: boolean;
}

export const WithdrawalChannelFields: React.FC<WithdrawalChannelFieldsProps> = ({
  railId,
  fields,
  onChange,
  disabled = false,
}) => {
  const rail = PAYMENT_RAILS[railId];
  const { theme } = rail;

  return (
    <div className="space-y-3 font-almarai text-right">
      {/* Destination Bank / Wallet Indicator */}
      <div
        style={{
          backgroundColor: theme.bgSoft,
          borderColor: theme.borderSoft,
        }}
        className="rounded-[8px] p-2 border flex items-center gap-2"
      >
        <span
          style={{
            backgroundColor: theme.primary,
            color: '#FFFFFF',
          }}
          className="w-5 h-5 rounded-[5px] text-[10px] font-black font-mono flex items-center justify-center shrink-0"
        >
          {theme.monogram}
        </span>
        <strong className="text-xs font-black text-brand-dark">
          {rail.name}
        </strong>
      </div>

      {/* Account Number / Phone */}
      <div>
        <label className="block text-xs font-black text-brand-dark mb-1">
          {rail.accountLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.accountNumber}
          onChange={(e) => onChange({ accountNumber: e.target.value })}
          placeholder={rail.accountPlaceholder}
          disabled={disabled}
          required
          dir="ltr"
          className="w-full h-11 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs text-brand-dark text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-brand-primary focus:bg-brand-card transition-all"
        />
      </div>

      {/* Account Holder Name */}
      <div>
        <label className="block text-xs font-black text-brand-dark mb-1">
          اسم صاحب الحساب أو المستفيد <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.accountName}
          onChange={(e) => onChange({ accountName: e.target.value })}
          placeholder="الاسم الرباعي الرسمي"
          disabled={disabled}
          required
          className="w-full h-11 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs text-brand-dark text-xs sm:text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-brand-card transition-all"
        />
      </div>

      {/* Bank Branch if Bank */}
      {rail.type === 'bank' && (
        <div>
          <label className="block text-xs font-black text-brand-dark mb-1">
            فرع البنك
          </label>
          <input
            type="text"
            value={fields.bankBranch || ''}
            onChange={(e) => onChange({ bankBranch: e.target.value })}
            placeholder="مثال: دير البلح، النصيرات"
            disabled={disabled}
            className="w-full h-11 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs text-brand-dark text-xs sm:text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-brand-card transition-all"
          />
        </div>
      )}

      {/* Optional Transfer Notes */}
      <div>
        <label className="block text-xs font-bold text-brand-muted mb-1">
          ملاحظات (اختياري)
        </label>
        <input
          type="text"
          value={fields.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="أي توضيحات تخص الحوالة"
          disabled={disabled}
          className="w-full h-11 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs text-brand-dark text-xs font-normal focus:outline-none focus:border-brand-primary focus:bg-brand-card transition-all"
        />
      </div>
    </div>
  );
};
