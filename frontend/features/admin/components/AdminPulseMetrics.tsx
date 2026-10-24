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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-brand-card border border-brand-border p-5 flex items-center justify-between animate-pulse"
          >
            <div className="space-y-2 flex-1">
              <div className="w-20 h-3 rounded bg-brand-surface" />
              <div className="w-14 h-7 rounded bg-brand-surface" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-surface" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-almarai select-none">
      {/* 1. Stores Card */}
      <Link
        href="/admin/stores"
        className="bg-brand-card hover:bg-brand-surface/60 rounded-2xl border border-brand-border p-5 flex items-center justify-between transition-all duration-150 active:scale-98 shadow-2xs group"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-brand-muted block">
            شبكة المتاجر
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-dark">
              {metrics.totalStores}
            </span>
            <span className="text-xs font-bold text-brand-muted">متجر</span>
          </div>
          {metrics.pendingStores > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              {metrics.pendingStores} طلبات معلقة
            </span>
          ) : (
            <span className="text-[10px] font-bold text-brand-trust">
              {metrics.activeStores} متجر نشط
            </span>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
          <svg className="w-5 h-5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </Link>

      {/* 2. Products Card */}
      <Link
        href="/admin/products"
        className="bg-brand-card hover:bg-brand-surface/60 rounded-2xl border border-brand-border p-5 flex items-center justify-between transition-all duration-150 active:scale-98 shadow-2xs group"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-brand-muted block">
            رقابة الكتالوج والأصناف
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-dark">
              {metrics.totalProducts}
            </span>
            <span className="text-xs font-bold text-brand-muted">صنف</span>
          </div>
          {metrics.rejectedProducts > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {metrics.rejectedProducts} موقوف إدارياً
            </span>
          ) : (
            <span className="text-[10px] font-bold text-brand-trust">
              جميع الأصناف معتمدة
            </span>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
          <svg className="w-5 h-5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </Link>

      {/* 3. Categories Card */}
      <Link
        href="/admin/categories"
        className="bg-brand-card hover:bg-brand-surface/60 rounded-2xl border border-brand-border p-5 flex items-center justify-between transition-all duration-150 active:scale-98 shadow-2xs group"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-brand-muted block">
            الفئات والقطاعات
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-dark">
              {metrics.totalCategories}
            </span>
            <span className="text-xs font-bold text-brand-muted">قسم</span>
          </div>
          <span className="text-[10px] font-bold text-brand-muted">
            {metrics.activeCategories} قطاع نشط بالمتجر
          </span>
        </div>

        <div className="w-11 h-11 rounded-xl bg-brand-surface border border-brand-border text-brand-muted group-hover:text-brand-primary group-hover:bg-brand-primary-soft flex items-center justify-center transition-colors shadow-2xs">
          <svg className="w-5 h-5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
      </Link>
    </div>
  );
};
