'use client';

import React from 'react';
import Link from 'next/link';
import type { AdminOverviewMetrics } from '../types/admin.types';

interface AdminPulseMetricsProps {
  metrics: AdminOverviewMetrics;
  isLoading?: boolean;
}

export const AdminPulseMetrics: React.FC<AdminPulseMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-brand-card border border-brand-border p-5 flex flex-col justify-between animate-pulse"
            >
              <div className="w-24 h-3.5 rounded bg-brand-surface" />
              <div className="w-16 h-8 rounded bg-brand-surface" />
              <div className="w-32 h-3 rounded bg-brand-surface" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-almarai select-none">
      {/* 1. Core Pillar Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stores Card */}
        <Link
          href="/admin/stores"
          className="bg-brand-card hover:bg-brand-surface/70 rounded-2xl border border-brand-border p-5 flex flex-col justify-between transition-all duration-150 active:scale-98 shadow-2xs hover:shadow-xs group"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-brand-muted">
              شبكة المتاجر الشريكة
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
              <svg className="w-4 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark tracking-tight">
                {metrics.totalStores}
              </span>
              <span className="text-xs font-bold text-brand-muted">متجر مسجل</span>
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
            {metrics.pendingStores > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-black text-brand-primary">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                <span>{metrics.pendingStores} بانتظار الاعتماد</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-brand-trust">
                <span className="w-2 h-2 rounded-full bg-brand-trust" />
                <span>{metrics.activeStores} متجر نشط</span>
              </span>
            )}
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors font-bold">
              إدارة &larr;
            </span>
          </div>
        </Link>

        {/* Catalog & Inventory Card */}
        <Link
          href="/admin/products"
          className="bg-brand-card hover:bg-brand-surface/70 rounded-2xl border border-brand-border p-5 flex flex-col justify-between transition-all duration-150 active:scale-98 shadow-2xs hover:shadow-xs group"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-brand-muted">
              رقابة الكتالوج والأصناف
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
              <svg className="w-4 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark tracking-tight">
                {metrics.totalProducts}
              </span>
              <span className="text-xs font-bold text-brand-muted">صنف في المنظومة</span>
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
            {metrics.outOfStockProducts > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-black text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>{metrics.outOfStockProducts} صنف نافد من السوق</span>
              </span>
            ) : metrics.rejectedProducts > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-black text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{metrics.rejectedProducts} صنف موقوف إدارياً</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-brand-trust">
                <span className="w-2 h-2 rounded-full bg-brand-trust" />
                <span>كافة الأصناف معتمدة ومتوفرة</span>
              </span>
            )}
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors font-bold">
              استعراض &larr;
            </span>
          </div>
        </Link>

        {/* Categories Card */}
        <Link
          href="/admin/categories"
          className="bg-brand-card hover:bg-brand-surface/70 rounded-2xl border border-brand-border p-5 flex flex-col justify-between transition-all duration-150 active:scale-98 shadow-2xs hover:shadow-xs group"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-brand-muted">
              الفئات والسمات التجارية
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
              <svg className="w-4 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark tracking-tight">
                {metrics.totalCategories}
              </span>
              <span className="text-xs font-bold text-brand-muted">فئة تجارية</span>
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-bold text-brand-trust">
              <span className="w-2 h-2 rounded-full bg-brand-trust" />
              <span>{metrics.activeCategories} فئة نشطة بالمتجر</span>
            </span>
            <span className="text-brand-muted group-hover:text-brand-primary transition-colors font-bold">
              تهيئة &larr;
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Secondary Financial & Geographic Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Payable Balances Card (5 cols) */}
        <div className="lg:col-span-5 bg-brand-card rounded-2xl border border-brand-border p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-muted block">
                مستحقات شبكة المتاجر الإجمالية
              </span>
              <span className="text-[10px] text-brand-muted">
                إجمالي الأرصدة النقدية المستحقة للتجار في المحافظة الوسطى
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border text-brand-dark flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
              ₪
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-dark tracking-tight">
                {metrics.totalPayableBalance.toLocaleString()}
              </span>
              <span className="text-xs font-black text-brand-trust">شيكل مستحق</span>
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-brand-muted">
              حالة التسويات: منتظمة
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
              الدفع عند الاستلام + جوال باي
            </span>
          </div>
        </div>

        {/* Geographic Distribution Card (7 cols) */}
        <div className="lg:col-span-7 bg-brand-card rounded-2xl border border-brand-border p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-3 border-b border-brand-border/60 pb-2.5">
            <div>
              <span className="text-xs font-black text-brand-dark block">
                توزيع المتاجر على مدن المحافظة الوسطى
              </span>
              <span className="text-[10px] text-brand-muted">
                مؤشر التغطية الميدانية والشحن الموحد 8 ₪
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              5 مدن نشطة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3">
            {(metrics.storesByCity || []).map((c) => (
              <div
                key={c.city}
                className="p-2 rounded-xl bg-brand-surface border border-brand-border/80 text-center space-y-0.5"
              >
                <span className="text-[10px] font-bold text-brand-muted block truncate" title={c.city}>
                  {c.city}
                </span>
                <span className="text-sm font-black text-brand-dark block">
                  {c.count} <span className="text-[9px] font-normal text-brand-muted">متجر</span>
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
            <span className="text-brand-trust font-bold">
              طرد موحد بمندوب واحد لكافة المدن
            </span>
            <span className="text-[10px] font-mono text-brand-muted">
              سَدِيم 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
