'use client';

import React from 'react';
import type { ProductEditorMode } from '../../types/product-studio.types';

interface ProductEditorBottomBarProps {
  mode: ProductEditorMode;
  isDirty?: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ProductEditorBottomBar({
  mode,
  isDirty,
  isSubmitting,
  onCancel,
  onSubmit,
}: ProductEditorBottomBarProps) {
  const isSaveDisabled = isSubmitting || (mode === 'edit' && !isDirty);

  return (
    <div className="sticky bottom-4 z-40 max-w-4xl mx-auto px-4">
      <div className="bg-brand-dark/95 text-white backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              mode === 'create'
                ? 'bg-amber-400 animate-pulse'
                : isDirty
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <div className="text-right">
            <p className="text-xs font-black">
              {mode === 'create'
                ? 'إنشاء صنف جديد'
                : isDirty
                ? 'توجد تعديلات غير محفوظة'
                : 'كافة التعديلات محفوظة'}
            </p>
            <p className="text-[10px] text-zinc-400">
              {mode === 'create'
                ? 'سيتم نشر الصنف في كتالوج المتجر فور الحفظ'
                : isDirty
                ? 'انقر لحفظ التعديلات في قاعدة البيانات'
                : 'البيانات المعروضة متطابقة مع الكتالوج'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-3.5 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-bold text-zinc-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaveDisabled}
            className={`h-9 px-5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              isSaveDisabled
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                : 'bg-brand-primary hover:bg-brand-primary-hover text-white active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>{mode === 'create' ? 'حفظ ونشر الصنف' : 'حفظ التعديلات'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
