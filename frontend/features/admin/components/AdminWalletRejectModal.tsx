'use client';

import React, { useState, useEffect } from 'react';

interface AdminWalletRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  transactionTitle: string;
  isSubmitting?: boolean;
}

const WALLET_REJECTION_PRESETS = [
  'صورة الإشعار غير واضحة أو مبتورة.',
  'رقم الحوالة مستخدم في طلب سابق (تكرار إشعار).',
  'المبلغ المحول لا يطابق المبلغ المكتوب في الإشعار.',
  'لم يتم استلام الحوالة في حساب سَدِيم المعتمد بعد.',
];

export const AdminWalletRejectModal: React.FC<AdminWalletRejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transactionTitle,
  isSubmitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('');
      setCustomReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const finalReason = customReason.trim() || selectedPreset;
  const canSubmit = Boolean(finalReason) && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(finalReason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in select-none font-almarai"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-brand-card rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-brand-border text-right relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-brand-dark">
              رفض المعاملة المالية
            </h3>
            <p className="text-xs text-brand-muted truncate max-w-xs">
              {transactionTitle}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-2xs">
            <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-dark">
              اختر سبب الرفض السريع (وفق معايير سَدِيم)
            </label>
            <div className="space-y-1.5">
              {WALLET_REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomReason('');
                  }}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedPreset === preset && !customReason
                      ? 'border-red-400 bg-red-50/70 text-red-900 shadow-2xs'
                      : 'border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark hover:border-brand-primary/40'
                  }`}
                >
                  • {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-dark">
              أو اكتب سبباً مخصصاً للزبون
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (e.target.value) setSelectedPreset('');
              }}
              placeholder="اكتب التوضيح الذي سيظهر للزبون في سجل محفظته..."
              className="w-full p-3 rounded-xl border border-brand-border bg-brand-surface text-xs font-medium text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-9.5 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-9.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? 'جارٍ الرفض...' : 'تأكيد الرفض'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
