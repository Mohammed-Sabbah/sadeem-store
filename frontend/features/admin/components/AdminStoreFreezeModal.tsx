'use client';

import React, { useState, useEffect } from 'react';

interface AdminStoreFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  storeName: string;
  isSubmitting?: boolean;
}

const FREEZE_REASON_PRESETS = [
  'إغلاق مؤقت بناءً على طلب التاجر',
  'مخالفة معايير التسعير أو التوصيل الموحد',
  'شكاوى متكررة من الزبائن حول جودة المنتجات',
  'تأخر مستمر في تسليم الطرود لمندوب سَدِيم',
];

export const AdminStoreFreezeModal: React.FC<AdminStoreFreezeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  storeName,
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
      setError('يرجى توضيح سبب التجميد ليظهر للتاجر');
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
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs text-lg">
          ❄️
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-brand-dark">تجميد متجر &laquo;{storeName}&raquo;</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            سيتم إيقاف ظهور المتجر واستقبال أي طلبات جديدة منه مؤقتاً في المحافظة الوسطى.
          </p>
        </div>

        {/* Quick Reason Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-brand-muted block">أسباب تجميد شائعة:</span>
          <div className="flex flex-wrap gap-1.5">
            {FREEZE_REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  if (error) setError('');
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-surface border border-brand-border text-brand-dark hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              نص سبب التجميد (لتوثيقه وإظهاره للتاجر):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="اكتب سبب تجميد المتجر بدقة أو اختر من الأسباب الجاهزة..."
              className="w-full p-3 text-xs font-medium rounded-xl border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
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
              className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ التجميد...</span>
                </>
              ) : (
                <span>تأكيد تجميد المتجر</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
