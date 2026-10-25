'use client';

import React from 'react';
import Link from 'next/link';
import type { ProductItem } from '../types/merchant.types';
import { formatProductPriceRange } from '../utils/merchantMetrics';
import { MerchantQuickStockStepper } from './MerchantQuickStockStepper';
import { MerchantVariantExpandRow } from './MerchantVariantExpandRow';

export interface MerchantProductTableRowProps {
  product: ProductItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDeleteProduct: (productId: string, name: string) => void;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
}

export const MerchantProductTableRow: React.FC<MerchantProductTableRowProps> = ({
  product,
  isExpanded,
  onToggleExpand,
  onToggleActive,
  onDeleteProduct,
  onQuickStockChange,
}) => {
  const p = product;
  const hasVariants = Boolean(p.variants && p.variants.length > 1);
  const priceLabel = formatProductPriceRange(p);

  return (
    <React.Fragment>
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
              onClick={onToggleExpand}
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
            <MerchantQuickStockStepper
              stock={p.totalStock ?? 0}
              onChange={(newStock) => onQuickStockChange?.(p._id, newStock)}
              size="md"
            />
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
              onClick={() => onDeleteProduct(p._id, p.name)}
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
        <MerchantVariantExpandRow
          product={p}
          colSpan={6}
          onQuickStockChange={onQuickStockChange}
        />
      )}
    </React.Fragment>
  );
};
