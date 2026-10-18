import React from 'react';
import type { StudioTab } from './ProductStudioTypes';

interface ProductStudioFloatingBarProps {
  name: string;
  variantsCount: number;
  totalStock: number;
  isAnonymousVendor: boolean;
  isDirty?: boolean;
  isSaving: boolean;
  handleSaveProduct: () => void;
  setActiveTab: (tab: StudioTab) => void;
}

export function ProductStudioFloatingBar({
  name,
  variantsCount,
  totalStock,
  isAnonymousVendor,
  isDirty,
  isSaving,
  handleSaveProduct,
  setActiveTab,
}: ProductStudioFloatingBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:right-68 z-40 bg-brand-card/95 backdrop-blur-xl border-t border-brand-border/70 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xl font-almarai text-right">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-brand-muted">
          <span>الصنف:</span>
          <span className="font-bold text-brand-dark">{name || 'بدون اسم'}</span>
          <span>•</span>
          <span>{variantsCount} أصناف</span>
          <span>•</span>
          <span className="font-bold text-brand-trust">{totalStock} قطعة بالمخزون</span>
          {isAnonymousVendor && (
            <>
              <span>•</span>
              <span className="text-zinc-600 font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                توريد مباشر
              </span>
            </>
          )}
          {isDirty && (
            <>
              <span>•</span>
              <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                تعديلات غير محفوظة
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="px-4 py-2.5 rounded-xl border border-brand-border/80 text-brand-dark text-xs font-bold hover:bg-brand-surface active:scale-[0.97] transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSaveProduct}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] shadow-xs transition-transform duration-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>حفظ التعديلات في المتجر</span>
          </button>
        </div>
      </div>
    </div>
  );
}
