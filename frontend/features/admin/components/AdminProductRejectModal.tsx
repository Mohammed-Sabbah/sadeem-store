'use client';

import React, { useState, useEffect } from 'react';

interface AdminProductRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  productTitle: string;
  isSubmitting?: boolean;
}

const REJECT_REASON_PRESETS = [
  'بيانات أو صور المنتج غير واضحة',
  'مخالفة معايير التسعير أو التوصيل',
  'عدم مطابقة لمواصفات الفئة التجارية',
  'صنف مكرر أو منتهي الصلاحية',
];

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

        {/* Quick Reason Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-brand-muted block">أسباب شائعة جاهزة:</span>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  if (error) setError('');
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-surface border border-brand-border text-brand-dark hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              نص سبب الإيقاف (سيظهر للتاجر في لوحة تحكمه):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="اكتب سبب الإيقاف بدقة أو اختر من الأسباب الجاهزة أعلاه..."
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
              className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ الإيقاف...</span>
                </>
              ) : (
                <span>تأكيد الإيقاف والتجميد</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
