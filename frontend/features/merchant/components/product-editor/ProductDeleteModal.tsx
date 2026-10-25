'use client';

import React from 'react';

interface ProductDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  productTitle: string;
}

export function ProductDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  productTitle,
}: ProductDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai">
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg mx-auto">
          🗑️
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-black text-brand-dark">تأكيد حذف الصنف</h3>
          <p className="text-xs text-brand-muted">
            هل أنت متأكد من حذف الصنف &quot;{productTitle}&quot;؟ سيتم إزالته من المتجر نهائياً ولا يمكن التراجع.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
          </button>
        </div>
      </div>
    </div>
  );
}
