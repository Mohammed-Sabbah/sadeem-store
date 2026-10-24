'use client';

import React, { useState, useEffect } from 'react';

interface AdminProductRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  productTitle: string;
  isSubmitting?: boolean;
}

export const AdminProductRejectModal: React.FC<AdminProductRejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productTitle,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('يرجى كتابة سبب الإيقاف لتوضيحه للتاجر');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in select-none font-almarai"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-brand-card rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-brand-border text-right relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto shadow-2xs">
          <svg className="w-6 h-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-brand-dark">إيقاف وتجميد الصنف إدارياً</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            سيتم حظر عرض الصنف &laquo;{productTitle}&raquo; فوراً من المتجر ولن يتمكن الزبائن من طلبه.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              سبب الإيقاف (سيظهر للتاجر في لوحة تحكمه):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: مخالفة معايير التسعير، أو صور غير واضحة، أو عدم مطابقة الوصف..."
              className="w-full p-3 text-xs font-medium rounded-xl border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            {error && <p className="text-[11px] font-bold text-red-600">{error}</p>}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'جارٍ الإيقاف...' : 'تأكيد الإيقاف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
