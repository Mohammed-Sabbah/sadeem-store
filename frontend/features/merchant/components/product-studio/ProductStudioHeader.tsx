import React from 'react';
import Link from 'next/link';
import type { CategoryItem } from '@/features/store/services/taxonomy.service';
import type { StudioTab } from './ProductStudioTypes';
import {
  IconArrowRight,
  IconEye,
  IconEditPencil,
  IconChartBar,
  IconSliders,
  IconSettings,
  IconCheck,
  IconAlertTriangle,
} from './ProductStudioIcons';

interface ProductStudioHeaderProps {
  productId: string;
  name: string;
  primaryImage: string;
  categories: CategoryItem[];
  categoryId: string;
  isActive: boolean;
  isAnonymousVendor: boolean;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isSimple: boolean;
  variantsCount: number;
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  handleSaveProduct: () => void;
  isSaving: boolean;
  saveSuccessMessage: string | null;
  errorMessage: string | null;
}

export function ProductStudioHeader({
  productId,
  name,
  primaryImage,
  categories,
  categoryId,
  isActive,
  isAnonymousVendor,
  minPrice,
  maxPrice,
  totalStock,
  isSimple,
  variantsCount,
  activeTab,
  setActiveTab,
  handleSaveProduct,
  isSaving,
  saveSuccessMessage,
  errorMessage,
}: ProductStudioHeaderProps) {
  const currentCategory = categories.find((c) => c._id === categoryId);

  return (
    <div className="mb-6 space-y-4 font-almarai text-right">
      {/* Top Breadcrumb & Reference Meta */}
      <div className="flex items-center justify-between gap-3 text-xs text-brand-muted/80">
        <Link
          href="/merchant/dashboard"
          className="hover:text-brand-primary transition-colors flex items-center gap-1 font-bold"
        >
          <IconArrowRight className="w-3.5 h-3.5" />
          <span>كتالوج المتجر</span>
          <span className="text-brand-border mx-1">/</span>
          <span>{currentCategory?.title || 'عام'}</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="text-brand-muted">الرمز المرجعي:</span>
          <span className="font-mono text-brand-dark bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border/60">
            {productId.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Title, Photo & Global Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-surface shrink-0 shadow-2xs">
            <img src={primaryImage} alt={name} className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight leading-tight">
                {name || 'صنف بدون اسم'}
              </h1>
              {isActive ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-brand-trust-soft text-brand-trust border-brand-trust/30">
                  معروض بالمتجر
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-brand-surface text-brand-muted border-brand-border/60">
                  مخفي مؤقتاً
                </span>
              )}
              {isAnonymousVendor && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-zinc-100 text-zinc-600 border-zinc-200">
                  توريد مباشر (هوية المتجر مخفية)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs mt-1 text-brand-muted">
              <span className="font-black text-brand-dark">
                {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
              </span>
              <span>•</span>
              <span className="font-bold text-brand-trust">{totalStock} قطعة متوفرة</span>
              <span>•</span>
              <span>{isSimple ? 'صنف مفرد بسيط' : `${variantsCount} أصناف مصفوفية`}</span>
            </div>
          </div>
        </div>

        {/* Quick Header Navigation Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/product/${productId}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-brand-card hover:bg-brand-surface text-brand-dark text-xs font-bold border border-brand-border/80 transition-colors flex items-center gap-1.5 shadow-2xs active:scale-[0.97]"
            title="معاينة كيف يرى الزبون هذا الصنف في متجر سَدِيم"
          >
            <IconEye className="w-3.5 h-3.5 text-brand-muted" />
            <span>معاينة كزبون</span>
          </Link>

          {activeTab === 'overview' ? (
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <IconEditPencil className="w-3.5 h-3.5" />
              <span>تعديل الصنف</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>حفظ التعديلات</span>
            </button>
          )}
        </div>
      </div>

      {/* Apple-Style Fluid Segmented Control */}
      <div className="pt-2">
        <div className="w-full grid grid-cols-3 p-1 rounded-2xl bg-brand-surface/90 border border-brand-border/70 gap-1 sm:w-auto sm:inline-flex">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              activeTab === 'overview'
                ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            <IconChartBar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="truncate">نظرة عامة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              activeTab === 'editor'
                ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            <IconSliders className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span className="truncate">بيانات الصنف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              activeTab === 'settings'
                ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            <IconSettings className="w-3.5 h-3.5 text-brand-muted shrink-0" />
            <span className="truncate">الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Notifications Bar */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-brand-trust-soft text-brand-trust border border-brand-trust/30 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
