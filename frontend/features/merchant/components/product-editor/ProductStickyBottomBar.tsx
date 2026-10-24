'use client';

import React from 'react';
import Link from 'next/link';
import type { ProductEditorMode } from '../../types/product-studio.types';

interface ProductStickyBottomBarProps {
  mode: ProductEditorMode;
  hasVariantsUnderTheHood: boolean;
  enabledVariantsCount: number;
  isDirty: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductStickyBottomBar({
  mode,
  hasVariantsUnderTheHood,
  enabledVariantsCount,
  isDirty,
  isSubmitting,
  onSubmit,
}: ProductStickyBottomBarProps) {
  if (mode === 'create') {
    return (
      <footer className="fixed bottom-0 left-0 right-0 lg:right-68 bg-white/95 backdrop-blur-md border-t border-brand-border/80 px-4 sm:px-8 py-3.5 z-20 shadow-lg font-almarai text-right">
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <Link
            href="/merchant/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand-muted hover:text-brand-dark border border-brand-border hover:bg-brand-surface transition-all"
          >
            إلغاء والعودة
          </Link>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-64 py-3 px-6 rounded-xl bg-brand-primary text-white text-xs sm:text-sm font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ نشر الصنف في سَدِيم...</span>
              </>
            ) : (
              <span>نشر الصنف في سَدِيم</span>
            )}
          </button>
        </div>
      </footer>
    );
  }

  return (
    <div className="fixed bottom-0 lg:right-68 right-0 left-0 z-30 bg-white/95 backdrop-blur-md border-t border-brand-border/80 p-3 sm:p-4 shadow-lg font-almarai text-right">
      <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-brand-dark">
            {hasVariantsUnderTheHood ? `الأصناف المعروضة: ${enabledVariantsCount}` : 'صنف موحد'}
          </span>
          {isDirty ? (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>توجد تعديلات غير محفوظة</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 hidden sm:inline-flex items-center gap-1">
              <span>✓ كافة التعديلات محفوظة</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!isDirty || isSubmitting}
          className={`h-10 px-7 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2 ${
            !isDirty || isSubmitting
              ? 'bg-brand-surface border border-brand-border text-brand-muted/60 cursor-not-allowed shadow-none'
              : 'bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-95 cursor-pointer shadow-xs'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جارٍ الحفظ...</span>
            </>
          ) : (
            <span>حفظ التعديلات</span>
          )}
        </button>
      </div>
    </div>
  );
}
