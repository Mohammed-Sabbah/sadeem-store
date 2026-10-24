'use client';

import React from 'react';
import Link from 'next/link';
import {
  useAdminOverviewQuery,
  useAdminStoreMutations,
} from '@/features/admin/queries/useAdminQueries';
import { AdminPulseMetrics } from '@/features/admin/components/AdminPulseMetrics';
import { AdminRecentApplications } from '@/features/admin/components/AdminRecentApplications';

export default function AdminPage() {
  const { metrics, pendingStoresList, isLoading } = useAdminOverviewQuery();
  const { approveStore, rejectStore, isApproving, isRejecting } = useAdminStoreMutations();

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & Status Strip */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-trust animate-pulse" />
              <span className="text-xs font-bold text-brand-trust">منظومة سَدِيم المركزية متصلة بالكامل</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">
              محطة القيادة والمتابعة الميدانية
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              رقابة مركزية شاملة لكافة المتاجر والأصناف والتصنيفات النشطة في نطاق المحافظة الوسطى.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/admin/stores"
              className="px-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface text-brand-dark hover:bg-brand-card text-xs font-bold transition-all shadow-2xs"
            >
              شبكة المتاجر
            </Link>
            <Link
              href="/admin/products"
              className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover transition-all shadow-xs"
            >
              رقابة الكتالوج
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Operational Pulse Metrics */}
      <AdminPulseMetrics metrics={metrics} isLoading={isLoading} />

      {/* 3. Pending Store Applications Queue */}
      <AdminRecentApplications
        pendingStores={pendingStoresList}
        onApprove={approveStore}
        onReject={rejectStore}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />
    </div>
  );
}
