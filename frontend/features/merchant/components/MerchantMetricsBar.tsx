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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-almarai text-right select-none">
      {/* 1. Total Catalog Items */}
      <div className="bg-brand-card rounded-2xl border border-brand-border/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-bold text-brand-muted">إجمالي الأصناف</span>
          <div className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center text-brand-dark/70 border border-brand-border/60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">{metrics.totalProducts}</span>
            <span className="text-[11px] font-bold text-brand-muted">صنف</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-brand-muted/80 mt-1">مسجلة في كتالوج المتجر</p>
        </div>
      </div>

      {/* 2. In-Stock & Ready for Immediate Delivery */}
      <div className="bg-brand-card rounded-2xl border border-brand-border/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-bold text-brand-muted">جاهز للطلب الفوري</span>
          <div className="w-8 h-8 rounded-xl bg-brand-trust-soft flex items-center justify-center text-brand-trust border border-brand-trust/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-brand-trust tracking-tight">{metrics.inStockProducts}</span>
            <span className="text-[11px] font-bold text-brand-muted">صنف متوفر</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-trust" />
            <span className="text-[10px] sm:text-[11px] font-bold text-brand-trust">تسليم فوري بالوسطى</span>
          </div>
        </div>
      </div>

      {/* 3. Out of Stock / Restock Alert */}
      <div
        className={`bg-brand-card rounded-2xl border p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
          hasOutOfStock ? 'border-brand-primary-border bg-brand-primary-soft/30' : 'border-brand-border/80'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-bold text-brand-muted">تنبيه النواقص</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              hasOutOfStock
                ? 'bg-brand-primary-soft text-brand-primary border-brand-primary-border'
                : 'bg-brand-surface text-brand-muted border-brand-border/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                hasOutOfStock ? 'text-brand-primary' : 'text-brand-dark'
              }`}
            >
              {metrics.outOfStockProducts}
            </span>
            <span className="text-[11px] font-bold text-brand-muted">بحاجة لتوريد</span>
          </div>
          {hasOutOfStock ? (
            <button
              type="button"
              onClick={onFilterLowStock}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-primary text-white text-[10px] sm:text-[11px] font-bold hover:bg-brand-primary-hover active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <span>فلترة للمراجعة</span>
              <span className="text-[9px]">▾</span>
            </button>
          ) : (
            <p className="text-[10px] sm:text-[11px] text-brand-trust font-bold mt-1">المخزون مكتمل بالكامل ✓</p>
          )}
        </div>
      </div>

      {/* 4. Physical Warehouse Units */}
      <div className="bg-brand-card rounded-2xl border border-brand-border/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-bold text-brand-muted">قطع المستودع</span>
          <div className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center text-brand-dark/70 border border-brand-border/60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">{metrics.totalInventoryUnits}</span>
            <span className="text-[11px] font-bold text-brand-muted">قطعة فعلية</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-brand-muted/80 mt-1">شحن موحد 8 ₪ للزبون</p>
        </div>
      </div>
    </div>
  );
}

