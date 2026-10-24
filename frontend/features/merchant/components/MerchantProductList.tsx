'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ProductItem } from '../types/merchant.types';
import {
  type FilterTab,
  computeFilterMetrics,
  filterProducts,
} from '../utils/productFilters';
import { useMerchantProductFilters } from '../hooks/useMerchantProductFilters';
import { MerchantProductFilterBar } from './MerchantProductFilterBar';

export type { FilterTab };

interface MerchantProductListProps {
  products: ProductItem[];
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenAddModal: () => void;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
  activeFilterTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;
}

export default function MerchantProductList({
  products,
  onToggleActive,
  onDeleteProduct,
  onOpenAddModal,
  onQuickStockChange,
  activeFilterTab,
  onTabChange,
}: MerchantProductListProps) {
  const [expandedVariantsId, setExpandedVariantsId] = useState<string | null>(null);

  const {
    activeTab,
    setTab,
    searchQuery,
    setSearchQuery,
    filterState,
  } = useMerchantProductFilters({
    controlledTab: activeFilterTab,
    onTabChange,
  });

  const filterMetrics = useMemo(() => computeFilterMetrics(products), [products]);
  const filteredProducts = useMemo(() => filterProducts(products, filterState), [products, filterState]);

  const confirmDelete = (productId: string, name: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف الصنف «${name}» نهائياً من المتجر؟`)) {
      onDeleteProduct(productId);
    }
  };

  const toggleVariantsExpand = (productId: string) => {
    setExpandedVariantsId((prev) => (prev === productId ? null : productId));
  };

  return (
    <div className="bg-brand-card rounded-xl border border-brand-border shadow-2xs font-almarai text-right overflow-hidden transition-all">
      {/* 1. Universal Search & Segmented Filter Bar */}
      <MerchantProductFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setTab}
        metrics={filterMetrics}
        filteredCount={filteredProducts.length}
      />

      {/* 3. Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 px-4 bg-brand-surface/30">
          <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <svg className="w-6 h-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد أصناف مطابقة</h3>
          <p className="text-xs text-brand-muted mb-5 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'لم يتم العثور على أي منتج يتطابق مع كلمة البحث.'
              : 'لم تقم بإضافة أي أصناف ضمن هذا التصنيف حتى الآن.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          >
            <span>+ إضافة صنف جديد</span>
          </button>
        </div>
      ) : (
        <div>
          {/* 4. Desktop View: High-Density World-Class Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-brand-surface/80 border-b border-brand-border text-brand-muted font-bold select-none">
                <tr>
                  <th className="py-3 px-5 w-20">الصورة</th>
                  <th className="py-3 px-4 min-w-[280px]">اسم الصنف / القسم</th>
                  <th className="py-3 px-4 w-36">السعر بالـ (₪)</th>
                  <th className="py-3 px-6 w-52">المخزون المتوفر</th>
                  <th className="py-3 px-4 w-32">حالة العرض</th>
                  <th className="py-3 px-4 w-20 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredProducts.map((p) => {
                  const hasVariants = p.variants && p.variants.length > 1;
                  const isExpanded = expandedVariantsId === p._id;
                  const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);
                  const effectiveVariants = activeVariants.length > 0 ? activeVariants : (p.variants || []);
                  const variantPrices = effectiveVariants
                    .map((v) => Number(v.price) || 0)
                    .filter((pr) => pr > 0);
                  const effectiveMin = variantPrices.length > 0 ? Math.min(...variantPrices) : (Number(p.minPrice) || 0);
                  const effectiveMax = variantPrices.length > 0 ? Math.max(...variantPrices) : (Number(p.maxPrice) || 0);
                  const priceLabel =
                    effectiveMin === effectiveMax
                      ? `${effectiveMin} ₪`
                      : `${effectiveMin} – ${effectiveMax} ₪`;

                  return (
                    <React.Fragment key={p._id}>
                      <tr className="hover:bg-brand-surface/60 transition-colors group">
                        {/* Image */}
                        <td className="py-3.5 px-5">
                          <div className="w-12 h-12 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0 relative shadow-2xs">
                            {p.images && p.images[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-muted text-[10px] font-bold">
                                سَدِيم
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-bold text-brand-muted">
                              {p.categoryTitle || 'صنف عام'}
                            </span>
                            {p.approveStatus === 'rejected' && (
                              <span className="text-[9px] font-extrabold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                موقوف إدارياً
                              </span>
                            )}
                            {p.isFeatured && (
                              <span className="text-[9px] font-extrabold text-brand-dark bg-brand-primary-soft px-1.5 py-0.2 rounded border border-brand-primary-border">
                                مميز
                              </span>
                            )}
                            {p.isAnonymousVendor && (
                              <span className="text-[9px] font-extrabold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                                توريد مباشر
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/merchant/products/${p._id}`}
                            className="text-sm font-black text-brand-dark block tracking-tight hover:text-brand-primary transition-colors cursor-pointer"
                          >
                            {p.name}
                          </Link>
                          <span className="text-[11px] font-bold text-brand-muted">
                            {hasVariants
                              ? `${p.variants?.length} متغيرات مختلفة`
                              : 'صنف موحد'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-black text-brand-dark bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border inline-block">
                            {priceLabel}
                          </span>
                        </td>

                        {/* Stock Management (Tactile Stepper or Expand Variants) */}
                        <td className="py-3.5 px-6">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => toggleVariantsExpand(p._id)}
                              className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs ${
                                p.inStock && (p.totalStock ?? 0) > 0
                                  ? 'text-brand-trust bg-brand-trust-soft hover:bg-brand-trust-soft/80 border-brand-trust/30'
                                  : 'text-brand-dark bg-brand-primary-soft hover:bg-brand-primary-soft/80 border-brand-primary-border'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.inStock && (p.totalStock ?? 0) > 0 ? 'bg-brand-trust' : 'bg-brand-primary'
                                }`}
                              />
                              <span>
                                {p.inStock && (p.totalStock ?? 0) > 0
                                  ? `${p.totalStock} قطعة`
                                  : 'المخزون نافد'}
                              </span>
                              <span className="text-[10px] opacity-75">
                                ({p.variants?.length} متغيرات {isExpanded ? '▲' : '▼'})
                              </span>
                            </button>
                          ) : (
                            /* Simple Product Direct Stepper */
                            <div className="inline-flex items-center gap-1 bg-brand-surface rounded-xl p-0.5 border border-brand-border shadow-2xs select-none">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = p.totalStock ?? 0;
                                  if (current > 0) onQuickStockChange?.(p._id, current - 1);
                                }}
                                disabled={(p.totalStock ?? 0) <= 0}
                                className="w-6 h-6 rounded-lg bg-brand-card text-brand-dark flex items-center justify-center font-black text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
                                title="إنقاص قطعة واحدة (-1)"
                              >
                                -
                              </button>

                              <div
                                className="px-2 text-xs font-black min-w-9 text-center text-brand-dark flex items-center justify-center gap-0.5"
                                title="الكمية المتوفرة"
                              >
                                <span>{p.totalStock ?? 0}</span>
                                <span className="text-[10px] font-medium text-brand-muted">ق</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const current = p.totalStock ?? 0;
                                  onQuickStockChange?.(p._id, current + 1);
                                }}
                                className="w-6 h-6 rounded-lg bg-brand-card text-brand-dark flex items-center justify-center font-black text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer shadow-2xs"
                                title="زيادة قطعة واحدة (+1)"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Visibility Switch */}
                        <td className="py-3.5 px-4">
                          {p.approveStatus === 'rejected' ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200 shadow-2xs"
                                title="تم إيقاف هذا الصنف إدارياً بواسطة إدارة سَدِيم"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                <span>موقوف إدارياً</span>
                              </span>
                              {p.rejectReason && (
                                <span
                                  className="text-[10px] text-red-600 font-medium max-w-[150px] truncate"
                                  title={`سبب الإيقاف: ${p.rejectReason}`}
                                >
                                  السبب: {p.rejectReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onToggleActive(p._id, p.isActive)}
                                className={`w-11 h-6 inline-flex items-center rounded-full p-0.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                                  p.isActive ? 'bg-brand-trust justify-start' : 'bg-brand-border justify-end'
                                }`}
                                title={p.isActive ? 'إخفاء المنتج مؤقتاً' : 'تفعيل ظهور المنتج'}
                              >
                                <span className="w-5 h-5 rounded-full bg-brand-card shadow-xs transition-transform duration-200" />
                              </button>
                              <span className="text-[11px] font-bold text-brand-muted">
                                {p.isActive ? 'معروض' : 'مخفي'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/merchant/products/${p._id}`}
                              className="p-2 rounded-xl text-brand-muted hover:text-brand-primary hover:bg-brand-primary-soft transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                              title="استوديو وتعديل الصنف"
                            >
                              <svg className="w-4 h-4 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Link>

                            <button
                              type="button"
                              onClick={() => confirmDelete(p._id, p.name)}
                              className="p-2 rounded-xl text-brand-muted hover:text-red-600 hover:bg-red-50 transition-all duration-150 active:scale-90 cursor-pointer"
                              title="حذف الصنف"
                            >
                              <svg className="w-4 h-4 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variants Row */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-brand-surface/90 border-b border-brand-border">
                          <td colSpan={6} className="py-4 px-6">
                            <div className="max-w-4xl mx-auto space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-brand-muted mb-2">
                                <span>متغيرات الصنف والمخزون التفصيلي:</span>
                                <span>يتم تحديث إجمالي المخزون آلياً فور تعديل أي متغير</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {p.variants?.map((v, vIdx) => {
                                  const attrText = v.attributes
                                    ? Object.values(v.attributes).join(' / ')
                                    : 'افتراضي';

                                  return (
                                    <div
                                      key={v._id || vIdx}
                                      className="bg-brand-card rounded-xl p-3 border border-brand-border flex items-center justify-between text-xs shadow-2xs"
                                    >
                                      <div className="min-w-0 flex-1 pl-2">
                                        <strong className="text-brand-dark block text-xs font-black truncate">
                                          {attrText}
                                        </strong>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px] font-black text-brand-dark">
                                            {v.price} ₪
                                          </span>
                                        </div>
                                      </div>

                                      {/* Variant Stepper */}
                                      <div className="inline-flex items-center bg-brand-surface rounded-lg p-0.5 border border-brand-border shadow-2xs select-none shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = v.stock ?? 0;
                                            if (current > 0) {
                                              onQuickStockChange?.(p._id, current - 1, v._id);
                                            }
                                          }}
                                          disabled={(v.stock ?? 0) <= 0}
                                          className="w-5 h-5 rounded-md bg-brand-card text-brand-dark flex items-center justify-center font-bold text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                        >
                                          -
                                        </button>

                                        <span className="px-1.5 text-xs font-black min-w-6 text-center text-brand-dark">
                                          {v.stock}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = v.stock ?? 0;
                                            onQuickStockChange?.(p._id, current + 1, v._id);
                                          }}
                                          className="w-5 h-5 rounded-md bg-brand-card text-brand-dark flex items-center justify-center font-bold text-xs hover:bg-brand-surface active:scale-90 transition-all cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Mobile & Tablet Card View: Ergonomic Thumb Navigation */}
          <div className="block lg:hidden divide-y divide-brand-border/40">
            {filteredProducts.map((p) => {
              const hasVariants = p.variants && p.variants.length > 1;
              const isExpanded = expandedVariantsId === p._id;
              const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);
              const effectiveVariants = activeVariants.length > 0 ? activeVariants : (p.variants || []);
              const variantPrices = effectiveVariants
                .map((v) => Number(v.price) || 0)
                .filter((pr) => pr > 0);
              const effectiveMin = variantPrices.length > 0 ? Math.min(...variantPrices) : (Number(p.minPrice) || 0);
              const effectiveMax = variantPrices.length > 0 ? Math.max(...variantPrices) : (Number(p.maxPrice) || 0);
              const priceLabel =
                effectiveMin === effectiveMax
                  ? `${effectiveMin} ₪`
                  : `${effectiveMin} – ${effectiveMax} ₪`;

              return (
                <div key={p._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted text-[10px] font-bold">
                            سَدِيم
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-brand-muted block mb-0.5">
                          {p.categoryTitle || 'صنف عام'}
                        </span>
                        <Link
                          href={`/merchant/products/${p._id}`}
                          className="text-xs sm:text-sm font-black text-brand-dark truncate block mb-1 hover:text-brand-primary transition-colors cursor-pointer"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-brand-dark bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">
                            {priceLabel}
                          </span>
                          {p.approveStatus === 'rejected' && (
                            <span className="text-[9px] font-extrabold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              موقوف إدارياً
                            </span>
                          )}
                          {p.isAnonymousVendor && (
                            <span className="text-[9px] font-extrabold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                              توريد مباشر
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/merchant/products/${p._id}`}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                        title="استوديو الصنف"
                      >
                        <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <button
                        type="button"
                        onClick={() => confirmDelete(p._id, p.name)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-red-600 transition-colors cursor-pointer"
                        title="حذف الصنف"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Operational Mobile Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-border/40">
                    {/* Stock Pill / Stepper */}
                    {hasVariants ? (
                      <button
                        type="button"
                        onClick={() => toggleVariantsExpand(p._id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-primary-soft text-brand-dark border border-brand-primary-border active:scale-95 transition-all"
                      >
                        {p.totalStock} ق ({p.variants?.length} متغيرات ▾)
                      </button>
                    ) : (
                      <div className="inline-flex items-center bg-brand-surface rounded-xl p-1 border border-brand-border select-none">
                        <button
                          type="button"
                          onClick={() => {
                            const current = p.totalStock ?? 0;
                            if (current > 0) onQuickStockChange?.(p._id, current - 1);
                          }}
                          disabled={(p.totalStock ?? 0) <= 0}
                          className="w-8 h-8 rounded-lg bg-brand-card text-brand-dark font-bold text-sm flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="إنقاص المخزون"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-black min-w-9 text-center text-brand-dark">
                          {p.totalStock ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = p.totalStock ?? 0;
                            onQuickStockChange?.(p._id, current + 1);
                          }}
                          className="w-8 h-8 rounded-lg bg-brand-card text-brand-dark font-bold text-sm flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                          aria-label="زيادة المخزون"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Toggle Active */}
                    {p.approveStatus === 'rejected' ? (
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200 shadow-2xs"
                          title="تم إيقاف هذا الصنف إدارياً بواسطة إدارة سَدِيم"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                          <span>موقوف إدارياً</span>
                        </span>
                        {p.rejectReason && (
                          <span
                            className="text-[10px] text-red-600 font-medium max-w-[160px] truncate"
                            title={`سبب الإيقاف: ${p.rejectReason}`}
                          >
                            السبب: {p.rejectReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleActive(p._id, p.isActive)}
                          className={`w-11 h-6 inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer active:scale-95 ${
                            p.isActive ? 'bg-brand-trust justify-start' : 'bg-brand-border justify-end'
                          }`}
                          title={p.isActive ? 'تعطيل ظهور المنتج' : 'تفعيل ظهور المنتج'}
                        >
                          <span className="w-5 h-5 rounded-full bg-brand-card shadow-2xs transition-transform" />
                        </button>
                        <span className="text-[11px] font-bold text-brand-muted">
                          {p.isActive ? 'معروض' : 'مخفي'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Variants Drawer on Mobile */}
                  {hasVariants && isExpanded && (
                    <div className="pt-2 border-t border-brand-border/40 space-y-2">
                      {p.variants?.map((v, vIdx) => (
                        <div
                          key={v._id || vIdx}
                          className="bg-brand-surface p-2.5 rounded-xl border border-brand-border flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-brand-dark block text-xs">
                              {v.attributes ? Object.values(v.attributes).join(' / ') : 'افتراضي'}
                            </span>
                            <span className="text-[11px] text-brand-muted font-bold">{v.price} ₪</span>
                          </div>

                          <div className="inline-flex items-center bg-brand-card rounded-lg p-0.5 border border-brand-border shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                const current = v.stock ?? 0;
                                if (current > 0) onQuickStockChange?.(p._id, current - 1, v._id);
                              }}
                              disabled={(v.stock ?? 0) <= 0}
                              className="w-7 h-7 rounded-md bg-brand-surface text-brand-dark font-bold text-xs flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-black min-w-6 text-center text-brand-dark">
                              {v.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = v.stock ?? 0;
                                onQuickStockChange?.(p._id, current + 1, v._id);
                              }}
                              className="w-7 h-7 rounded-md bg-brand-surface text-brand-dark font-bold text-xs flex items-center justify-center active:scale-90 transition-transform"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
