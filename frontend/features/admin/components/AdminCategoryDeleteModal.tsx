'use client';

import React, { useEffect } from 'react';

interface AdminCategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryTitle: string;
  isDeleting?: boolean;
}

export const AdminCategoryDeleteModal: React.FC<AdminCategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryTitle,
  isDeleting = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in select-none font-almarai"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="bg-brand-card rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto shadow-2xs">
          <svg className="w-5 h-5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-sm font-black text-brand-dark">تأكيد حذف الفئة</h3>
          <p className="text-xs text-brand-muted leading-relaxed">
            هل أنت متأكد من رغبتك في حذف الفئة &laquo;{categoryTitle}&raquo;؟ لن يتم الحذف إذا كانت هناك أصناف مرتبطة بها في المتجر.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
          </button>
        </div>
      </div>
    </div>
  );
};
