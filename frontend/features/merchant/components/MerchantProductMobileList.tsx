'use client';

import React from 'react';
import Link from 'next/link';
import type { ProductItem } from '../types/merchant.types';
import { formatProductPriceRange } from '../utils/merchantMetrics';
import { MerchantQuickStockStepper } from './MerchantQuickStockStepper';

export interface MerchantProductMobileListProps {
  products: ProductItem[];
  expandedVariantsId: string | null;
  onToggleExpand: (productId: string) => void;
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDeleteProduct: (productId: string, name: string) => void;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
}

export const MerchantProductMobileList: React.FC<MerchantProductMobileListProps> = ({
  products,
  expandedVariantsId,
  onToggleExpand,
  onToggleActive,
  onDeleteProduct,
  onQuickStockChange,
}) => {
  return (
    <div className="block lg:hidden divide-y divide-brand-border/40">
      {products.map((p) => {
        const hasVariants = Boolean(p.variants && p.variants.length > 1);
        const isExpanded = expandedVariantsId === p._id;
        const priceLabel = formatProductPriceRange(p);

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
                  onClick={() => onDeleteProduct(p._id, p.name)}
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
                  onClick={() => onToggleExpand(p._id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-primary-soft text-brand-dark border border-brand-primary-border active:scale-95 transition-all"
                >
                  {p.totalStock} ق ({p.variants?.length} متغيرات ▾)
                </button>
              ) : (
                <MerchantQuickStockStepper
                  stock={p.totalStock ?? 0}
                  onChange={(newStock) => onQuickStockChange?.(p._id, newStock)}
                  size="lg"
                />
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

                    <MerchantQuickStockStepper
                      stock={v.stock ?? 0}
                      onChange={(newStock) => onQuickStockChange?.(p._id, newStock, v._id)}
                      size="sm"
                      showUnit={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
