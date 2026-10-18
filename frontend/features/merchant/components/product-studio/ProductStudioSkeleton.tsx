import React from 'react';
import Link from 'next/link';
import { IconAlertTriangle, IconArrowRight } from './ProductStudioIcons';

export function ProductStudioSkeleton() {
  return (
    <div className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-almarai animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border/60">
        <div className="space-y-2">
          <div className="w-28 h-4 bg-brand-surface rounded-md" />
          <div className="w-64 h-7 bg-brand-surface rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-9 bg-brand-surface rounded-xl" />
          <div className="w-28 h-9 bg-brand-surface rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-72 h-10 bg-brand-surface rounded-xl" />

      {/* Content Skeleton Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-brand-card rounded-2xl border border-brand-border/40 p-6" />
          <div className="h-64 bg-brand-card rounded-2xl border border-brand-border/40 p-6" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-brand-card rounded-2xl border border-brand-border/40 p-6" />
          <div className="h-56 bg-brand-card rounded-2xl border border-brand-border/40 p-6" />
        </div>
      </div>
    </div>
  );
}

export function ProductStudioNotFound({ onBackLink = '/merchant/dashboard' }: { onBackLink?: string }) {
  return (
    <div className="max-w-md mx-auto p-8 text-center font-almarai text-right my-12">
      <div className="bg-brand-card p-6 rounded-2xl border border-brand-border/60 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-brand-surface mx-auto flex items-center justify-center text-brand-muted mb-3">
          <IconAlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-bold text-brand-dark mb-1">المنتج غير موجود</h2>
        <p className="text-xs text-brand-muted mb-4">قد يكون تم نقله أو حذفه من قبل إدارة المتجر.</p>
        <Link
          href={onBackLink}
          className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100"
        >
          <span>العودة للكتالوج</span>
          <IconArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
