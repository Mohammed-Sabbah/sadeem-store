'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantProfileQuery } from '@/features/merchant/queries/useMerchantQueries';
import { useMerchantProductOperations } from '@/features/merchant/hooks/useMerchantProductOperations';
import MerchantDashboardHeader from '@/features/merchant/components/MerchantDashboardHeader';
import MerchantMetricsBar from '@/features/merchant/components/MerchantMetricsBar';
import MerchantProductList, { type FilterTab } from '@/features/merchant/components/MerchantProductList';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');

  const { data: store, isLoading: isLoadingStore } = useMerchantProfileQuery();
  const {
    products,
    metrics,
    isLoading: isLoadingProducts,
    handleToggleActive,
    handleDeleteProduct,
    handleQuickStockUpdate,
  } = useMerchantProductOperations();

  const isLoading = isLoadingStore || isLoadingProducts;

  // Strict Gatekeeper Rule: If store is not approved, route immediately to pending screen
  useEffect(() => {
    if (!isLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isLoading, router]);

  if (isLoading && !store) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-almarai">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ تهيئة محطة التاجر...</p>
      </div>
    );
  }

  if (store && store.approveStatus !== 'approved') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-almarai">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ توجيهك إلى شاشة متابعة طلب الاعتماد...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto py-16 text-center font-almarai">
        <h2 className="text-lg font-black text-brand-dark mb-2">لم يتم العثور على متجر مسجل</h2>
        <p className="text-xs text-brand-muted mb-6 leading-relaxed">
          سجل متجرك الآن في المحافظة الوسطى للانضمام لشبكة سَدِيم المعتمدة.
        </p>
        <button
          type="button"
          onClick={() => router.push('/merchant/join')}
          className="inline-flex px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors shadow-sm"
        >
          طلب انضمام متجر جديد
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-fadeIn font-almarai">
      {/* 1. Serene Page Action Bar (Title + Primary Action Button) */}
      <MerchantDashboardHeader
        store={store}
        onOpenAddModal={() => router.push('/merchant/products/new')}
      />

      {/* 2. Operations Pulse Strip (Quiet, zero box fatigue) */}
      <MerchantMetricsBar
        metrics={metrics}
        onFilterLowStock={() => setActiveFilterTab('out_of_stock')}
      />

      {/* 3. High-Density Product Catalog & Inventory Matrix */}
      <MerchantProductList
        products={products}
        onToggleActive={handleToggleActive}
        onDeleteProduct={handleDeleteProduct}
        onQuickStockChange={handleQuickStockUpdate}
        onOpenAddModal={() => router.push('/merchant/products/new')}
        activeFilterTab={activeFilterTab}
        onTabChange={setActiveFilterTab}
      />
    </div>
  );
}
