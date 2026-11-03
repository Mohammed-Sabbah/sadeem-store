'use client';

import React, { useState } from 'react';
import { PAYMENT_RAILS, PaymentRailId } from '../constants/paymentRails';

interface DepositAccountCardProps {
  railId: PaymentRailId;
}

export const DepositAccountCard: React.FC<DepositAccountCardProps> = ({ railId }) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  const rail = PAYMENT_RAILS[railId];
  const { theme } = rail;

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2200);
    }
  };

  return (
    <div
      style={{
        borderTopColor: theme.primary,
        borderTopWidth: '3px',
      }}
      className="bg-brand-card rounded-[12px] border border-brand-border p-3.5 sm:p-4 space-y-3 font-almarai text-right shadow-2xs relative transition-all"
    >
      {/* Header: Monogram & Official Provider Name */}
      <div className="flex items-center gap-2 border-b border-brand-border/60 pb-2.5">
        <span
          style={{
            backgroundColor: theme.primary,
            color: '#FFFFFF',
          }}
          className="w-6 h-6 rounded-[6px] text-[10px] font-black font-mono flex items-center justify-center shrink-0 shadow-2xs"
        >
          {theme.monogram}
        </span>
        <h4 className="text-xs font-black text-brand-dark m-0 truncate">
          {rail.name}
        </h4>
      </div>

      {/* Account Number Box with 1-Click Copy */}
      <div
        style={{
          borderColor: theme.borderSoft,
        }}
        className="bg-brand-surface rounded-[8px] p-2.5 border flex items-center justify-between gap-3 shadow-2xs"
      >
        <div className="min-w-0">
          <span className="text-[10px] text-brand-muted block font-medium">
            {rail.accountLabel}
          </span>
          <span className="text-sm sm:text-base font-black text-brand-dark font-mono tracking-wider dir-ltr inline-block">
            {rail.depositAccount}
          </span>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(rail.depositAccount, setCopiedAccount)}
          style={
            copiedAccount
              ? {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: '#FFFFFF',
                }
              : undefined
          }
          className={`h-8 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
            copiedAccount
              ? 'text-white'
              : 'bg-brand-card text-brand-dark border border-brand-border hover:border-brand-primary'
          }`}
        >
          {copiedAccount ? (
            <>
              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>تم النسخ</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>نسخ الرقم</span>
            </>
          )}
        </button>
      </div>

      {/* IBAN Row if Bank */}
      {rail.depositIban && (
        <div className="bg-brand-surface/70 rounded-[8px] p-2 border border-brand-border/70 flex items-center justify-between text-xs gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-brand-muted block font-medium">الآيبان (IBAN)</span>
            <span className="font-mono text-[11px] font-bold text-brand-dark dir-ltr block truncate">
              {rail.depositIban}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(rail.depositIban || '', setCopiedIban)}
            className="text-[11px] font-bold px-2 py-1 rounded-[6px] border border-brand-border bg-brand-card text-brand-dark hover:border-brand-primary transition-all shrink-0 active:scale-95 cursor-pointer shadow-2xs"
          >
            {copiedIban ? 'تم النسخ ✓' : 'نسخ الآيبان'}
          </button>
        </div>
      )}

      {/* Beneficiary Name (Plain Text, No Copy Button per user instruction) */}
      <div className="text-[11px] text-brand-muted flex items-center gap-1.5 pt-0.5">
        <span>المستفيد:</span>
        <strong className="text-brand-dark font-bold">{rail.depositAccountHolder}</strong>
      </div>

      {/* Instruction */}
      <p className="text-[10px] sm:text-[11px] text-brand-muted leading-relaxed m-0 border-t border-brand-border/40 pt-2">
        {rail.depositInstruction}
      </p>
    </div>
  );
};
