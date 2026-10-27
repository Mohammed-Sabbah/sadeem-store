'use client';

import React, { useState } from 'react';
import {
  useAdminWalletTransactionsQuery,
  useAdminWalletPendingCountQuery,
  useAdminWalletMutations,
} from '@/features/admin/queries/useAdminQueries';
import { AdminWalletMasterDetail } from '@/features/admin/components/AdminWalletMasterDetail';
import { AdminWalletLedgerTable } from '@/features/admin/components/AdminWalletLedgerTable';

export default function AdminWalletPage() {
  const [viewMode, setViewMode] = useState<'pending' | 'ledger'>('pending');

  const { data: pendingStats, isLoading: isLoadingPending, refetch: refetchPending } =
    useAdminWalletPendingCountQuery();

  const { data: allTransactionsRes, isLoading: isLoadingAll, refetch: refetchAll } =
    useAdminWalletTransactionsQuery(viewMode === 'ledger' ? { limit: 100 } : undefined);

  const {
    approveDeposit,
    isApprovingDeposit,
    rejectDeposit,
    isRejectingDeposit,
    approveWithdrawal,
    isApprovingWithdrawal,
    rejectWithdrawal,
    isRejectingWithdrawal,
  } = useAdminWalletMutations();

  const isBusy =
    isApprovingDeposit ||
    isRejectingDeposit ||
    isApprovingWithdrawal ||
    isRejectingWithdrawal;

  const pendingItems = pendingStats?.pendingItems || [];
  const allTransactions = allTransactionsRes?.data || [];

  const handleRefresh = () => {
    refetchPending();
    if (viewMode === 'ledger') {
      refetchAll();
    }
  };

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & View Toggles */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">
              المحفظة والتدقيق المالي
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              حوكمة العمليات المالية وتدقيق إيصالات الشحن البنكي وجوال باي واعتماد الأرصدة والسحوبات للزبائن والتجار.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isBusy}
              className="h-9 px-3.5 rounded-xl border border-brand-border bg-brand-surface text-brand-dark hover:bg-brand-card text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="تحديث البيانات"
            >
              <svg className="w-3.5 h-3.5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
          <button
            type="button"
            onClick={() => setViewMode('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'pending'
                ? 'bg-brand-dark text-white shadow-2xs'
                : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
            }`}
          >
            <span>طلبات بانتظار التدقيق</span>
            {(pendingStats?.totalPendingCount || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black leading-none">
                {pendingStats?.totalPendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'ledger'
                ? 'bg-brand-dark text-white shadow-2xs'
                : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
            }`}
          >
            <span>سجل المعاملات العام</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Workspace */}
      {viewMode === 'pending' ? (
        isLoadingPending ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-brand-muted">جارٍ تحميل طلبات المحفظة المعلقة...</p>
          </div>
        ) : (
          <AdminWalletMasterDetail
            pendingTransactions={pendingItems}
            onApproveDeposit={(id, amount) => approveDeposit({ transactionId: id, amount })}
            onRejectDeposit={(id, reason) => rejectDeposit({ transactionId: id, rejectReason: reason })}
            onApproveWithdrawal={(id, ref) => approveWithdrawal({ transactionId: id, payoutReference: ref })}
            onRejectWithdrawal={(id, reason) => rejectWithdrawal({ transactionId: id, rejectReason: reason })}
            isBusy={isBusy}
          />
        )
      ) : (
        <AdminWalletLedgerTable
          transactions={allTransactions}
          isLoading={isLoadingAll}
        />
      )}
    </div>
  );
}
