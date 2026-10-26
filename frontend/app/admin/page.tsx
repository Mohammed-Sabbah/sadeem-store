'use client';

import React, { useState } from 'react';
import {
  useAdminOverviewQuery,
  useAdminStoreMutations,
} from '@/features/admin/queries/useAdminQueries';
import { AdminPulseMetrics } from '@/features/admin/components/AdminPulseMetrics';
import { AdminRecentApplications } from '@/features/admin/components/AdminRecentApplications';

export default function AdminPage() {
  const { metrics, pendingStoresList, isLoading, refetch } = useAdminOverviewQuery();
  const { approveStore, rejectStore, isApproving, isRejecting } = useAdminStoreMutations();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('الآن');

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    const now = new Date();
    setLastRefreshed(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & Strict Refresh Trigger */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs relative overflow-hidden">
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
              رقابة مركزية موحدة لكافة المتاجر والأصناف والتصنيفات في نطاق المحافظة الوسطى.
            </p>
          </div>

          {/* Operational Refresh Trigger Only (No redundant navigation links) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface text-brand-dark hover:bg-brand-card text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
              title="تحديث البيانات الميدانية الحية"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-primary' : 'text-brand-muted'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث البيانات الميدانية'}</span>
              <span className="text-[10px] text-brand-muted font-normal">({lastRefreshed})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Operational Pulse Metrics */}
      <AdminPulseMetrics metrics={metrics} isLoading={isLoading} />

      {/* 3. Conditional Pending Store Applications (Only shown when pending exists) */}
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
