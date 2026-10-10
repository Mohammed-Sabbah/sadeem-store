'use client';

import React from 'react';
import type { MerchantMetrics } from '../types/merchant.types';

interface MerchantMetricsBarProps {
  metrics: MerchantMetrics;
  onFilterLowStock?: () => void;
}

export default function MerchantMetricsBar({ metrics, onFilterLowStock }: MerchantMetricsBarProps) {
  const hasOutOfStock = metrics.outOfStockProducts > 0;

  return (
    <div className="bg-brand-card rounded-xl border border-brand-border px-4 py-3 sm:px-5 sm:py-3.5 font-almarai text-right shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Editorial Metrics Strip (Zero nested box clutter) */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {/* Total Catalog Items */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-bold">الأصناف:</span>
            <span className="font-black text-brand-dark text-sm">{metrics.totalProducts}</span>
          </div>

          <span className="text-brand-border hidden sm:inline">•</span>

          {/* In Stock */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-bold">متوفر للطلب:</span>
            <span className="font-black text-brand-trust text-sm">{metrics.inStockProducts}</span>
          </div>

          <span className="text-brand-border hidden sm:inline">•</span>

          {/* Physical Inventory Units */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-bold">قطع المستودع:</span>
            <span className="font-black text-brand-dark text-sm">{metrics.totalInventoryUnits}</span>
          </div>
        </div>

        {/* Operational Status / Quick Filter Action */}
        <div className="w-full sm:w-auto flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border/40">
          {hasOutOfStock ? (
            <button
              type="button"
              onClick={onFilterLowStock}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary-soft hover:bg-brand-primary-soft/80 text-brand-dark border border-brand-primary-border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="تصفية الجدول لعرض الأصناف التي نفد مخزونها وتحتاج لتوريد"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span>{metrics.outOfStockProducts} أصناف نفد مخزونها</span>
              <span className="text-[10px] text-brand-primary font-bold">تصفية ▾</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-trust bg-brand-trust-soft px-2.5 py-1 rounded-lg border border-brand-trust/30">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-trust" />
              <span>المخزون مكتمل بالكامل</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
