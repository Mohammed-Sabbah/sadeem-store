'use client';

import React, { useState, useMemo } from 'react';
import { useAdminStoresQuery, useAdminStoreMutations } from '@/features/admin/queries/useAdminQueries';
import {
  type AdminStoreTab,
  computeAdminStoreMetrics,
  filterAdminStores,
} from '@/features/admin/utils/storeFilters';
import { AdminStoreFilterBar } from '@/features/admin/components/AdminStoreFilterBar';
import { AdminStoreTable } from '@/features/admin/components/AdminStoreTable';
import { AdminStoreDetailsModal } from '@/features/admin/components/AdminStoreDetailsModal';
import type { AdminStoreItem } from '@/features/admin/types/admin.types';

export default function AdminStoresPage() {
  const { data: stores = [], isLoading } = useAdminStoresQuery();
  const {
    approveStore,
    rejectStore,
    toggleStoreStatus,
    isApproving,
    isRejecting,
    isToggling,
  } = useAdminStoreMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AdminStoreTab>('approved');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStore, setSelectedStore] = useState<AdminStoreItem | null>(null);

  const metrics = useMemo(() => computeAdminStoreMetrics(stores), [stores]);

  const filteredStores = useMemo(() => {
    return filterAdminStores(stores, {
      query: searchQuery,
      tab: activeTab,
      city: selectedCity,
    });
  }, [stores, searchQuery, activeTab, selectedCity]);

  const isBusy = isApproving || isRejecting || isToggling;

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & Context */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">
              إدارة شبكة المتاجر المعتمدة
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              متابعة كافة طلبات الانضمام والمتاجر الشريكة المعتمدة في المحافظة الوسطى، مع إمكانية التجميد والتنشيط الفوري.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-muted">
              إجمالي المتاجر المسجلة: <strong className="text-brand-dark">{metrics.total}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stores Table Card */}
      <div className="bg-brand-card rounded-2xl border border-brand-border shadow-2xs overflow-hidden">
        <AdminStoreFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          metrics={metrics}
          filteredCount={filteredStores.length}
        />

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-brand-muted">جارٍ تحميل شبكة المتاجر...</p>
          </div>
        ) : (
          <AdminStoreTable
            stores={filteredStores}
            onApprove={approveStore}
            onReject={rejectStore}
            onToggleStatus={toggleStoreStatus}
            onViewDetails={(store) => setSelectedStore(store)}
            isBusy={isBusy}
          />
        )}
      </div>

      {/* 3. Detailed Store Modal */}
      <AdminStoreDetailsModal
        store={selectedStore}
        isOpen={Boolean(selectedStore)}
        onClose={() => setSelectedStore(null)}
        onApprove={approveStore}
        onReject={rejectStore}
        onToggleStatus={toggleStoreStatus}
        isBusy={isBusy}
      />
    </div>
  );
}
